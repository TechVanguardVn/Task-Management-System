package com.tanseng2027.task_management.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AiParseTaskRequest(
        @Schema(example = "Nộp báo cáo quý cho sếp trước 5h chiều thứ 6, gấp")
        @NotBlank(message = "Vui lòng nhập mô tả công việc")
        @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
        String text) {
}
