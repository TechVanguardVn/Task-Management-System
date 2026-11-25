package com.techvanguard.taskmanager.dto.response;

import com.techvanguard.taskmanager.enums.TaskPriority;
import com.techvanguard.taskmanager.enums.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO phản hồi đầy đủ chi tiết của một Task (bao gồm cả danh sách subtasks và lịch sử thay đổi).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDetailResponse {

    private Long id;
    private String title;
    private String description;
    private TaskStatus status;
    private TaskPriority priority;
    private LocalDateTime dueDate;
    private int subtaskCount;
    private int completedSubtaskCount;
    private int progressPercentage;
    private List<SubtaskResponse> subtasks;
    private List<TaskActivityLogResponse> activityLogs;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
