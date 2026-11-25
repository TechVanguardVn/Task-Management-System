package com.tanseng2027.task_management.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

public record AiStatusResponse(
        @Schema(description = "false khi server chưa cấu hình AI_API_KEY", example = "true")
        boolean enabled,

        @Schema(example = "gemini-3.5-flash-lite")
        String model,

        @Schema(description = "Số lần gọi AI tối đa của 1 user trong 1 giờ", example = "20")
        int maxRequestsPerHour) {
}
