package com.huulu.task_management.dto.response;

import java.util.List;

public record DashboardResponse(
        long total,
        long todo,
        long inProgress,
        long done,
        List<TaskResponse> upcomingTasks
) {
}
