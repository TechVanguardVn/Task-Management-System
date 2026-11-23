package com.techvanguard.taskmanager.mapper;

import com.techvanguard.taskmanager.dto.request.CreateTaskRequest;
import com.techvanguard.taskmanager.dto.response.SubtaskResponse;
import com.techvanguard.taskmanager.dto.response.TaskActivityLogResponse;
import com.techvanguard.taskmanager.dto.response.TaskDetailResponse;
import com.techvanguard.taskmanager.dto.response.TaskResponse;
import com.techvanguard.taskmanager.entity.Subtask;
import com.techvanguard.taskmanager.entity.Task;
import com.techvanguard.taskmanager.entity.User;
import com.techvanguard.taskmanager.enums.TaskPriority;
import com.techvanguard.taskmanager.enums.TaskStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Lớp chuyển đổi (Mapper) chuyên biệt giữa Task Entity và các Task DTO.
 */
@Component
@RequiredArgsConstructor
public class TaskMapper {

    private final SubtaskMapper subtaskMapper;
    private final TaskActivityLogMapper activityLogMapper;

    /**
     * Chuyển đổi từ CreateTaskRequest sang Task Entity mới gắn với User sở hữu.
     */
    public Task toEntity(CreateTaskRequest request, User user) {
        Task task = Task.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : TaskStatus.TODO)
                .priority(request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM)
                .dueDate(request.getDueDate())
                .user(user)
                .build();

        // Nếu có danh sách subtask khởi tạo ban đầu thì thêm vào task
        if (request.getSubtaskTitles() != null && !request.getSubtaskTitles().isEmpty()) {
            for (String subtaskTitle : request.getSubtaskTitles()) {
                if (subtaskTitle != null && !subtaskTitle.isBlank()) {
                    Subtask subtask = Subtask.builder()
                            .title(subtaskTitle.trim())
                            .isCompleted(false)
                            .task(task)
                            .build();
                    task.addSubtask(subtask);
                }
            }
        }

        return task;
    }

    /**
     * Chuyển đổi từ Task Entity sang TaskResponse tóm tắt kèm tính toán tiến độ %.
     */
    public TaskResponse toResponse(Task task) {
        if (task == null) {
            return null;
        }

        int totalSubtasks = task.getSubtasks() != null ? task.getSubtasks().size() : 0;
        int completedSubtasks = 0;
        if (task.getSubtasks() != null) {
            for (Subtask s : task.getSubtasks()) {
                if (s.isCompleted()) {
                    completedSubtasks++;
                }
            }
        }

        int progress = 0;
        if (totalSubtasks > 0) {
            progress = (int) Math.round(((double) completedSubtasks / totalSubtasks) * 100);
        } else if (task.getStatus() == TaskStatus.DONE) {
            progress = 100;
        }

        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .priority(task.getPriority())
                .dueDate(task.getDueDate())
                .subtaskCount(totalSubtasks)
                .completedSubtaskCount(completedSubtasks)
                .progressPercentage(progress)
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }

    /**
     * Chuyển đổi danh sách Task sang danh sách TaskResponse.
     */
    public List<TaskResponse> toResponseList(List<Task> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return Collections.emptyList();
        }

        return tasks.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Chuyển đổi sang TaskDetailResponse đầy đủ bao gồm Subtasks và Activity Logs.
     */
    public TaskDetailResponse toDetailResponse(Task task) {
        if (task == null) {
            return null;
        }

        TaskResponse baseResponse = toResponse(task);
        List<SubtaskResponse> subtaskResponses = subtaskMapper.toResponseList(task.getSubtasks());
        List<TaskActivityLogResponse> logResponses = activityLogMapper.toResponseList(task.getActivityLogs());

        return TaskDetailResponse.builder()
                .id(baseResponse.getId())
                .title(baseResponse.getTitle())
                .description(baseResponse.getDescription())
                .status(baseResponse.getStatus())
                .priority(baseResponse.getPriority())
                .dueDate(baseResponse.getDueDate())
                .subtaskCount(baseResponse.getSubtaskCount())
                .completedSubtaskCount(baseResponse.getCompletedSubtaskCount())
                .progressPercentage(baseResponse.getProgressPercentage())
                .subtasks(subtaskResponses)
                .activityLogs(logResponses)
                .createdAt(baseResponse.getCreatedAt())
                .updatedAt(baseResponse.getUpdatedAt())
                .build();
    }
}
