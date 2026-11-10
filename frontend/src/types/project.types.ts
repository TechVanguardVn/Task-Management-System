export type ProjectStatus = "ACTIVE" | "ARCHIVED";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type ProjectSortBy = "updatedAt" | "createdAt" | "name" | "dueDate";
export type SortOrder = "asc" | "desc";

export interface ProjectTaskStats {
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  doneTasks: number;
  overdueTasks: number;
  progress: number;
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  color: string | null;
  status: ProjectStatus;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  stats: ProjectTaskStats;
}

export interface ProjectSummaryTaskItem {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  completedAt: string | null;
  updatedAt: string;
}

export interface ProjectSummary {
  project: Project;
  upcomingTasks: ProjectSummaryTaskItem[];
  recentTasks: ProjectSummaryTaskItem[];
}

export interface ListProjectsMeta {
  total: number;
  activeCount: number;
  archivedCount: number;
}

export interface ListProjectsResponse {
  projects: Project[];
  meta: ListProjectsMeta;
}

export interface ListProjectsFilterParams {
  status?: ProjectStatus | "ALL";
  search?: string;
  sortBy?: ProjectSortBy;
  sortOrder?: SortOrder;
}

export const PROJECT_COLOR_PRESETS = [
  { value: "#2563eb", label: "Blue" },
  { value: "#16a34a", label: "Green" },
  { value: "#7c3aed", label: "Purple" },
  { value: "#ea580c", label: "Orange" },
  { value: "#e11d48", label: "Rose" },
  { value: "#0891b2", label: "Cyan" },
  { value: "#4f46e5", label: "Indigo" },
  { value: "#0f172a", label: "Slate" },
] as const;
