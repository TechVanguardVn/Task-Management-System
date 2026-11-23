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
 * DTO đại diện cho một công việc sắp đến hạn chót (phục vụ widget Dashboard).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpcomingTaskResponse {

    private Long id;
    private String title;
    private TaskStatus status;
    private TaskPriority priority;
    private LocalDateTime dueDate;
    private long daysRemaining;
    private boolean isOverdue;
}
