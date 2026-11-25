package com.techvanguard.taskmanager.dto.request;

import com.techvanguard.taskmanager.enums.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO nhận yêu cầu cập nhật nhanh trạng thái công việc (chuyên biệt cho thao tác kéo thả trên Bảng Kanban).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTaskStatusRequest {

    /**
     * Trạng thái đích mới (TODO, IN_PROGRESS, DONE).
     */
    @NotNull(message = "Trạng thái mới không được để trống")
    private TaskStatus status;
}
