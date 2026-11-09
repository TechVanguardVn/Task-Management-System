import { prisma } from "../../db";
import type { ProjectStatus, TaskPriority, TaskStatus } from "../../generated/prisma/client";
import type { ProjectTaskStats, ProjectWithStatsDto } from "../projects/projects.service";
import type { UpcomingTasksQuery } from "./dashboard.schema";

export interface DashboardMetricsDto {
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

export interface DashboardSummaryDto {
  metrics: DashboardMetricsDto;
  projects: ProjectWithStatsDto[];
}

export interface DashboardUpcomingTaskDto {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isOverdue: boolean;
  createdAt: Date;
  updatedAt: Date;
  project: {
    id: string;
    name: string;
    color: string | null;
    status: ProjectStatus;
  };
}

export interface UpcomingTasksResultDto {
  tasks: DashboardUpcomingTaskDto[];
  meta: {
    total: number;
    overdueCount: number;
    limit: number;
  };
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

function getTodayUtcMidnight(): Date {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now;
}

function formatDateOnly(date: Date | null): string | null {
  if (!date) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

function computeTaskStats(
  tasks: Array<{ status: TaskStatus; dueDate: Date | null }>,
  todayUtc: Date,
): ProjectTaskStats {
  const totalTasks = tasks.length;
  let todoTasks = 0;
  let inProgressTasks = 0;
  let doneTasks = 0;
  let overdueTasks = 0;

  for (const task of tasks) {
    if (task.status === "TODO") {
      todoTasks += 1;
    } else if (task.status === "IN_PROGRESS") {
      inProgressTasks += 1;
    } else if (task.status === "DONE") {
      doneTasks += 1;
    }

    if (task.status !== "DONE" && task.dueDate && task.dueDate < todayUtc) {
      overdueTasks += 1;
    }
  }

  const progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  return {
    totalTasks,
    todoTasks,
    inProgressTasks,
    doneTasks,
    overdueTasks,
    progress,
  };
}

export async function getDashboardSummaryForUser(
  userId: string,
): Promise<DashboardSummaryDto> {
  const projects = await prisma.project.findMany({
    where: {
      ownerId: userId,
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      tasks: {
        select: {
          status: true,
          dueDate: true,
        },
      },
    },
  });

  const todayUtc = getTodayUtcMidnight();

  let activeProjects = 0;
  let archivedProjects = 0;
  let totalTasks = 0;
  let todoTasks = 0;
  let inProgressTasks = 0;
  let doneTasks = 0;
  let overdueTasks = 0;

  const projectDtos: ProjectWithStatsDto[] = projects.map((project) => {
    if (project.status === "ACTIVE") {
      activeProjects += 1;
    } else {
      archivedProjects += 1;
    }

    const stats = computeTaskStats(project.tasks, todayUtc);
    totalTasks += stats.totalTasks;
    todoTasks += stats.todoTasks;
    inProgressTasks += stats.inProgressTasks;
    doneTasks += stats.doneTasks;
    overdueTasks += stats.overdueTasks;

    return {
      id: project.id,
      ownerId: project.ownerId,
      name: project.name,
      description: project.description,
      color: project.color,
      status: project.status,
      startDate: formatDateOnly(project.startDate),
      dueDate: formatDateOnly(project.dueDate),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      stats,
    };
  });

  const overallProgress =
    totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  return {
    metrics: {
      totalProjects: projects.length,
      activeProjects,
      archivedProjects,
      totalTasks,
      todoTasks,
      inProgressTasks,
      doneTasks,
      overdueTasks,
      overallProgress,
    },
    projects: projectDtos.slice(0, 6),
  };
}

export async function getUpcomingTasksForUser(
  userId: string,
  query: UpcomingTasksQuery,
): Promise<UpcomingTasksResultDto> {
  const tasks = await prisma.task.findMany({
    where: {
      project: {
        ownerId: userId,
      },
      status: {
        not: "DONE",
      },
      dueDate: {
        not: null,
      },
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          color: true,
          status: true,
        },
      },
    },
  });

  const todayUtc = getTodayUtcMidnight();

  let overdueCount = 0;
  for (const task of tasks) {
    if (task.dueDate && task.dueDate < todayUtc) {
      overdueCount += 1;
    }
  }

  const sorted = [...tasks].sort((a, b) => {
    const dueDiff = a.dueDate!.getTime() - b.dueDate!.getTime();
    if (dueDiff !== 0) {
      return dueDiff;
    }
    const priorityDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  const limited = sorted.slice(0, query.limit).map((task) => {
    const dueDateStr = formatDateOnly(task.dueDate)!;
    const isOverdue = Boolean(task.dueDate && task.dueDate < todayUtc);

    return {
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: dueDateStr,
      isOverdue,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      project: {
        id: task.project.id,
        name: task.project.name,
        color: task.project.color,
        status: task.project.status,
      },
    };
  });

  return {
    tasks: limited,
    meta: {
      total: tasks.length,
      overdueCount,
      limit: query.limit,
    },
  };
}
