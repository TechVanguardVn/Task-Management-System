package com.techvanguard.taskmanager.entity;

import com.techvanguard.taskmanager.enums.TaskPriority;
import com.techvanguard.taskmanager.enums.TaskStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Thực thể Task đại diện cho một công việc được quản lý bởi người dùng.
 * Kế thừa BaseEntity để tự động quản lý khóa chính ID và các mốc thời gian createdAt, updatedAt.
 */
@Entity
@Table(name = "tasks")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Task extends BaseEntity {

    /**
     * Tiêu đề công việc, ngắn gọn và súc tích.
     * Đánh chỉ mục Index vì trường này thường xuyên dùng để tìm kiếm từ khóa.
     */
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    /**
     * Mô tả chi tiết nội dung công việc (hỗ trợ văn bản dài dạng TEXT).
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * Trạng thái công việc trong vòng đời: TODO, IN_PROGRESS, DONE.
     * Đánh chỉ mục Index vì thường xuyên xuất hiện trong bộ lọc trạng thái và cột Kanban.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private TaskStatus status = TaskStatus.TODO;

    /**
     * Mức độ ưu tiên của công việc: LOW, MEDIUM, HIGH.
     * Đánh chỉ mục Index phục vụ việc lọc và sắp xếp theo độ khẩn cấp.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    @Builder.Default
    private TaskPriority priority = TaskPriority.MEDIUM;

    /**
     * Thời hạn hoàn thành công việc (Due Date).
     * Đánh chỉ mục Index để truy vấn nhanh danh sách công việc sắp đến hạn trên Dashboard.
     */
    @Column(name = "due_date")
    private LocalDateTime dueDate;

    /**
     * Người sở hữu công việc này.
     * Đặt FetchType.LAZY để tránh việc tự động nạp cả User khi chỉ cần đọc danh sách Task.
     * SECURITY: user_id là chốt chặn quan trọng nhất để chống lỗi IDOR (cô lập dữ liệu theo từng user).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Danh sách các đầu việc con (Checklist Subtasks) của công việc này.
     * Sử dụng CascadeType.ALL và orphanRemoval=true để khi xóa Task thì toàn bộ Subtask tự động xóa theo.
     */
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    @Builder.Default
    private List<Subtask> subtasks = new ArrayList<>();

    /**
     * Lịch sử nhật ký hoạt động (Audit Trail) ghi lại mọi thay đổi của task.
     */
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    @Builder.Default
    private List<TaskActivityLog> activityLogs = new ArrayList<>();

    /**
     * Phương thức tiện ích hỗ trợ thêm Subtask vào danh sách hai chiều an toàn.
     */
    public void addSubtask(Subtask subtask) {
        subtasks.add(subtask);
        subtask.setTask(this);
    }

    /**
     * Phương thức tiện ích xóa Subtask khỏi danh sách.
     */
    public void removeSubtask(Subtask subtask) {
        subtasks.remove(subtask);
        subtask.setTask(null);
    }
}
