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
 * Thực thể Subtask đại diện cho một đầu việc con (checklist) bên trong một Task lớn.
 */
@Entity
@Table(name = "subtasks")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Subtask extends BaseEntity {

    /**
     * Tên mô tả của đầu việc con (ví dụ: "Viết API Unit Test", "Cắt giao diện CSS").
     */
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    /**
     * Trạng thái hoàn thành của đầu việc con (đã tick chọn hay chưa).
     */
    @Column(name = "is_completed", nullable = false)
    @Builder.Default
    private boolean isCompleted = false;

    /**
     * Task cha chứa đầu việc con này.
     * FetchType.LAZY giúp tối ưu hiệu năng bộ nhớ khi không cần nạp Task cha.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;
}
