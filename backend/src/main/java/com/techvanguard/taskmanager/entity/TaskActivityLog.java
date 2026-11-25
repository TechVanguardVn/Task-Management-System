package com.techvanguard.taskmanager.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Thực thể TaskActivityLog lưu trữ lịch sử thao tác (Audit Trail) của người dùng trên công việc.
 * Giúp theo dõi minh bạch các hành động như: Tạo task, Đổi trạng thái Kanban, Cập nhật hạn chót...
 */
@Entity
@Table(name = "task_activity_logs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskActivityLog extends BaseEntity {

    /**
     * Loại hành động thực hiện (ví dụ: CREATED, STATUS_CHANGED, UPDATED, DELETED, SUBTASK_TOGGLED).
     */
    @Column(name = "action", nullable = false, length = 50)
    private String action;

    /**
     * Mô tả chi tiết hành động dễ đọc bằng tiếng Việt (ví dụ: "Chuyển trạng thái từ TODO sang IN_PROGRESS").
     */
    @Column(name = "description", nullable = false, length = 500)
    private String description;

    /**
     * Task liên quan đến hoạt động này (có thể null nếu task đã bị xóa).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private Task task;

    /**
     * Người dùng đã thực hiện thao tác này.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
