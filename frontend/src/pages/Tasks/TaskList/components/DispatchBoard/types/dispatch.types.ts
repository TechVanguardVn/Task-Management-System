import type { Task } from '@/pages/Tasks/types/task.types'

export interface WorkspaceMember {
  id: string
  name: string
  avatar?: string
  role: string
  email: string
  activeTasksCount: number
}

export interface DispatchState {
  unassignedTasks: Task[]
  memberTasks: Record<string, Task[]>
}
