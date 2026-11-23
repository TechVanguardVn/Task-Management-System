package com.techvanguard.taskmanager.service;

import com.techvanguard.taskmanager.dto.request.CreateTaskRequest;
import com.techvanguard.taskmanager.dto.request.UpdateTaskRequest;
import com.techvanguard.taskmanager.dto.request.UpdateTaskStatusRequest;
import com.techvanguard.taskmanager.dto.response.PageResponse;
import com.techvanguard.taskmanager.dto.response.TaskDetailResponse;
import com.techvanguard.taskmanager.dto.response.TaskResponse;
import com.techvanguard.taskmanager.enums.TaskPriority;
import com.techvanguard.taskmanager.enums.TaskStatus;

import java.util.List;

/**
 * Giao diện dịch vụ chính quản lý công việc (Task Service).
 */
public interface TaskService {

    /**
     * Lấy danh sách công việc của người dùng hiện tại có phân trang, tìm kiếm và lọc đa điều kiện.
     */
    PageResponse<TaskResponse> getTasks(Long userId,
                                        TaskStatus status,
                                        TaskPriority priority,
                                        String search,
                                        int page,
                                        int size,
                                        String sortBy,
                                        String sortDir);

    /**
     * Lấy danh sách toàn bộ công việc theo từng trạng thái (phục vụ hiển thị các cột trên Bảng Kanban).
     */
    List<TaskResponse> getKanbanTasks(Long userId, TaskStatus status);

    /**
     * Xem chi tiết một công việc (nạp đầy đủ Subtasks và Activity Logs).
     */
    TaskDetailResponse getTaskById(Long id, Long userId);

    /**
     * Tạo mới một công việc và gắn vào tài khoản của người dùng đang đăng nhập.
     */
    TaskResponse createTask(CreateTaskRequest request, Long userId);

    /**
     * Cập nhật thông tin chi tiết của một công việc hiện có.
     */
    TaskResponse updateTask(Long id, UpdateTaskRequest request, Long userId);

    /**
     * Cập nhật nhanh trạng thái công việc (chuyên dụng cho thao tác kéo thả thả thẻ trên Bảng Kanban).
     */
    TaskResponse updateTaskStatus(Long id, UpdateTaskStatusRequest request, Long userId);

    /**
     * Xóa một công việc khỏi hệ thống (tự động xóa toàn bộ subtasks và logs liên quan).
     */
    void deleteTask(Long id, Long userId);
}
