package com.techvanguard.taskmanager.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * DTO phản hồi tổng hợp toàn bộ số liệu thống kê Dashboard của người dùng.
 * Được lưu trữ trong Redis Cache với annotation @Cacheable để tối ưu tốc độ phản hồi < 1ms.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardMetricsResponse {

    /**
     * Tổng số lượng công việc của người dùng hiện tại.
     */
    private long totalTasks;

    /**
     * Số công việc chưa bắt đầu (TODO).
     */
    private long todoTasks;

    /**
     * Số công việc đang thực hiện (IN_PROGRESS).
     */
    private long inProgressTasks;

    /**
     * Số công việc đã hoàn thành (DONE).
     */
    private long doneTasks;

    /**
     * Số công việc đã quá hạn chót mà chưa hoàn thành.
     */
    private long overdueTasks;

    /**
     * Tỉ lệ phần trăm hoàn thành tổng thể (làm tròn 1 chữ số thập phân).
     */
    private double completionRate;

    /**
     * Danh sách tối đa 5 công việc sắp đến hạn trong 7 ngày tới.
     */
    private List<UpcomingTaskResponse> upcomingTasks;
}
