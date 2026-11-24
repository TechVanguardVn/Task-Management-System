package backend.dto;

import java.math.BigDecimal;

public record DashboardSummaryResponse(long totalTasks, long todoTasks, long inProgressTasks,
                                       long doneTasks, BigDecimal completionPercentage) {
}
