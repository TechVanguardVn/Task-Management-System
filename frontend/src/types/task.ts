export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskCreatePayload {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
}

export interface TaskUpdatePayload {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
}

export interface TaskStatusUpdatePayload {
  status: TaskStatus;
}

export interface TaskFilterParams {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  page?: number;
  page_size?: number;
}

export interface PaginatedTasksResponse {
  items: Task[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
