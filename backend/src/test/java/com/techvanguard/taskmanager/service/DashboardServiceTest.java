package com.techvanguard.taskmanager.service;

import com.techvanguard.taskmanager.dto.response.DashboardMetricsResponse;
import com.techvanguard.taskmanager.entity.Task;
import com.techvanguard.taskmanager.enums.TaskPriority;
import com.techvanguard.taskmanager.enums.TaskStatus;
import com.techvanguard.taskmanager.repository.TaskRepository;
import com.techvanguard.taskmanager.service.implement.DashboardServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * Bộ kiểm thử đơn vị cho DashboardService.
 * Kiểm tra tính chính xác của các công thức tính tỉ lệ hoàn thành và đếm số lượng task.
 */
@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private DashboardServiceImpl dashboardService;

    @Test
    @DisplayName("Tính toán chính xác các chỉ số Dashboard và tỉ lệ hoàn thành %")
    void getMetrics_Success() {
        Long userId = 1L;

        Task upcomingTask = Task.builder()
                .title("Nhiệm vụ sắp tới hạn")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.HIGH)
                .dueDate(LocalDateTime.now().plusDays(3))
                .build();
        upcomingTask.setId(5L);

        when(taskRepository.countByUserId(userId)).thenReturn(10L);
        when(taskRepository.countByUserIdAndStatus(userId, TaskStatus.TODO)).thenReturn(4L);
        when(taskRepository.countByUserIdAndStatus(userId, TaskStatus.IN_PROGRESS)).thenReturn(2L);
        when(taskRepository.countByUserIdAndStatus(userId, TaskStatus.DONE)).thenReturn(4L);
        when(taskRepository.findUpcomingTasks(eq(userId), any(LocalDateTime.class), any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(List.of(upcomingTask));

        DashboardMetricsResponse metrics = dashboardService.getMetrics(userId);

        assertThat(metrics).isNotNull();
        assertThat(metrics.getTotalTasks()).isEqualTo(10L);
        assertThat(metrics.getTodoTasks()).isEqualTo(4L);
        assertThat(metrics.getInProgressTasks()).isEqualTo(2L);
        assertThat(metrics.getDoneTasks()).isEqualTo(4L);
        assertThat(metrics.getCompletionRate()).isEqualTo(40.0); // 4 / 10 = 40.0%
        assertThat(metrics.getUpcomingTasks()).hasSize(1);
        assertThat(metrics.getUpcomingTasks().get(0).getTitle()).isEqualTo("Nhiệm vụ sắp tới hạn");
    }

    @Test
    @DisplayName("Tỉ lệ hoàn thành là 0.0% khi người dùng chưa tạo công việc nào")
    void getMetrics_ZeroTasks_CompletionRateZero() {
        Long userId = 1L;

        when(taskRepository.countByUserId(userId)).thenReturn(0L);
        when(taskRepository.countByUserIdAndStatus(userId, TaskStatus.TODO)).thenReturn(0L);
        when(taskRepository.countByUserIdAndStatus(userId, TaskStatus.IN_PROGRESS)).thenReturn(0L);
        when(taskRepository.countByUserIdAndStatus(userId, TaskStatus.DONE)).thenReturn(0L);
        when(taskRepository.findUpcomingTasks(eq(userId), any(LocalDateTime.class), any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(Collections.emptyList());

        DashboardMetricsResponse metrics = dashboardService.getMetrics(userId);

        assertThat(metrics.getTotalTasks()).isZero();
        assertThat(metrics.getCompletionRate()).isEqualTo(0.0);
    }
}
