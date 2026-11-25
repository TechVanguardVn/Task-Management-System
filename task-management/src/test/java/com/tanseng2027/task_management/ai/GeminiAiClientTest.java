package com.tanseng2027.task_management.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.net.SocketTimeoutException;
import java.time.Duration;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.ExpectedCount;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import com.tanseng2027.task_management.ai.AiException.Reason;

import tools.jackson.databind.json.JsonMapper;

/**
 * Kiểm tra GeminiAiClient gửi request và đọc response ĐÚNG định dạng Interactions API
 * mà không cần API key: server Gemini được giả lập bằng MockRestServiceServer.
 * Response mẫu lấy theo ví dụ trong tài liệu Gemini (Interactions API reference).
 */
class GeminiAiClientTest {

    private static final String BASE_URL = "https://gemini.test";
    private static final Map<String, Object> SCHEMA = Map.of("type", "object");

    private MockRestServiceServer server;
    private GeminiAiClient client;

    @BeforeEach
    void setUp() {
        client = newClient("test-key");
    }

    private GeminiAiClient newClient(String apiKey) {
        AiProperties props = new AiProperties(apiKey, BASE_URL, "gemini-3.5-flash-lite", "2026-05-20",
                Duration.ofSeconds(5), 20, 200);
        RestClient.Builder builder = RestClient.builder().baseUrl(BASE_URL);
        server = MockRestServiceServer.bindTo(builder).build();
        GeminiAiClient created = new GeminiAiClient(props, builder.build(), JsonMapper.builder().build());
        created.retryDelay = Duration.ZERO; // test không phải chờ khi thử lại
        return created;
    }

    /** Response hoàn chỉnh theo mẫu tài liệu, chỉ thay nội dung text. */
    private static String completedResponse(String text) {
        return """
                {
                  "created": "2025-12-04T15:01:45Z",
                  "id": "v1_abc",
                  "model": "gemini-3.5-flash-lite",
                  "object": "interaction",
                  "status": "completed",
                  "steps": [
                    { "type": "model_output", "content": [ { "type": "text", "text": %s } ] }
                  ],
                  "usage": { "total_input_tokens": 7, "total_output_tokens": 23, "total_tokens": 30 }
                }
                """.formatted(JsonMapper.builder().build().writeValueAsString(text));
    }

    @Test
    @DisplayName("Gửi đúng endpoint, header và body theo Interactions API; trả về text của model_output")
    void sendsCorrectRequestAndReadsText() {
        server.expect(requestTo(BASE_URL + "/v1beta/interactions"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("x-goog-api-key", "test-key"))
                .andExpect(header("Api-Revision", "2026-05-20"))
                .andExpect(header("Content-Type", MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.model").value("gemini-3.5-flash-lite"))
                .andExpect(jsonPath("$.system_instruction").value("SYSTEM"))
                .andExpect(jsonPath("$.input").value("Nộp báo cáo thứ 6"))
                .andExpect(jsonPath("$.response_format.type").value("text"))
                .andExpect(jsonPath("$.response_format.mime_type").value("application/json"))
                .andExpect(jsonPath("$.response_format.schema.type").value("object"))
                .andExpect(jsonPath("$.generation_config.thinking_level").value("minimal"))
                .andExpect(jsonPath("$.generation_config.max_output_tokens").isNumber())
                .andRespond(withSuccess(completedResponse("{\"title\":\"Nộp báo cáo\"}"), MediaType.APPLICATION_JSON));

        String result = client.generateJson("SYSTEM", "Nộp báo cáo thứ 6", SCHEMA);

        assertThat(result).isEqualTo("{\"title\":\"Nộp báo cáo\"}");
        server.verify();
    }

    @Test
    @DisplayName("Nhiều khối text và nhiều step → ghép text của bước model_output cuối cùng")
    void joinsTextOfLastModelOutputStep() {
        String body = """
                { "status": "completed", "steps": [
                    { "type": "model_output", "content": [ { "type": "text", "text": "cũ" } ] },
                    { "type": "thought", "content": [] },
                    { "type": "model_output", "content": [
                        { "type": "text", "text": "{\\"a\\":" }, { "type": "text", "text": "1}" } ] }
                ] }
                """;
        server.expect(requestTo(BASE_URL + "/v1beta/interactions"))
                .andRespond(withSuccess(body, MediaType.APPLICATION_JSON));

        assertThat(client.generateJson("S", "I", SCHEMA)).isEqualTo("{\"a\":1}");
    }

    @Test
    @DisplayName("Chưa có API key → NOT_CONFIGURED, không gọi ra ngoài")
    void notConfigured_doesNotCallApi() {
        GeminiAiClient disabled = newClient("  ");

        assertThat(disabled.isEnabled()).isFalse();
        assertThatThrownBy(() -> disabled.generateJson("S", "I", SCHEMA))
                .isInstanceOfSatisfying(AiException.class, e -> assertThat(e.getReason()).isEqualTo(Reason.NOT_CONFIGURED));
        server.verify(); // không có request nào
    }

    @Test
    @DisplayName("Gemini trả 429 (hết hạn mức) → RATE_LIMITED")
    void quotaExceeded_isRateLimited() {
        server.expect(requestTo(BASE_URL + "/v1beta/interactions"))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS)
                        .body("{\"error\":{\"code\":429,\"status\":\"RESOURCE_EXHAUSTED\"}}")
                        .contentType(MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> client.generateJson("S", "I", SCHEMA))
                .isInstanceOfSatisfying(AiException.class, e -> assertThat(e.getReason()).isEqualTo(Reason.RATE_LIMITED));
    }

    @Test
    @DisplayName("Sai API key (403) → UNAVAILABLE ngay, không thử lại")
    void clientError_isUnavailableWithoutRetry() {
        server.expect(ExpectedCount.once(), requestTo(BASE_URL + "/v1beta/interactions"))
                .andRespond(withStatus(HttpStatus.FORBIDDEN));
        assertThatThrownBy(() -> client.generateJson("S", "I", SCHEMA))
                .isInstanceOfSatisfying(AiException.class, e -> assertThat(e.getReason()).isEqualTo(Reason.UNAVAILABLE));
        server.verify();
    }

    @Test
    @DisplayName("Gemini quá tải (503) lần đầu → tự thử lại 1 lần và thành công")
    void overloaded_retriesOnceThenSucceeds() {
        server.expect(requestTo(BASE_URL + "/v1beta/interactions"))
                .andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE)
                        .body("{\"error\":{\"code\":503,\"message\":\"high demand\"}}")
                        .contentType(MediaType.APPLICATION_JSON));
        server.expect(requestTo(BASE_URL + "/v1beta/interactions"))
                .andRespond(withSuccess(completedResponse("{\"a\":1}"), MediaType.APPLICATION_JSON));

        assertThat(client.generateJson("S", "I", SCHEMA)).isEqualTo("{\"a\":1}");
        server.verify();
    }

    @Test
    @DisplayName("Gemini lỗi 5xx cả 2 lần → UNAVAILABLE với thông báo quá tải")
    void serverErrorTwice_isUnavailable() {
        server.expect(ExpectedCount.times(2), requestTo(BASE_URL + "/v1beta/interactions"))
                .andRespond(withStatus(HttpStatus.INTERNAL_SERVER_ERROR));
        assertThatThrownBy(() -> client.generateJson("S", "I", SCHEMA))
                .isInstanceOfSatisfying(AiException.class, e -> {
                    assertThat(e.getReason()).isEqualTo(Reason.UNAVAILABLE);
                    assertThat(e.getMessage()).contains("quá tải");
                });
        server.verify();
    }

    @Test
    @DisplayName("Quá thời gian chờ → UNAVAILABLE")
    void timeout_isUnavailable() {
        server.expect(requestTo(BASE_URL + "/v1beta/interactions"))
                .andRespond(withException(new SocketTimeoutException("Read timed out")));

        assertThatThrownBy(() -> client.generateJson("S", "I", SCHEMA))
                .isInstanceOfSatisfying(AiException.class, e -> assertThat(e.getReason()).isEqualTo(Reason.UNAVAILABLE));
    }

    @Test
    @DisplayName("status incomplete / không có model_output / text rỗng → INVALID_OUTPUT (để service thử lại)")
    void unusableResponses_areInvalidOutput() {
        String[] bodies = {
            "{\"status\":\"incomplete\",\"steps\":[]}",
            "{\"status\":\"completed\",\"steps\":[{\"type\":\"thought\",\"content\":[]}]}",
            "{\"status\":\"completed\",\"steps\":[{\"type\":\"model_output\",\"content\":[{\"type\":\"text\",\"text\":\"   \"}]}]}",
            "khong-phai-json",
        };
        for (String body : bodies) {
            server.reset();
            server.expect(requestTo(BASE_URL + "/v1beta/interactions")).andRespond(withSuccess(body, MediaType.APPLICATION_JSON));
            assertThatThrownBy(() -> client.generateJson("S", "I", SCHEMA))
                    .as(body)
                    .isInstanceOfSatisfying(AiException.class, e -> assertThat(e.getReason()).isEqualTo(Reason.INVALID_OUTPUT));
        }
    }

    @Test
    @DisplayName("status failed → UNAVAILABLE")
    void failedStatus_isUnavailable() {
        server.expect(requestTo(BASE_URL + "/v1beta/interactions"))
                .andRespond(withSuccess("{\"status\":\"failed\",\"steps\":[]}", MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> client.generateJson("S", "I", SCHEMA))
                .isInstanceOfSatisfying(AiException.class, e -> assertThat(e.getReason()).isEqualTo(Reason.UNAVAILABLE));
    }
}
