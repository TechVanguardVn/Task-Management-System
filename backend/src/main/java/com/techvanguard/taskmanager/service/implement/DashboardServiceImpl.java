package com.techvanguard.taskmanager.service.implement;

import com.techvanguard.taskmanager.dto.response.DashboardMetricsResponse;
import com.techvanguard.taskmanager.dto.response.UpcomingTaskResponse;
import com.techvanguard.taskmanager.entity.Task;
import com.techvanguard.taskmanager.enums.TaskStatus;
import com.techvanguard.taskmanager.repository.TaskRepository;
import com.techvanguard.taskmanager.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Lớp triển khai dịch vụ thống kê Dashboard.
 * Áp dụng Redis Caching (@Cacheable) để các lượt xem Dashboard liên tục không phải query đếm lại Database.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardServiceImpl implements DashboardService {

    private final TaskRepository taskRepository;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "dashboard_metrics", key = "#userId", unless = "#result == null")
    public DashboardMetricsResponse getMetrics(Long userId) {
        log.info("Tính toán số liệu Dashboard từ Database cho User ID: {} (Cache miss)", userId);

        // Bước 1: Đếm số lượng công việc theo từng trạng thái bằng các câu query COUNT tối ưu
        long totalTasks = taskRepository.countByUserId(userId);
        long todoTasks = taskRepository.countByUserIdAndStatus(userId, TaskStatus.TODO);
        long inProgressTasks = taskRepository.countByUserIdAndStatus(userId, TaskStatus.IN_PROGRESS);
        long doneTasks = taskRepository.countByUserIdAndStatus(userId, TaskStatus.DONE);

        // Bước 2: Tính toán tỉ lệ hoàn thành (%)
        double completionRate = 0.0;
        if (totalTasks > 0) {
            completionRate = Math.round(((double) doneTasks / totalTasks) * 1000.0) / 10.0;
        }

        // Bước 3: Lấy danh sách tối đa 5 công việc sắp tới hạn trong 7 ngày tới
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime next7Days = now.plusDays(7);
        List<Task> rawUpcoming = taskRepository.findUpcomingTasks(
                userId, TaskStatus.DONE, now.minusDays(30), next7Days, PageRequest.of(0, 5)
        );

        long overdueCount = 0;
        List<UpcomingTaskResponse> upcomingResponses = new ArrayList<>();

        for (Task task : rawUpcoming) {
            boolean isOverdue = task.getDueDate().isBefore(now);
            if (isOverdue) {
                overdueCount++;
            }

            long daysRemaining = Duration.between(now, task.getDueDate()).toDays();

            upcomingResponses.add(UpcomingTaskResponse.builder()
                    .id(task.getId())
                    .title(task.getTitle())
                    .status(task.getStatus())
                    .priority(task.getPriority())
                    .dueDate(task.getDueDate())
                    .daysRemaining(daysRemaining)
                    .isOverdue(isOverdue)
                    .build());
        }

        // Bước 4: Đóng gói toàn bộ số liệu vào DTO phản hồi
        return DashboardMetricsResponse.builder()
                .totalTasks(totalTasks)
                .todoTasks(todoTasks)
                .inProgressTasks(inProgressTasks)
                .doneTasks(doneTasks)
                .overdueTasks(overdueCount)
                .completionRate(completionRate)
                .upcomingTasks(upcomingResponses)
                .build();
    }
}
