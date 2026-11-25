package com.tanseng2027.task_management.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DashboardStatsResponse {

    private long totalTasks;

    private long todoTasks;          // chưa bắt đầu

    private long inProgressTasks;    // đang thực hiện

    private long doneTasks;          // đã hoàn thành

    private long overdueTasks;       // quá hạn mà chưa xong

    private int upcomingDays;        // khoảng thời gian (số ngày tới) dùng để lấy task sắp đến hạn

    private List<TaskResponse> upcomingTasks;  // task chưa xong có hạn từ hôm nay đến hết upcomingDays ngày tới
}
