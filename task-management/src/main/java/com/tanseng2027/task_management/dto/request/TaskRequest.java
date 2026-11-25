package com.tanseng2027.task_management.dto.request;

import java.time.LocalDate;

import com.tanseng2027.task_management.entity.TaskPriority;
import com.tanseng2027.task_management.entity.TaskStatus;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TaskRequest {

    @Schema(example = "Viết API tìm kiếm task")
    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 255, message = "Tiêu đề tối đa 255 ký tự")
    private String title;

    @Schema(example = "Tìm theo tiêu đề, lọc theo trạng thái và mức ưu tiên")
    @Size(max = 5000, message = "Mô tả tối đa 5000 ký tự")
    private String description;

    @Schema(description = "Mặc định TODO khi tạo mới; giữ nguyên khi cập nhật nếu không gửi", example = "TODO")
    private TaskStatus status;

    @Schema(description = "Mặc định MEDIUM khi tạo mới; giữ nguyên khi cập nhật nếu không gửi", example = "HIGH")
    private TaskPriority priority;

    @Schema(description = "Hạn hoàn thành, định dạng yyyy-MM-dd", example = "2026-12-31")
    private LocalDate dueDate;
}
