package backend.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import backend.enums.TaskPriority;
import backend.enums.TaskStatus;

public record TaskResponse(UUID id, String title, String description, TaskStatus status, TaskPriority priority,
                           LocalDate dueDate, Instant completedAt, UUID projectId, Instant createdAt, Instant updatedAt) {
}
