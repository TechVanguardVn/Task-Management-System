package com.techvanguard.taskmanager.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * DTO phản hồi một bản ghi nhật ký hoạt động (Audit Trail).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskActivityLogResponse {

    private Long id;
    private String action;
    private String description;
    private Long taskId;
    private String taskTitle;
    private String userName;
    private LocalDateTime createdAt;
}
