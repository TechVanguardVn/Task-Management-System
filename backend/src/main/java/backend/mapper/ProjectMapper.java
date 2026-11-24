package backend.mapper;

import backend.dto.ProjectRequest;
import backend.dto.ProjectResponse;
import backend.entity.Project;
import org.springframework.stereotype.Component;

@Component
public class ProjectMapper {
    public void apply(ProjectRequest request, Project project) {
        project.setName(request.name());
        project.setDescription(request.description());
        project.setColor(request.color());
        project.setStatus(request.status());
        project.setStartDate(request.startDate());
        project.setDueDate(request.dueDate());
    }

    public ProjectResponse toResponse(Project project) {
        return new ProjectResponse(project.getId(), project.getOwner().getId(), project.getName(),
                project.getDescription(), project.getColor(), project.getStatus(), project.getStartDate(),
                project.getDueDate(), project.getCreatedAt(), project.getUpdatedAt());
    }
}
