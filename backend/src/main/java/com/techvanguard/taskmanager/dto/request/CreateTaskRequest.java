package com.techvanguard.taskmanager.dto.request;

import com.techvanguard.taskmanager.enums.TaskPriority;
import com.techvanguard.taskmanager.enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO nhận dữ liệu khi người dùng tạo mới một công việc.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTaskRequest {

    /**
     * Tiêu đề công việc, bắt buộc phải có và không quá 200 ký tự.
     */
    @NotBlank(message = "Tiêu đề công việc không được để trống")
    @Size(max = 200, message = "Tiêu đề không được vượt quá 200 ký tự")
    private String title;

    /**
     * Mô tả chi tiết nội dung công việc.
     */
    private String description;

    /**
     * Trạng thái ban đầu (TODO, IN_PROGRESS, DONE). Nếu không truyền sẽ mặc định là TODO.
     */
    private TaskStatus status;

    /**
     * Mức độ ưu tiên (LOW, MEDIUM, HIGH). Nếu không truyền sẽ mặc định là MEDIUM.
     */
    private TaskPriority priority;

    /**
     * Hạn chót hoàn thành công việc.
     */
    private LocalDateTime dueDate;

    /**
     * Danh sách các tiêu đề đầu việc con (checklist) khởi tạo ban đầu (nếu có).
     */
    @Size(max = 50, message = "Không được tạo quá 50 đầu việc con cùng lúc")
    private List<String> subtaskTitles;
}
