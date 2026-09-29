export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface User { id: number | string; email: string; fullName: string }
export interface AuthResponse { token: string; user: User }
export interface Task {
  id: number | string
  title: string
  description?: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string | null
  createdAt: string
  updatedAt: string
}
export interface TaskInput { title: string; description?: string; status: TaskStatus; priority: TaskPriority; dueDate?: string | null }
export interface TaskPage { content: Task[]; totalElements: number; totalPages: number; number: number; size: number }
export interface Dashboard { total: number; todo: number; inProgress: number; done: number; upcomingTasks: Task[] }
