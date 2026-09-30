import axiosClient from '@/api/axiosClient';
import type { Task, TaskListResponse, TaskPayload, TaskSingleResponse } from '@/modules/tasks/types/taskType';

export const taskApi = {
  list: (): Promise<TaskListResponse> => axiosClient.get('/api/tasks'),

  getById: (id: number): Promise<TaskSingleResponse> => axiosClient.get(`/api/tasks/${id}`),

  create: (payload: TaskPayload): Promise<TaskSingleResponse> => axiosClient.post('/api/tasks', payload),

  update: (id: number, payload: TaskPayload): Promise<TaskSingleResponse> => axiosClient.put(`/api/tasks/${id}`, payload),

  remove: (id: number): Promise<{ message: string }> => axiosClient.delete(`/api/tasks/${id}`),

  updateStatus: async (task: Task, status: Task['status']) => {
    return taskApi.update(task.id, {
      title: task.title,
      description: task.description ?? '',
      status,
      priority: task.priority,
      due_date: task.due_date ?? null,
    });
  },
};
