package com.tanseng2027.task_management.ai;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import com.tanseng2027.task_management.ai.AiException.Reason;

import lombok.extern.slf4j.Slf4j;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Slf4j
public class GeminiAiClient implements AiClient {

    static final String INTERACTIONS_PATH = "/v1beta/interactions";
    private static final int MAX_OUTPUT_TOKENS = 1024;
    private static final int MAX_ATTEMPTS = 2; // Gemini lỗi 5xx (quá tải) → thử lại 1 lần

    /** Thời gian chờ trước khi thử lại (test đặt = 0 cho nhanh). */
    Duration retryDelay = Duration.ofSeconds(1);

    private final AiProperties properties;
    private final RestClient restClient;
    private final JsonMapper jsonMapper;

    public GeminiAiClient(AiProperties properties, RestClient restClient, JsonMapper jsonMapper) {
        this.properties = properties;
        this.restClient = restClient;
        this.jsonMapper = jsonMapper;
    }

    @Override
    public boolean isEnabled() {
        return properties.enabled();
    }

    @Override
    public String modelName() {
        return properties.model();
    }

    @Override
    public String generateJson(String systemInstruction, String input, Map<String, Object> jsonSchema) {
        if (!isEnabled()) {
            throw new AiException(Reason.NOT_CONFIGURED, "Tính năng AI chưa được bật (chưa cấu hình AI_API_KEY)");
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", properties.model());
        body.put("system_instruction", systemInstruction);
        body.put("input", input);
        body.put("response_format", Map.of(
                "type", "text",
                "mime_type", "application/json",
                "schema", jsonSchema));
        // Trích xuất thông tin đơn giản → suy nghĩ ở mức thấp nhất cho nhanh và tiết kiệm
        body.put("generation_config", Map.of(
                "thinking_level", "minimal",
                "max_output_tokens", MAX_OUTPUT_TOKENS));

        byte[] requestBody = jsonMapper.writeValueAsBytes(body);
        for (int attempt = 1; ; attempt++) {
            try {
                return extractText(send(requestBody));
            } catch (HttpServerErrorException e) {
                // 500/503: Gemini đang quá tải ("high demand") - thường hết sau vài giây → thử lại 1 lần
                log.warn("Gemini API lỗi HTTP {} (lần {}/{}): {}", e.getStatusCode().value(), attempt,
                        MAX_ATTEMPTS, abbreviate(e.getResponseBodyAsString()));
                if (attempt >= MAX_ATTEMPTS) {
                    throw new AiException(Reason.UNAVAILABLE,
                            "AI đang quá tải, bạn thử lại sau ít phút hoặc nhập tay nhé", e);
                }
                pause();
            }
        }
    }

    private byte[] send(byte[] requestBody) {
        try {
            return restClient.post()
                    .uri(INTERACTIONS_PATH)
                    .header("x-goog-api-key", properties.apiKey())
                    .header("Api-Revision", properties.apiRevision())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(byte[].class);
        } catch (HttpClientErrorException.TooManyRequests e) {
            log.warn("Gemini API: hết hạn mức (429)");
            throw new AiException(Reason.RATE_LIMITED,
                    "AI đã hết lượt sử dụng miễn phí, vui lòng thử lại sau", e);
        } catch (HttpClientErrorException e) {
            // 400/401/403 thường do sai API key hoặc sai tên model → xem log server
            log.warn("Gemini API trả lỗi HTTP {}: {}", e.getStatusCode().value(), abbreviate(e.getResponseBodyAsString()));
            throw new AiException(Reason.UNAVAILABLE, "AI tạm thời không khả dụng, bạn có thể nhập tay", e);
        } catch (ResourceAccessException e) {
            log.warn("Không kết nối được Gemini API: {}", e.getMessage());
            throw new AiException(Reason.UNAVAILABLE, "AI phản hồi quá lâu hoặc không kết nối được, vui lòng thử lại", e);
        }
    }

    private void pause() {
        try {
            Thread.sleep(retryDelay);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new AiException(Reason.UNAVAILABLE, "AI tạm thời không khả dụng, bạn có thể nhập tay", e);
        }
    }

    /** Lấy phần text của bước "model_output" cuối cùng trong response. */
    String extractText(byte[] responseBody) {
        JsonNode root;
        try {
            root = jsonMapper.readTree(responseBody);
        } catch (JacksonException e) {
            throw new AiException(Reason.INVALID_OUTPUT, "AI trả về dữ liệu không đọc được", e);
        }

        String status = root.path("status").asString("");
        if ("failed".equals(status) || "cancelled".equals(status)) {
            log.warn("Gemini interaction kết thúc với status={}", status);
            throw new AiException(Reason.UNAVAILABLE, "AI tạm thời không khả dụng, bạn có thể nhập tay");
        }
        if (!"completed".equals(status)) {
            // vd: "incomplete" (hết max_output_tokens)
            log.warn("Gemini interaction chưa hoàn tất: status={}", status);
            throw new AiException(Reason.INVALID_OUTPUT, "AI chưa trả lời xong");
        }

        JsonNode steps = root.path("steps");
        for (int i = steps.size() - 1; i >= 0; i--) {
            JsonNode step = steps.get(i);
            if (!"model_output".equals(step.path("type").asString(""))) {
                continue;
            }
            StringBuilder text = new StringBuilder();
            JsonNode content = step.path("content");
            for (int j = 0; j < content.size(); j++) {
                JsonNode block = content.get(j);
                if ("text".equals(block.path("type").asString(""))) {
                    text.append(block.path("text").asString(""));
                }
            }
            if (!text.toString().isBlank()) {
                return text.toString();
            }
        }
        throw new AiException(Reason.INVALID_OUTPUT, "AI không trả về nội dung");
    }

    private static String abbreviate(String value) {
        if (value == null) return "";
        return value.length() <= 300 ? value : value.substring(0, 300) + "...";
    }
}
