package com.tanseng2027.task_management.dto.response;

import java.time.LocalDate;

import com.tanseng2027.task_management.entity.TaskPriority;
import com.tanseng2027.task_management.entity.TaskStatus;

import io.swagger.v3.oas.annotations.media.Schema;

public record AiTaskSuggestion(
        @Schema(example = "Nộp báo cáo quý cho sếp")
        String title,

        @Schema(description = "null nếu câu không có thêm chi tiết", example = "Hạn trước 17:00")
        String description,

        @Schema(description = "null nếu câu không nhắc tới thời hạn", example = "2026-11-27")
        LocalDate dueDate,

        @Schema(example = "HIGH")
        TaskPriority priority,

        @Schema(description = "null nếu câu không nói tới tiến độ (giữ nguyên trạng thái đang chọn)",
                example = "IN_PROGRESS")
        TaskStatus status) {
}
