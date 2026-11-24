package backend.dto;

import java.time.LocalDate;
import java.util.UUID;

import backend.enums.TaskPriority;
import backend.enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TaskRequest(@NotBlank @Size(max = 255) String title,
                          @Size(max = 10000) String description,
                          TaskStatus status, TaskPriority priority, LocalDate dueDate, UUID projectId) {
    public TaskRequest {
        title = title == null ? null : title.strip();
        status = status == null ? TaskStatus.TODO : status;
        priority = priority == null ? TaskPriority.MEDIUM : priority;
    }
}
