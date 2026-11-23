/**
 * Định nghĩa các kiểu dữ liệu cho Task, Subtask và Activity Log.
 */
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TaskResponse {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  subtaskCount: number;
  completedSubtaskCount: number;
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubtaskResponse {
  id: number;
  title: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface TaskActivityLogResponse {
  id: number;
  action: string;
  description: string;
  taskId?: number;
  taskTitle?: string;
  userName?: string;
  createdAt: string;
}

export interface TaskDetailResponse extends TaskResponse {
  subtasks: SubtaskResponse[];
  activityLogs: TaskActivityLogResponse[];
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  subtaskTitles?: string[];
}

export interface UpdateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
}

export interface CreateSubtaskRequest {
  title: string;
}

export interface UpdateSubtaskRequest {
  title: string;
  isCompleted?: boolean;
}

export interface TaskFilterParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}
