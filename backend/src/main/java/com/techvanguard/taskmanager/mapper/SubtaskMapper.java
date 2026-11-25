package com.techvanguard.taskmanager.mapper;

import com.techvanguard.taskmanager.dto.response.SubtaskResponse;
import com.techvanguard.taskmanager.entity.Subtask;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Lớp chuyển đổi (Mapper) chuyên biệt cho Subtask.
 */
@Component
public class SubtaskMapper {

    /**
     * Chuyển đổi từ Subtask Entity sang SubtaskResponse DTO.
     */
    public SubtaskResponse toResponse(Subtask subtask) {
        if (subtask == null) {
            return null;
        }

        return SubtaskResponse.builder()
                .id(subtask.getId())
                .title(subtask.getTitle())
                .isCompleted(subtask.isCompleted())
                .createdAt(subtask.getCreatedAt())
                .build();
    }

    /**
     * Chuyển đổi danh sách Subtask Entity sang danh sách SubtaskResponse DTO.
     */
    public List<SubtaskResponse> toResponseList(List<Subtask> subtasks) {
        if (subtasks == null || subtasks.isEmpty()) {
            return Collections.emptyList();
        }

        return subtasks.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
}
