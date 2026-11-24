import { axiosClient } from './axiosClient';
import { ApiResponse } from '../../types/api.types';
import { TaskPriority, TaskStatus } from '../../types/task.types';

export interface UpcomingTask {
  id: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  daysRemaining: number;
  isOverdue: boolean;
}

export interface DashboardMetrics {
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  doneTasks: number;
  overdueTasks: number;
  completionRate: number;
  upcomingTasks: UpcomingTask[];
}

export const dashboardService = {
  async getMetrics(): Promise<DashboardMetrics> {
    const response = await axiosClient.get<ApiResponse<DashboardMetrics>>('/dashboard/metrics');
    return response.data.data;
  },
};
