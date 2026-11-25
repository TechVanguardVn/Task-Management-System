package com.techvanguard.taskmanager.service.implement;

import com.techvanguard.taskmanager.dto.response.TaskActivityLogResponse;
import com.techvanguard.taskmanager.entity.Task;
import com.techvanguard.taskmanager.entity.TaskActivityLog;
import com.techvanguard.taskmanager.entity.User;
import com.techvanguard.taskmanager.mapper.TaskActivityLogMapper;
import com.techvanguard.taskmanager.repository.TaskActivityLogRepository;
import com.techvanguard.taskmanager.service.TaskActivityLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Lớp triển khai dịch vụ ghi nhận và tra cứu nhật ký hoạt động.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TaskActivityLogServiceImpl implements TaskActivityLogService {

    private final TaskActivityLogRepository activityLogRepository;
    private final TaskActivityLogMapper activityLogMapper;

    @Override
    @Transactional
    public void logActivity(User user, Task task, String action, String description) {
        TaskActivityLog activityLog = TaskActivityLog.builder()
                .action(action)
                .description(description)
                .task(task)
                .user(user)
                .build();

        activityLogRepository.save(activityLog);
        log.debug("Đã ghi nhận nhật ký hoạt động: [{}] - User: {} - Task: {}",
                action, user.getEmail(), task != null ? task.getTitle() : "N/A");
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskActivityLogResponse> getLogsByTaskId(Long taskId, Long userId) {
        List<TaskActivityLog> logs = activityLogRepository.findByTaskIdAndUserId(taskId, userId);
        return activityLogMapper.toResponseList(logs);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskActivityLogResponse> getRecentActivities(Long userId, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 50);
        List<TaskActivityLog> logs = activityLogRepository.findRecentActivitiesByUserId(
                userId,
                PageRequest.of(0, safeLimit)
        );
        return activityLogMapper.toResponseList(logs);
    }
}
