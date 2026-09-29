package com.huulu.task_management.dto.request;

import com.huulu.task_management.entity.TaskPriority;
import com.huulu.task_management.entity.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record TaskRequest(
        @NotBlank @Size(max = 255) String title,
        String description,
        TaskStatus status,
        TaskPriority priority,
        LocalDate dueDate
) {
}
