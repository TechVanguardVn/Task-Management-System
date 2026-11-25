package com.tanseng2027.task_management.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tanseng2027.task_management.dto.request.TaskRequest;
import com.tanseng2027.task_management.dto.response.PageResponse;
import com.tanseng2027.task_management.dto.response.TaskResponse;
import com.tanseng2027.task_management.entity.Task;
import com.tanseng2027.task_management.entity.TaskPriority;
import com.tanseng2027.task_management.entity.TaskStatus;
import com.tanseng2027.task_management.entity.User;
import com.tanseng2027.task_management.exception.ResourceNotFoundException;
import com.tanseng2027.task_management.repository.TaskRepository;
import com.tanseng2027.task_management.repository.TaskSpecification;

import lombok.RequiredArgsConstructor;

/**
 * Mọi thao tác đều gắn với user đang đăng nhập, nên user chỉ đọc/sửa/xóa được task của mình.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaskService {

    private final TaskRepository taskRepository;

    public PageResponse<TaskResponse> getTasks(User user, String keyword,
                                               TaskStatus status, TaskPriority priority,
                                               Pageable pageable) {
        Page<Task> page = taskRepository.findAll(
                TaskSpecification.filter(user.getId(), keyword, status, priority), pageable);
        return PageResponse.from(page, TaskResponse::from);
    }

    public TaskResponse getTask(User user, Long id) {
        return TaskResponse.from(findOwnedTask(user, id));
    }

    @Transactional
    public TaskResponse createTask(User user, TaskRequest request) {
        Task task = Task.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : TaskStatus.TODO)
                .priority(request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM)
                .dueDate(request.getDueDate())
                .user(user)
                .build();
        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateTask(User user, Long id, TaskRequest request) {
        Task task = findOwnedTask(user, id);

        task.setTitle(request.getTitle().trim());
        task.setDescription(request.getDescription());
        task.setDueDate(request.getDueDate());
        // Không gửi status/priority thì giữ nguyên giá trị cũ
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }
        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }

        // saveAndFlush để @PreUpdate chạy ngay → updatedAt trong response là giá trị mới
        return TaskResponse.from(taskRepository.saveAndFlush(task));
    }

    @Transactional
    public void deleteTask(User user, Long id) {
        taskRepository.delete(findOwnedTask(user, id));
    }

    // Task không tồn tại HOẶC thuộc user khác đều trả 404 → không để lộ việc task đó có tồn tại
    private Task findOwnedTask(User user, Long id) {
        return taskRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy task với id = " + id));
    }
}
