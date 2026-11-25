package com.techvanguard.taskmanager.dto.response;

import com.techvanguard.taskmanager.enums.TaskPriority;
import com.techvanguard.taskmanager.enums.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * DTO phản hồi danh sách công việc tóm tắt (phục vụ hiển thị trên List View và Kanban Card).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskResponse {

    private Long id;
    private String title;
    private String description;
    private TaskStatus status;
    private TaskPriority priority;
    private LocalDateTime dueDate;
    private int subtaskCount;
    private int completedSubtaskCount;
    private int progressPercentage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
