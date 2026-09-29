package com.huulu.task_management.service;

import com.huulu.task_management.dto.response.DashboardResponse;
import com.huulu.task_management.dto.response.TaskResponse;
import com.huulu.task_management.entity.Task;
import com.huulu.task_management.entity.TaskStatus;
import com.huulu.task_management.entity.User;
import com.huulu.task_management.repository.TaskRepository;
import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private final TaskRepository taskRepository;
    private final TaskService taskService;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        User user = taskService.getCurrentUser();
        Map<TaskStatus, Long> counts = new EnumMap<>(TaskStatus.class);
        for (Object[] row : taskRepository.countByStatusForUser(user.getId())) {
            counts.put((TaskStatus) row[0], ((Number) row[1]).longValue());
        }

        List<Task> upcoming = taskRepository.findUpcomingTasks(
                user.getId(),
                TaskStatus.DONE,
                LocalDate.now(),
                LocalDate.now().plusDays(7),
                PageRequest.of(0, 10));
        List<TaskResponse> upcomingTasks = upcoming.stream().map(TaskResponse::from).toList();

        return new DashboardResponse(
                counts.values().stream().mapToLong(Long::longValue).sum(),
                counts.getOrDefault(TaskStatus.TODO, 0L),
                counts.getOrDefault(TaskStatus.IN_PROGRESS, 0L),
                counts.getOrDefault(TaskStatus.DONE, 0L),
                upcomingTasks);
    }
}