package com.tanseng2027.task_management.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.tanseng2027.task_management.dto.response.DashboardStatsResponse;
import com.tanseng2027.task_management.entity.Task;
import com.tanseng2027.task_management.entity.TaskPriority;
import com.tanseng2027.task_management.entity.TaskStatus;
import com.tanseng2027.task_management.entity.User;
import com.tanseng2027.task_management.repository.TaskRepository;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private DashboardService dashboardService;

    private User alice;

    @BeforeEach
    void setUp() {
        alice = User.builder().id(1L).email("alice@example.com").fullName("Alice").password("x").build();
    }

    @Test
    @DisplayName("Tổng hợp đúng số liệu và danh sách task sắp đến hạn của user")
    void getStats_aggregatesCounts() {
        LocalDate today = LocalDate.now();
        Task upcoming = Task.builder().id(5L).title("Sắp hạn").status(TaskStatus.TODO)
                .priority(TaskPriority.HIGH).dueDate(today.plusDays(1)).user(alice).build();

        when(taskRepository.countByUser_Id(1L)).thenReturn(10L);
        when(taskRepository.countByUser_IdAndStatus(1L, TaskStatus.TODO)).thenReturn(6L);
        when(taskRepository.countByUser_IdAndStatus(1L, TaskStatus.IN_PROGRESS)).thenReturn(2L);
        when(taskRepository.countByUser_IdAndStatus(1L, TaskStatus.DONE)).thenReturn(2L);
        when(taskRepository.countByUser_IdAndStatusNotAndDueDateBefore(1L, TaskStatus.DONE, today)).thenReturn(1L);
        when(taskRepository.findByUser_IdAndStatusNotAndDueDateBetweenOrderByDueDateAscIdAsc(
                1L, TaskStatus.DONE, today, today.plusDays(7))).thenReturn(List.of(upcoming));

        DashboardStatsResponse stats = dashboardService.getStats(alice, 7);

        assertThat(stats.getTotalTasks()).isEqualTo(10);
        assertThat(stats.getTodoTasks()).isEqualTo(6);
        assertThat(stats.getInProgressTasks()).isEqualTo(2);
        assertThat(stats.getDoneTasks()).isEqualTo(2);
        assertThat(stats.getOverdueTasks()).isEqualTo(1);
        assertThat(stats.getUpcomingDays()).isEqualTo(7);
        assertThat(stats.getUpcomingTasks()).singleElement()
                .satisfies(t -> assertThat(t.getId()).isEqualTo(5L));
    }

    @ParameterizedTest(name = "days = {0} → dùng {1} ngày")
    @CsvSource({ "-5, 1", "0, 1", "1, 1", "7, 7", "30, 30", "31, 30", "999, 30" })
    @DisplayName("Số ngày lấy task sắp đến hạn được giới hạn trong khoảng 1..30")
    void getStats_clampsDays(int requested, int expected) {
        when(taskRepository.findByUser_IdAndStatusNotAndDueDateBetweenOrderByDueDateAscIdAsc(
                anyLong(), any(), any(), any())).thenReturn(List.of());

        DashboardStatsResponse stats = dashboardService.getStats(alice, requested);

        LocalDate today = LocalDate.now();
        assertThat(stats.getUpcomingDays()).isEqualTo(expected);
        verify(taskRepository).findByUser_IdAndStatusNotAndDueDateBetweenOrderByDueDateAscIdAsc(
                eq(1L), eq(TaskStatus.DONE), eq(today), eq(today.plusDays(expected)));
    }
}
