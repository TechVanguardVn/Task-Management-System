package com.techvanguard.taskmanager.mapper;

import com.techvanguard.taskmanager.dto.response.TaskActivityLogResponse;
import com.techvanguard.taskmanager.entity.TaskActivityLog;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Lớp chuyển đổi (Mapper) chuyên biệt cho TaskActivityLog.
 */
@Component
public class TaskActivityLogMapper {

    /**
     * Chuyển đổi từ TaskActivityLog Entity sang TaskActivityLogResponse DTO.
     */
    public TaskActivityLogResponse toResponse(TaskActivityLog log) {
        if (log == null) {
            return null;
        }

        return TaskActivityLogResponse.builder()
                .id(log.getId())
                .action(log.getAction())
                .description(log.getDescription())
                .taskId(log.getTask() != null ? log.getTask().getId() : null)
                .taskTitle(log.getTask() != null ? log.getTask().getTitle() : null)
                .userName(log.getUser() != null ? log.getUser().getFullName() : null)
                .createdAt(log.getCreatedAt())
                .build();
    }

    /**
     * Chuyển đổi danh sách lịch sử sang danh sách DTO.
     */
    public List<TaskActivityLogResponse> toResponseList(List<TaskActivityLog> logs) {
        if (logs == null || logs.isEmpty()) {
            return Collections.emptyList();
        }

        return logs.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
}
