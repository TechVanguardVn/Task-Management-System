package com.tanseng2027.task_management.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tanseng2027.task_management.dto.response.DashboardStatsResponse;
import com.tanseng2027.task_management.dto.response.TaskResponse;
import com.tanseng2027.task_management.entity.TaskStatus;
import com.tanseng2027.task_management.entity.User;
import com.tanseng2027.task_management.repository.TaskRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    public static final int DEFAULT_UPCOMING_DAYS = 7;
    private static final int MIN_UPCOMING_DAYS = 1;
    private static final int MAX_UPCOMING_DAYS = 30;

    private final TaskRepository taskRepository;

    /**
     * @param days số ngày tới để lấy task sắp đến hạn; được giới hạn trong khoảng 1..30
     */
    public DashboardStatsResponse getStats(User user, int days) {
        Long userId = user.getId();
        int upcomingDays = Math.clamp(days, MIN_UPCOMING_DAYS, MAX_UPCOMING_DAYS);
        LocalDate today = LocalDate.now();

        List<TaskResponse> upcomingTasks = taskRepository
                .findByUser_IdAndStatusNotAndDueDateBetweenOrderByDueDateAscIdAsc(
                        userId, TaskStatus.DONE, today, today.plusDays(upcomingDays))
                .stream()
                .map(TaskResponse::from)
                .toList();

        return DashboardStatsResponse.builder()
                .totalTasks(taskRepository.countByUser_Id(userId))
                .todoTasks(taskRepository.countByUser_IdAndStatus(userId, TaskStatus.TODO))
                .inProgressTasks(taskRepository.countByUser_IdAndStatus(userId, TaskStatus.IN_PROGRESS))
                .doneTasks(taskRepository.countByUser_IdAndStatus(userId, TaskStatus.DONE))
                .overdueTasks(taskRepository.countByUser_IdAndStatusNotAndDueDateBefore(
                        userId, TaskStatus.DONE, today))
                .upcomingDays(upcomingDays)
                .upcomingTasks(upcomingTasks)
                .build();
    }
}
