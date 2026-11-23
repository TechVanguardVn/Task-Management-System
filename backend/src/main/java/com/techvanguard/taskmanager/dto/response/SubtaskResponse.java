package com.techvanguard.taskmanager.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * DTO phản hồi thông tin một đầu việc con (Subtask).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubtaskResponse {

    private Long id;
    private String title;
    private boolean isCompleted;
    private LocalDateTime createdAt;
}
