import { axiosClient } from './axiosClient';
import { ApiResponse } from '../../types/api.types';
import { TaskActivityLogResponse } from '../../types/task.types';

export const activityService = {
  async getRecentActivities(limit: number = 20): Promise<TaskActivityLogResponse[]> {
    const response = await axiosClient.get<ApiResponse<TaskActivityLogResponse[]>>('/activities/recent', {
      params: { limit },
    });
    return response.data.data;
  },

  async getTaskActivities(taskId: number): Promise<TaskActivityLogResponse[]> {
    const response = await axiosClient.get<ApiResponse<TaskActivityLogResponse[]>>(`/activities/tasks/${taskId}`);
    return response.data.data;
  },
};
