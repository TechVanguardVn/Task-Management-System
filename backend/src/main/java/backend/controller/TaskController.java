package backend.controller;

import java.net.URI;
import java.util.UUID;

import backend.dto.PageResponse;
import backend.dto.TaskRequest;
import backend.dto.TaskResponse;
import backend.dto.TaskStatusRequest;
import backend.enums.TaskPriority;
import backend.enums.TaskStatus;
import backend.security.AuthPrincipal;
import backend.service.TaskService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import io.swagger.v3.oas.annotations.Parameter;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TaskController {
    private final TaskService tasks;

    @PostMapping("/projects/{projectId}/tasks")
    public ResponseEntity<TaskResponse> create(@Parameter(hidden = true) @AuthenticationPrincipal AuthPrincipal principal,
                                               @PathVariable UUID projectId, @Valid @RequestBody TaskRequest request) {
        TaskResponse result = tasks.create(principal, projectId, request);
        return ResponseEntity.created(URI.create("/api/tasks/" + result.id())).body(result);
    }

    @GetMapping("/projects/{projectId}/tasks")
    public PageResponse<TaskResponse> list(@Parameter(hidden = true) @AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID projectId,
                                           @RequestParam(required = false) @Size(max = 255) String search,
                                           @RequestParam(required = false) TaskStatus status,
                                           @RequestParam(required = false) TaskPriority priority,
                                           @RequestParam(defaultValue = "0") @Min(0) int page,
                                           @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size,
                                           @RequestParam(defaultValue = "createdAt,desc") @Size(max = 64) String sort) {
        return tasks.list(principal, projectId, search, status, priority, page, size, sort);
    }

    @GetMapping("/tasks/{taskId}")
    public TaskResponse get(@Parameter(hidden = true) @AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID taskId) {
        return tasks.get(principal, taskId);
    }

    @PutMapping("/tasks/{taskId}")
    public TaskResponse update(@Parameter(hidden = true) @AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID taskId,
                               @Valid @RequestBody TaskRequest request) {
        return tasks.update(principal, taskId, request);
    }

    @PatchMapping("/tasks/{taskId}/status")
    public TaskResponse status(@Parameter(hidden = true) @AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID taskId,
                               @Valid @RequestBody TaskStatusRequest request) {
        return tasks.changeStatus(principal, taskId, request.status());
    }

    @DeleteMapping("/tasks/{taskId}")
    public ResponseEntity<Void> delete(@Parameter(hidden = true) @AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID taskId) {
        tasks.delete(principal, taskId);
        return ResponseEntity.noContent().build();
    }
}
