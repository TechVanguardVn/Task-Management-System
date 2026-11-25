package com.techvanguard.taskmanager.service.implement;

import com.techvanguard.taskmanager.dto.request.CreateTaskRequest;
import com.techvanguard.taskmanager.dto.request.UpdateTaskRequest;
import com.techvanguard.taskmanager.dto.request.UpdateTaskStatusRequest;
import com.techvanguard.taskmanager.dto.response.PageResponse;
import com.techvanguard.taskmanager.dto.response.TaskDetailResponse;
import com.techvanguard.taskmanager.dto.response.TaskResponse;
import com.techvanguard.taskmanager.entity.Task;
import com.techvanguard.taskmanager.entity.User;
import com.techvanguard.taskmanager.enums.TaskPriority;
import com.techvanguard.taskmanager.enums.TaskStatus;
import com.techvanguard.taskmanager.exception.ResourceNotFoundException;
import com.techvanguard.taskmanager.mapper.TaskMapper;
import com.techvanguard.taskmanager.repository.TaskRepository;
import com.techvanguard.taskmanager.repository.UserRepository;
import com.techvanguard.taskmanager.service.TaskActivityLogService;
import com.techvanguard.taskmanager.service.TaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Lớp triển khai chi tiết cho nghiệp vụ quản lý công việc (Task).
 * Đảm bảo 100% kiểm tra quyền sở hữu chống IDOR và tự động làm mới Redis Cache khi dữ liệu thay đổi.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final TaskMapper taskMapper;
    private final TaskActivityLogService activityLogService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<TaskResponse> getTasks(Long userId,
                                               TaskStatus status,
                                               TaskPriority priority,
                                               String search,
                                               int page,
                                               int size,
                                               String sortBy,
                                               String sortDir) {
        // Bước 1: Chuẩn hóa tham số phân trang và sắp xếp an toàn
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);

        String validSortBy = "createdAt";
        if ("title".equalsIgnoreCase(sortBy) || "dueDate".equalsIgnoreCase(sortBy) ||
            "priority".equalsIgnoreCase(sortBy) || "updatedAt".equalsIgnoreCase(sortBy)) {
            validSortBy = sortBy;
        }

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(direction, validSortBy));

        // Bước 2: Thực hiện truy vấn danh sách có phân trang và lọc theo user hiện tại (chống IDOR)
        String keyword = (search != null && !search.isBlank()) ? "%" + search.trim().toLowerCase() + "%" : "";
        Page<Task> taskPage = taskRepository.findByFilters(userId, status, priority, keyword, pageable);

        // Bước 3: Chuyển đổi Entity sang DTO và bọc vào PageResponse chuẩn
        List<TaskResponse> responses = taskMapper.toResponseList(taskPage.getContent());
        return PageResponse.of(taskPage, responses);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getKanbanTasks(Long userId, TaskStatus status) {
        List<Task> tasks = (status != null)
                ? taskRepository.findByUserIdAndStatusOrderByUpdatedAtDesc(userId, status)
                : taskRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return taskMapper.toResponseList(tasks);
    }

    @Override
    @Transactional(readOnly = true)
    public TaskDetailResponse getTaskById(Long id, Long userId) {
        // SECURITY: Lấy task kèm subtasks bằng LEFT JOIN FETCH và kiểm tra chặt chẽ user.id = :userId
        Task task = taskRepository.findByIdAndUserIdWithSubtasks(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", id));

        return taskMapper.toDetailResponse(task);
    }

    @Override
    @Transactional
    @CacheEvict(value = "dashboard_metrics", key = "#userId")
    public TaskResponse createTask(CreateTaskRequest request, Long userId) {
        // Bước 1: Tìm người dùng sở hữu từ ID định danh trong SecurityContext
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Bước 2: Chuyển đổi dữ liệu và lưu thực thể Task mới vào Database
        Task task = taskMapper.toEntity(request, user);
        Task savedTask = taskRepository.save(task);

        // Bước 3: Ghi nhận nhật ký hoạt động
        activityLogService.logActivity(
                user,
                savedTask,
                "CREATED",
                "Đã tạo mới công việc: \"" + savedTask.getTitle() + "\""
        );

        log.info("Tạo mới thành công task ID: {} cho user ID: {}", savedTask.getId(), userId);
        return taskMapper.toResponse(savedTask);
    }

    @Override
    @Transactional
    @CacheEvict(value = "dashboard_metrics", key = "#userId")
    public TaskResponse updateTask(Long id, UpdateTaskRequest request, Long userId) {
        // Bước 1: Kiểm tra quyền sở hữu của user đối với task cần sửa (chống IDOR)
        Task task = taskRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", id));

        // Bước 2: Cập nhật các trường thông tin thay đổi
        task.setTitle(request.getTitle().trim());
        task.setDescription(request.getDescription());
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }
        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }
        task.setDueDate(request.getDueDate());

        Task updatedTask = taskRepository.save(task);

        // Bước 3: Ghi nhận nhật ký cập nhật
        activityLogService.logActivity(
                task.getUser(),
                updatedTask,
                "UPDATED",
                "Đã cập nhật thông tin chi tiết công việc: \"" + updatedTask.getTitle() + "\""
        );

        return taskMapper.toResponse(updatedTask);
    }

    @Override
    @Transactional
    @CacheEvict(value = "dashboard_metrics", key = "#userId")
    public TaskResponse updateTaskStatus(Long id, UpdateTaskStatusRequest request, Long userId) {
        // Bước 1: Kiểm tra quyền sở hữu task (chống IDOR)
        Task task = taskRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", id));

        TaskStatus oldStatus = task.getStatus();
        TaskStatus newStatus = request.getStatus();

        // Bước 2: Nếu trạng thái không thay đổi thì không cần cập nhật
        if (oldStatus == newStatus) {
            return taskMapper.toResponse(task);
        }

        task.setStatus(newStatus);
        Task updatedTask = taskRepository.save(task);

        // Bước 3: Ghi nhận nhật ký chuyển trạng thái (rất trực quan cho Bảng Kanban)
        activityLogService.logActivity(
                task.getUser(),
                updatedTask,
                "STATUS_CHANGED",
                "Đã chuyển trạng thái từ [" + oldStatus.getDescription() + "] sang [" + newStatus.getDescription() + "]"
        );

        log.info("User {} đổi trạng thái task {} từ {} sang {}", userId, id, oldStatus, newStatus);
        return taskMapper.toResponse(updatedTask);
    }

    @Override
    @Transactional
    @CacheEvict(value = "dashboard_metrics", key = "#userId")
    public void deleteTask(Long id, Long userId) {
        // Bước 1: Kiểm tra quyền sở hữu trước khi thực hiện xóa (chống IDOR)
        Task task = taskRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", id));

        User user = task.getUser();
        String taskTitle = task.getTitle();

        // Bước 2: Ghi nhận nhật ký xóa trước khi bản ghi bị xóa khỏi cơ sở dữ liệu
        activityLogService.logActivity(
                user,
                null,
                "DELETED",
                "Đã xóa công việc: \"" + taskTitle + "\""
        );

        // Bước 3: Xóa task (toàn bộ subtasks và logs gắn với task sẽ tự động bị xóa cascade)
        taskRepository.delete(task);
        log.info("User {} đã xóa thành công task ID: {}", userId, id);
    }
}
