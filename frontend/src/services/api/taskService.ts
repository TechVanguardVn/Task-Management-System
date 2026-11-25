import { axiosClient } from './axiosClient';
import { ApiResponse, PageResponse } from '../../types/api.types';
import {
  CreateSubtaskRequest,
  CreateTaskRequest,
  SubtaskResponse,
  TaskDetailResponse,
  TaskFilterParams,
  TaskResponse,
  TaskStatus,
  UpdateSubtaskRequest,
  UpdateTaskRequest,
  UpdateTaskStatusRequest,
} from '../../types/task.types';

/**
 * Service giao tiếp toàn bộ các API liên quan đến Task và Subtask.
 */
export const taskService = {
  /**
   * Lấy danh sách công việc có phân trang và bộ lọc đa năng.
   */
  async getTasks(params: TaskFilterParams): Promise<PageResponse<TaskResponse>> {
    const response = await axiosClient.get<ApiResponse<PageResponse<TaskResponse>>>('/tasks', {
      params,
    });
    return response.data.data;
  },

  /**
   * Lấy danh sách toàn bộ công việc theo trạng thái cho Bảng Kanban.
   */
  async getKanbanTasks(status?: TaskStatus): Promise<TaskResponse[]> {
    const response = await axiosClient.get<ApiResponse<TaskResponse[]>>('/tasks/kanban', {
      params: { status },
    });
    return response.data.data;
  },

  /**
   * Lấy thông tin chi tiết một task (bao gồm cả subtasks và activity logs).
   */
  async getTaskById(id: number): Promise<TaskDetailResponse> {
    const response = await axiosClient.get<ApiResponse<TaskDetailResponse>>(`/tasks/${id}`);
    return response.data.data;
  },

  /**
   * Tạo mới một công việc.
   */
  async createTask(data: CreateTaskRequest): Promise<TaskResponse> {
    const response = await axiosClient.post<ApiResponse<TaskResponse>>('/tasks', data);
    return response.data.data;
  },

  /**
   * Cập nhật thông tin chi tiết công việc.
   */
  async updateTask(id: number, data: UpdateTaskRequest): Promise<TaskResponse> {
    const response = await axiosClient.put<ApiResponse<TaskResponse>>(`/tasks/${id}`, data);
    return response.data.data;
  },

  /**
   * Cập nhật nhanh trạng thái công việc (Kéo thả Kanban).
   */
  async updateTaskStatus(id: number, data: UpdateTaskStatusRequest): Promise<TaskResponse> {
    const response = await axiosClient.patch<ApiResponse<TaskResponse>>(`/tasks/${id}/status`, data);
    return response.data.data;
  },

  /**
   * Xóa một công việc.
   */
  async deleteTask(id: number): Promise<void> {
    await axiosClient.delete<ApiResponse<void>>(`/tasks/${id}`);
  },

  /**
   * Thêm đầu việc con vào task cha.
   */
  async addSubtask(taskId: number, data: CreateSubtaskRequest): Promise<SubtaskResponse> {
    const response = await axiosClient.post<ApiResponse<SubtaskResponse>>(`/tasks/${taskId}/subtasks`, data);
    return response.data.data;
  },

  /**
   * Cập nhật thông tin subtask.
   */
  async updateSubtask(subtaskId: number, data: UpdateSubtaskRequest): Promise<SubtaskResponse> {
    const response = await axiosClient.put<ApiResponse<SubtaskResponse>>(`/subtasks/${subtaskId}`, data);
    return response.data.data;
  },

  /**
   * Đổi trạng thái hoàn thành / chưa hoàn thành của subtask.
   */
  async toggleSubtask(subtaskId: number): Promise<SubtaskResponse> {
    const response = await axiosClient.patch<ApiResponse<SubtaskResponse>>(`/subtasks/${subtaskId}/toggle`);
    return response.data.data;
  },

  /**
   * Xóa một subtask.
   */
  async deleteSubtask(subtaskId: number): Promise<void> {
    await axiosClient.delete<ApiResponse<void>>(`/subtasks/${subtaskId}`);
  },
};
