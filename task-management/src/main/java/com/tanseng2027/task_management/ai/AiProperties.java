package com.tanseng2027.task_management.ai;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Cấu hình tính năng AI (prefix "ai" trong application.yml, đọc từ biến môi trường AI_*).
 *
 * @param apiKey             API key của Gemini. Để trống → tắt tính năng AI, app vẫn chạy bình thường
 * @param baseUrl            địa chỉ Gemini API
 * @param model              tên model, vd: gemini-3.5-flash-lite
 * @param apiRevision        giá trị header Api-Revision của Interactions API
 * @param timeout            thời gian chờ tối đa cho 1 lần gọi AI
 * @param maxRequestsPerHour số lần gọi AI tối đa của 1 user trong 1 giờ (bảo vệ hạn mức miễn phí)
 * @param maxRequestsPerDay  tổng số lần gọi AI tối đa của CẢ APP trong 24 giờ (0 = không giới hạn)
 */
@ConfigurationProperties(prefix = "ai")
public record AiProperties(
        String apiKey,
        String baseUrl,
        String model,
        String apiRevision,
        Duration timeout,
        int maxRequestsPerHour,
        int maxRequestsPerDay) {

    public boolean enabled() {
        return apiKey != null && !apiKey.isBlank();
    }
}
