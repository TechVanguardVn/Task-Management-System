package backend.service;

import java.util.UUID;

import backend.dto.PageResponse;
import backend.dto.ProjectRequest;
import backend.dto.ProjectResponse;
import backend.entity.Project;
import backend.enums.ProjectStatus;
import backend.exception.ResourceNotFoundException;
import backend.mapper.ProjectMapper;
import backend.repository.ProjectRepository;
import backend.repository.UserRepository;
import backend.security.AuthPrincipal;
import backend.security.RlsContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProjectService {
    private final ProjectRepository projects;
    private final UserRepository users;
    private final RlsContext context;
    private final ProjectMapper mapper;

    @Transactional
    public ProjectResponse create(AuthPrincipal principal, ProjectRequest request) {
        context.asUser(principal.userId());
        Project project = new Project(users.getReferenceById(principal.userId()), request.name());
        mapper.apply(request, project);
        return mapper.toResponse(projects.saveAndFlush(project));
    }

    @Transactional(readOnly = true)
    public PageResponse<ProjectResponse> list(AuthPrincipal principal, int page, int size) {
        context.asUser(principal.userId());
        var result = projects.findAllByOwner_Id(principal.userId(), PageRequest.of(page, size,
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))));
        return new PageResponse<>(result.getContent().stream().map(mapper::toResponse).toList(),
                result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    @Transactional(readOnly = true)
    public ProjectResponse get(AuthPrincipal principal, UUID id) {
        context.asUser(principal.userId());
        return mapper.toResponse(projects.findByIdAndOwner_Id(id, principal.userId()).orElseThrow(this::notFound));
    }

    @Transactional
    public ProjectResponse update(AuthPrincipal principal, UUID id, ProjectRequest request) {
        context.asUser(principal.userId());
        Project project = ownedForUpdate(principal, id);
        mapper.apply(request, project);
        projects.flush();
        return mapper.toResponse(project);
    }

    @Transactional
    public ProjectResponse archive(AuthPrincipal principal, UUID id) {
        context.asUser(principal.userId());
        Project project = ownedForUpdate(principal, id);
        project.setStatus(ProjectStatus.ARCHIVED);
        projects.flush();
        return mapper.toResponse(project);
    }

    @Transactional
    public void delete(AuthPrincipal principal, UUID id) {
        context.asUser(principal.userId());
        projects.delete(ownedForUpdate(principal, id));
        projects.flush();
    }

    private Project ownedForUpdate(AuthPrincipal principal, UUID id) {
        return projects.findOwnedForUpdate(id, principal.userId()).orElseThrow(this::notFound);
    }

    private ResourceNotFoundException notFound() {
        return new ResourceNotFoundException("Project not found");
    }
}
