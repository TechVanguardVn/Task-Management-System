export interface DashboardStats {
  total: number
  completionRate: number
  overdueCount: number
  statusCounts: {
    TODO: number
    IN_PROGRESS: number
    DONE: number
  }
  priorityCounts: {
    LOW: number
    MEDIUM: number
    HIGH: number
    URGENT: number
  }
}

export interface AssigneeData {
  fullName: string
  avatar: string
  role?: string
}

export interface UpcomingTask {
  id: string
  title: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate: string
  assignee: AssigneeData
}

export interface WorkloadData {
  assignee: AssigneeData
  activeTasks: number
}

export interface DashboardData {
  stats: DashboardStats
  upcomingTasks: UpcomingTask[]
  workload: WorkloadData[]
}
