import type { TaskPriority, TaskStatus } from "./task";

export interface UpcomingDeadlineTask {
  id: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
}

export interface DashboardStatsResponse {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  todo_tasks: number;
  upcoming_deadlines: UpcomingDeadlineTask[];
}
