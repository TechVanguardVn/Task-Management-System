package backend.mapper;

import backend.dto.TaskRequest;
import backend.dto.TaskResponse;
import backend.entity.Task;
import org.springframework.stereotype.Component;

@Component
public class TaskMapper {
    public void apply(TaskRequest request, Task task) {
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setStatus(request.status());
        task.setPriority(request.priority());
        task.setDueDate(request.dueDate());
    }

    public TaskResponse toResponse(Task task) {
        return new TaskResponse(task.getId(), task.getTitle(), task.getDescription(), task.getStatus(),
                task.getPriority(), task.getDueDate(), task.getCompletedAt(), task.getProject().getId(),
                task.getCreatedAt(), task.getUpdatedAt());
    }
}
