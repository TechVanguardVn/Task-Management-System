package com.huulu.task_management.dto.request;

import com.huulu.task_management.entity.TaskStatus;
import jakarta.validation.constraints.NotNull;

public record TaskStatusRequest(@NotNull TaskStatus status) {
}
