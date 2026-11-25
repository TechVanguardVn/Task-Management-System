package com.techvanguard.taskmanager.service;

import com.techvanguard.taskmanager.dto.request.CreateSubtaskRequest;
import com.techvanguard.taskmanager.dto.request.UpdateSubtaskRequest;
import com.techvanguard.taskmanager.dto.response.SubtaskResponse;

/**
 * Giao diện dịch vụ quản lý các đầu việc con (Subtasks).
 */
public interface SubtaskService {

    /**
     * Thêm một đầu việc con mới vào một task cụ thể.
     */
    SubtaskResponse addSubtask(Long taskId, CreateSubtaskRequest request, Long userId);

    /**
     * Cập nhật tiêu đề hoặc trạng thái hoàn thành của một Subtask.
     */
    SubtaskResponse updateSubtask(Long subtaskId, UpdateSubtaskRequest request, Long userId);

    /**
     * Đổi nhanh trạng thái hoàn thành / chưa hoàn thành (Toggle check) của một Subtask.
     */
    SubtaskResponse toggleSubtask(Long subtaskId, Long userId);

    /**
     * Xóa một đầu việc con khỏi task.
     */
    void deleteSubtask(Long subtaskId, Long userId);
}
