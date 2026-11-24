package backend.repository;

public interface DashboardCounts {
    long getTotalTasks();
    long getTodoTasks();
    long getInProgressTasks();
    long getDoneTasks();
}
