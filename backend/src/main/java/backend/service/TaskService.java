package backend.service;

import java.util.Map;
import java.util.Set;
import java.util.HashMap;
import java.util.Comparator;
import java.util.TreeSet;
import java.util.UUID;

import backend.dto.PageResponse;
import backend.dto.TaskRequest;
import backend.dto.TaskResponse;
import backend.entity.Project;
import backend.entity.Task;
import backend.enums.ProjectStatus;
import backend.enums.TaskPriority;
import backend.enums.TaskStatus;
import backend.exception.BusinessException;
import backend.exception.ResourceNotFoundException;
import backend.mapper.TaskMapper;
import backend.repository.ProjectRepository;
import backend.repository.TaskRepository;
import backend.repository.TaskSpecifications;
import backend.security.AuthPrincipal;
import backend.security.RlsContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TaskService {
    private static final Set<String> SORT_FIELDS = Set.of("id", "title", "status", "priority", "dueDate",
            "completedAt", "createdAt", "updatedAt");
    private final TaskRepository tasks;
    private final ProjectRepository projects;
    private final RlsContext context;
    private final TaskMapper mapper;

    @Transactional
    public TaskResponse create(AuthPrincipal principal, UUID projectId, TaskRequest request) {
        context.asUser(principal.userId());
        Project project = lockProject(principal, projectId);
        if (request.projectId() != null && !request.projectId().equals(projectId)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "projectId must match the URL project");
        }
        Task task = new Task(project, request.title());
        mapper.apply(request, task);
        return mapper.toResponse(tasks.saveAndFlush(task));
    }

    @Transactional(readOnly = true)
    public PageResponse<TaskResponse> list(AuthPrincipal principal, UUID projectId, String search,
                                           TaskStatus status, TaskPriority priority, int page, int size, String sort) {
        context.asUser(principal.userId());
        projects.findByIdAndOwner_Id(projectId, principal.userId()).orElseThrow(this::projectNotFound);
        var result = tasks.findAll(TaskSpecifications.ownedTasks(projectId, principal.userId(), search, status, priority),
                PageRequest.of(page, size, parseSort(sort)));
        return new PageResponse<>(result.getContent().stream().map(mapper::toResponse).toList(), result.getNumber(),
                result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    @Transactional(readOnly = true)
    public TaskResponse get(AuthPrincipal principal, UUID id) {
        context.asUser(principal.userId());
        return mapper.toResponse(tasks.findByIdAndProject_Owner_Id(id, principal.userId()).orElseThrow(this::taskNotFound));
    }

    @Transactional
    public TaskResponse update(AuthPrincipal principal, UUID id, TaskRequest request) {
        context.asUser(principal.userId());
        LockedTask locked = lockTask(principal, id, request.projectId());
        locked.task().setProject(locked.target());
        mapper.apply(request, locked.task());
        tasks.flush();
        return mapper.toResponse(locked.task());
    }

    @Transactional
    public TaskResponse changeStatus(AuthPrincipal principal, UUID id, TaskStatus status) {
        context.asUser(principal.userId());
        Task task = lockTask(principal, id, null).task();
        task.setStatus(status);
        tasks.flush();
        return mapper.toResponse(task);
    }

    @Transactional
    public void delete(AuthPrincipal principal, UUID id) {
        context.asUser(principal.userId());
        tasks.delete(lockTask(principal, id, null).task());
        tasks.flush();
    }

    private LockedTask lockTask(AuthPrincipal principal, UUID id, UUID targetId) {
        UUID originalId = tasks.findOwnedProjectId(id, principal.userId()).orElseThrow(this::taskNotFound);
        UUID destinationId = targetId == null ? originalId : targetId;
        var orderedIds = new TreeSet<UUID>(Comparator.comparing(UUID::toString));
        orderedIds.add(originalId);
        orderedIds.add(destinationId);
        Map<UUID, Project> parents = new HashMap<>();
        for (UUID parentId : orderedIds) { parents.put(parentId, lockProject(principal, parentId)); }
        Task task = tasks.findOwnedForUpdate(id, principal.userId()).orElseThrow(this::taskNotFound);
        if (!task.getProject().getId().equals(originalId)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Task moved concurrently; retry the request");
        }
        return new LockedTask(task, parents.get(destinationId));
    }

    private Project lockProject(AuthPrincipal principal, UUID id) {
        Project project = projects.findOwnedForUpdate(id, principal.userId()).orElseThrow(this::projectNotFound);
        if (project.getStatus() == ProjectStatus.ARCHIVED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Tasks in archived projects cannot be modified");
        }
        return project;
    }

    private Sort parseSort(String value) {
        String[] parts = value.split(",", -1);
        if (parts.length != 2 || !SORT_FIELDS.contains(parts[0])
                || !(parts[1].equalsIgnoreCase("asc") || parts[1].equalsIgnoreCase("desc"))) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Invalid sort; use an allowed field followed by asc or desc");
        }
        Sort sort = Sort.by(Sort.Direction.fromString(parts[1]), parts[0]);
        return parts[0].equals("id") ? sort : sort.and(Sort.by("id"));
    }

    private ResourceNotFoundException taskNotFound() { return new ResourceNotFoundException("Task not found"); }
    private ResourceNotFoundException projectNotFound() { return new ResourceNotFoundException("Project not found"); }
    private record LockedTask(Task task, Project target) { }
}
