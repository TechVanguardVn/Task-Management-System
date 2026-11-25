package com.techvanguard.taskmanager.service;

import com.techvanguard.taskmanager.dto.response.TaskActivityLogResponse;
import com.techvanguard.taskmanager.entity.Task;
import com.techvanguard.taskmanager.entity.User;

import java.util.List;

/**
 * Giao diện dịch vụ ghi nhận và tra cứu nhật ký hoạt động (Audit Trail).
 */
public interface TaskActivityLogService {

    /**
     * Ghi nhận một hành động của người dùng lên hệ thống.
     *
     * @param user Người dùng thực hiện thao tác
     * @param task Công việc bị tác động (có thể null nếu hành động độc lập)
     * @param action Mã hành động (CREATED, STATUS_CHANGED, UPDATED, DELETED...)
     * @param description Mô tả chi tiết hành động bằng tiếng Việt
     */
    void logActivity(User user, Task task, String action, String description);

    /**
     * Lấy danh sách lịch sử thao tác của một công việc cụ thể.
     */
    List<TaskActivityLogResponse> getLogsByTaskId(Long taskId, Long userId);

    /**
     * Lấy các hoạt động gần nhất của người dùng trên toàn hệ thống (phục vụ hiển thị ngăn kéo Drawer).
     */
    List<TaskActivityLogResponse> getRecentActivities(Long userId, int limit);
}
