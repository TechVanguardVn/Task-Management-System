package backend.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import backend.enums.ProjectStatus;

public record ProjectResponse(UUID id, UUID ownerId, String name, String description, String color,
                              ProjectStatus status, LocalDate startDate, LocalDate dueDate,
                              Instant createdAt, Instant updatedAt) {
}
