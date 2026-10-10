export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface TaskAssignee {
  _id: string
  fullName: string
  email: string
  avatar?: string
}

export interface Task {
  _id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  tags: string[]
  order: number
  userId: string
  workspaceId: string
  assigneeId?: TaskAssignee | string
  createdAt: string
  updatedAt: string
}

export interface GetTasksQuery {
  workspaceId: string
  assigneeId?: string
  status?: TaskStatus
  priority?: TaskPriority
  search?: string
  tags?: string
  sortBy?: 'createdAt' | 'dueDate' | 'priority' | 'order'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface ReorderItem {
  id: string
  order: number
  status: TaskStatus
}
