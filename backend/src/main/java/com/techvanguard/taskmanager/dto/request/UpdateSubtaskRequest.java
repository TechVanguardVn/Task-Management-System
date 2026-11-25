package com.techvanguard.taskmanager.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO nhận dữ liệu khi cập nhật tiêu đề hoặc trạng thái của một Subtask.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSubtaskRequest {

    @NotBlank(message = "Tên đầu việc con không được để trống")
    @Size(max = 200, message = "Tên đầu việc con không được vượt quá 200 ký tự")
    private String title;

    private Boolean isCompleted;
}
