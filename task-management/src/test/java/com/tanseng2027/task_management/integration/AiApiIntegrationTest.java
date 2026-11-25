package com.tanseng2027.task_management.integration;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import com.tanseng2027.task_management.ai.AiClient;
import com.tanseng2027.task_management.ai.AiException;
import com.tanseng2027.task_management.ai.AiException.Reason;

/**
 * API /api/ai/** chạy với AiClient giả (không gọi Gemini thật, không cần API key).
 */
class AiApiIntegrationTest extends AbstractIntegrationTest {

    @MockitoBean
    private AiClient aiClient;

    private static final String VALID_JSON = """
            {"title":"Nộp báo cáo quý","description":"Trước 17:00","dueDate":"2026-12-04","priority":"HIGH","status":"IN_PROGRESS"}
            """;

    private static String body(String text) {
        return """
                {"text": "%s"}
                """.formatted(text);
    }

    @Test
    @DisplayName("GET /api/ai/status: phản ánh AI bật / tắt")
    void statusEndpoint() throws Exception {
        when(aiClient.isEnabled()).thenReturn(false);
        when(aiClient.modelName()).thenReturn("gemini-3.5-flash-lite");
        String token = login(ALICE);

        mockMvc.perform(get("/api/ai/status").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false))
                .andExpect(jsonPath("$.model").value("gemini-3.5-flash-lite"))
                .andExpect(jsonPath("$.maxRequestsPerHour").value(20));
    }

    @Test
    @DisplayName("POST /api/ai/parse-task: trả về gợi ý, KHÔNG tự tạo task")
    void parseTask_returnsSuggestion() throws Exception {
        when(aiClient.isEnabled()).thenReturn(true);
        when(aiClient.generateJson(anyString(), anyString(), any())).thenReturn(VALID_JSON);
        String token = login(ALICE);

        mockMvc.perform(post("/api/ai/parse-task").header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("Nộp báo cáo quý trước 5h chiều thứ 6, gấp")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Nộp báo cáo quý"))
                .andExpect(jsonPath("$.description").value("Trước 17:00"))
                .andExpect(jsonPath("$.dueDate").value("2026-12-04"))
                .andExpect(jsonPath("$.priority").value("HIGH"))
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        // Không có task mới nào được tạo (vẫn 10 task seed)
        mockMvc.perform(get("/api/tasks").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(jsonPath("$.totalElements").value(10));
    }

    @Test
    @DisplayName("Câu trống hoặc quá 500 ký tự → 400")
    void parseTask_validation() throws Exception {
        when(aiClient.isEnabled()).thenReturn(true);
        String token = login(ALICE);

        mockMvc.perform(post("/api/ai/parse-task").header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(body("   ")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.text").exists());
        mockMvc.perform(post("/api/ai/parse-task").header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(body("a".repeat(501))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Chưa cấu hình AI → 503; AI lỗi → 503; AI hết hạn mức → 429; kết quả sai → 502")
    void parseTask_errorMapping() throws Exception {
        String token = login(ALICE);

        when(aiClient.isEnabled()).thenReturn(false);
        mockMvc.perform(post("/api/ai/parse-task").header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(body("x")))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.message").value("Tính năng AI chưa được bật (chưa cấu hình AI_API_KEY)"));

        when(aiClient.isEnabled()).thenReturn(true);
        when(aiClient.generateJson(anyString(), anyString(), any()))
                .thenThrow(new AiException(Reason.UNAVAILABLE, "down"))
                .thenThrow(new AiException(Reason.RATE_LIMITED, "quota"))
                .thenReturn("sai", "vẫn sai");
        mockMvc.perform(post("/api/ai/parse-task").header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(body("x")))
                .andExpect(status().isServiceUnavailable());
        mockMvc.perform(post("/api/ai/parse-task").header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(body("x")))
                .andExpect(status().isTooManyRequests());
        mockMvc.perform(post("/api/ai/parse-task").header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(body("x")))
                .andExpect(status().isBadGateway());
    }

    @Test
    @DisplayName("Mỗi user tối đa 20 lượt / giờ → lượt thứ 21 bị 429")
    void parseTask_rateLimitedPerUser() throws Exception {
        when(aiClient.isEnabled()).thenReturn(true);
        when(aiClient.generateJson(anyString(), anyString(), any())).thenReturn(VALID_JSON);
        String token = login(BOB); // dùng Bob để không ảnh hưởng lượt của Alice ở các test khác

        for (int i = 0; i < 20; i++) {
            mockMvc.perform(post("/api/ai/parse-task").header(HttpHeaders.AUTHORIZATION, bearer(token))
                            .contentType(MediaType.APPLICATION_JSON).content(body("x")))
                    .andExpect(status().isOk());
        }
        mockMvc.perform(post("/api/ai/parse-task").header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(body("x")))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("hết 20 lượt")));
    }

    @Test
    @DisplayName("Không có token → 401")
    void requiresLogin() throws Exception {
        mockMvc.perform(get("/api/ai/status")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/ai/parse-task").contentType(MediaType.APPLICATION_JSON).content("{\"text\":\"x\"}"))
                .andExpect(status().isUnauthorized());
    }
}
