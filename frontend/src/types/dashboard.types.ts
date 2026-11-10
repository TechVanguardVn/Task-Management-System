import type {
  Project,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from "./project.types";

export interface DashboardMetrics {
  totalProjects: number;
  activeProjects: number;
  archivedProjects: number;
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  doneTasks: number;
  overdueTasks: number;
  overallProgress: number;
}

export interface DashboardSummaryResponse {
  metrics: DashboardMetrics;
  projects: Project[];
}

export interface DashboardUpcomingTask {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
    color: string | null;
    status: ProjectStatus;
  };
}

export interface UpcomingTasksResponse {
  tasks: DashboardUpcomingTask[];
  meta: {
    total: number;
    overdueCount: number;
    limit: number;
  };
}
