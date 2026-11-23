export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];
export const PRIORITIES: TaskPriority[] = ['HIGH', 'MEDIUM', 'LOW'];

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  tags: string[];
  position: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  tags?: string[];
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export type Board = Record<TaskStatus, Task[]>;

export interface DashboardData {
  stats: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    overdue: number;
    completionRate: number;
  };
  openByPriority: Record<TaskPriority, number>;
  upcoming: Task[];
  overdue: Task[];
  upcomingWindowDays: number;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
}

export interface ListParams {
  search?: string;
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title';
  order?: 'asc' | 'desc';
}
