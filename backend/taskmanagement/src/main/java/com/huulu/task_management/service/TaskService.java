package com.huulu.task_management.service;

import com.huulu.task_management.dto.request.TaskRequest;
import com.huulu.task_management.dto.request.TaskStatusRequest;
import com.huulu.task_management.dto.response.TaskResponse;
import com.huulu.task_management.entity.Task;
import com.huulu.task_management.entity.TaskPriority;
import com.huulu.task_management.entity.TaskStatus;
import com.huulu.task_management.entity.User;
import com.huulu.task_management.repository.TaskRepository;
import com.huulu.task_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class TaskService {
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    @Transactional
    public TaskResponse create(TaskRequest request) {
        User user = getCurrentUser();
        Task task = Task.builder()
                .user(user)
                .title(request.title().trim())
                .description(request.description())
                .status(defaultStatus(request.status()))
                .priority(defaultPriority(request.priority()))
                .dueDate(request.dueDate())
                .build();
        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional(readOnly = true)
    public TaskResponse getById(Long id) {
        return TaskResponse.from(findOwnedTask(id));
    }

    @Transactional(readOnly = true)
    public Page<TaskResponse> search(String keyword, TaskStatus status, TaskPriority priority, Pageable pageable) {
        String normalizedKeyword = keyword == null || keyword.isBlank() ? "" : keyword.trim();
        return taskRepository.searchByUser(getCurrentUser().getId(), normalizedKeyword, status, priority, pageable)
                .map(TaskResponse::from);
    }

    @Transactional
    public TaskResponse update(Long id, TaskRequest request) {
        Task task = findOwnedTask(id);
        task.setTitle(request.title().trim());
        task.setDescription(request.description());
        task.setStatus(defaultStatus(request.status()));
        task.setPriority(defaultPriority(request.priority()));
        task.setDueDate(request.dueDate());
        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse updateStatus(Long id, TaskStatusRequest request) {
        Task task = findOwnedTask(id);
        task.setStatus(request.status());
        return TaskResponse.from(task);
    }

    @Transactional
    public void delete(Long id) {
        Task task = findOwnedTask(id);
        taskRepository.delete(task);
    }

    private Task findOwnedTask(Long id) {
        return taskRepository.findByIdAndUserId(id, getCurrentUser().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication == null ? null : authentication.getName();
        if (email == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized"));
    }

    private TaskStatus defaultStatus(TaskStatus status) {
        return status == null ? TaskStatus.TODO : status;
    }

    private TaskPriority defaultPriority(TaskPriority priority) {
        return priority == null ? TaskPriority.MEDIUM : priority;
    }
}
