import type { SortOrder, TaskPriority, TaskStatus } from "./project.types";

export type TaskSortBy =
  | "createdAt"
  | "updatedAt"
  | "dueDate"
  | "priority"
  | "title";

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListTasksResponse {
  tasks: Task[];
  pagination: TaskPaginationMeta;
}

export interface ListTasksFilterParams {
  search?: string;
  status?: TaskStatus | "ALL";
  priority?: TaskPriority | "ALL";
  sortBy?: TaskSortBy;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
}
