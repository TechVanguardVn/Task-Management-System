import { prisma } from "../../db";
import type { Prisma, ProjectStatus, TaskPriority, TaskStatus } from "../../generated/prisma/client";
import { AppError } from "../../shared/errors";
import {
  type CreateProjectInput,
  isValidUuid,
  type ListProjectsQuery,
  type UpdateProjectInput,
} from "./projects.schema";

const DEFAULT_PROJECT_COLOR = "#2563eb";

export interface ProjectTaskStats {
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  doneTasks: number;
  overdueTasks: number;
  progress: number;
}

export interface ProjectWithStatsDto {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  color: string | null;
  status: ProjectStatus;
  startDate: string | null;
  dueDate: string | null;
  createdAt: Date;
  updatedAt: Date;
  stats: ProjectTaskStats;
}

export interface ProjectSummaryTaskItem {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  completedAt: Date | null;
  updatedAt: Date;
}

export interface ProjectSummaryDto {
  project: ProjectWithStatsDto;
  upcomingTasks: ProjectSummaryTaskItem[];
  recentTasks: ProjectSummaryTaskItem[];
}

export interface ListProjectsResult {
  projects: ProjectWithStatsDto[];
  meta: {
    total: number;
    activeCount: number;
    archivedCount: number;
  };
}

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

function parseDateOnlyToUtc(dateStr: string | null | undefined): Date | null | undefined {
  if (dateStr === undefined) {
    return undefined;
  }
  if (dateStr === null) {
    return null;
  }
  return new Date(`${dateStr}T00:00:00.000Z`);
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

function toProjectWithStatsDto(
  project: {
    id: string;
    ownerId: string;
    name: string;
    description: string | null;
    color: string | null;
    status: ProjectStatus;
    startDate: Date | null;
    dueDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    tasks: Array<{ status: TaskStatus; dueDate: Date | null }>;
  },
  todayUtc: Date,
): ProjectWithStatsDto {
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
    stats: computeTaskStats(project.tasks, todayUtc),
  };
}

export async function listProjectsForUser(
  userId: string,
  query: ListProjectsQuery,
): Promise<ListProjectsResult> {
  const where: Prisma.ProjectWhereInput = {
    ownerId: userId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  let orderBy: Prisma.ProjectOrderByWithRelationInput[];
  if (query.sortBy === "dueDate") {
    orderBy = [
      { dueDate: { sort: query.sortOrder, nulls: "last" } },
      { updatedAt: "desc" },
    ];
  } else if (query.sortBy === "name") {
    orderBy = [{ name: query.sortOrder }, { updatedAt: "desc" }];
  } else if (query.sortBy === "createdAt") {
    orderBy = [{ createdAt: query.sortOrder }];
  } else {
    orderBy = [{ updatedAt: query.sortOrder }];
  }

  const [projects, statusCounts] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy,
      include: {
        tasks: {
          select: {
            status: true,
            dueDate: true,
          },
        },
      },
    }),
    prisma.project.groupBy({
      by: ["status"],
      where: { ownerId: userId },
      _count: { _all: true },
    }),
  ]);

  let activeCount = 0;
  let archivedCount = 0;
  for (const row of statusCounts) {
    if (row.status === "ACTIVE") {
      activeCount = row._count._all;
    } else if (row.status === "ARCHIVED") {
      archivedCount = row._count._all;
    }
  }

  const todayUtc = getTodayUtcMidnight();

  return {
    projects: projects.map((project) => toProjectWithStatsDto(project, todayUtc)),
    meta: {
      total: activeCount + archivedCount,
      activeCount,
      archivedCount,
    },
  };
}

export async function createProjectForUser(
  userId: string,
  input: CreateProjectInput,
): Promise<ProjectWithStatsDto> {
  const created = await prisma.project.create({
    data: {
      ownerId: userId,
      name: input.name,
      description: input.description ?? null,
      color: input.color ?? DEFAULT_PROJECT_COLOR,
      startDate: parseDateOnlyToUtc(input.startDate) ?? null,
      dueDate: parseDateOnlyToUtc(input.dueDate) ?? null,
    },
    include: {
      tasks: {
        select: {
          status: true,
          dueDate: true,
        },
      },
    },
  });

  return toProjectWithStatsDto(created, getTodayUtcMidnight());
}

export async function getProjectForUser(
  userId: string,
  projectId: string,
): Promise<ProjectWithStatsDto> {
  if (!isValidUuid(projectId)) {
    throw new AppError(404, "PROJECT_NOT_FOUND", "Project not found.");
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
    include: {
      tasks: {
        select: {
          status: true,
          dueDate: true,
        },
      },
    },
  });

  if (!project) {
    throw new AppError(404, "PROJECT_NOT_FOUND", "Project not found.");
  }

  return toProjectWithStatsDto(project, getTodayUtcMidnight());
}

export async function getProjectSummaryForUser(
  userId: string,
  projectId: string,
): Promise<ProjectSummaryDto> {
  if (!isValidUuid(projectId)) {
    throw new AppError(404, "PROJECT_NOT_FOUND", "Project not found.");
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
    include: {
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          completedAt: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  });

  if (!project) {
    throw new AppError(404, "PROJECT_NOT_FOUND", "Project not found.");
  }

  const todayUtc = getTodayUtcMidnight();
  const projectDto = toProjectWithStatsDto(project, todayUtc);

  const upcomingTasks = project.tasks
    .filter((task) => task.status !== "DONE" && task.dueDate !== null)
    .sort((a, b) => (a.dueDate!.getTime() - b.dueDate!.getTime()))
    .slice(0, 6)
    .map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: formatDateOnly(task.dueDate),
      completedAt: task.completedAt,
      updatedAt: task.updatedAt,
    }));

  const recentTasks = project.tasks.slice(0, 6).map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueDate: formatDateOnly(task.dueDate),
    completedAt: task.completedAt,
    updatedAt: task.updatedAt,
  }));

  return {
    project: projectDto,
    upcomingTasks,
    recentTasks,
  };
}

export async function updateProjectForUser(
  userId: string,
  projectId: string,
  input: UpdateProjectInput,
): Promise<ProjectWithStatsDto> {
  if (!isValidUuid(projectId)) {
    throw new AppError(404, "PROJECT_NOT_FOUND", "Project not found.");
  }

  const existing = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
    select: {
      id: true,
      startDate: true,
      dueDate: true,
    },
  });

  if (!existing) {
    throw new AppError(404, "PROJECT_NOT_FOUND", "Project not found.");
  }

  const effectiveStartDate =
    input.startDate !== undefined
      ? input.startDate
      : formatDateOnly(existing.startDate);
  const effectiveDueDate =
    input.dueDate !== undefined
      ? input.dueDate
      : formatDateOnly(existing.dueDate);

  if (effectiveStartDate && effectiveDueDate && effectiveDueDate < effectiveStartDate) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "Due date must be on or after the start date.",
      [{ field: "dueDate", message: "Due date must be on or after the start date." }],
    );
  }

  const updated = await prisma.project.update({
    where: { id: existing.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.startDate !== undefined
        ? { startDate: parseDateOnlyToUtc(input.startDate) }
        : {}),
      ...(input.dueDate !== undefined
        ? { dueDate: parseDateOnlyToUtc(input.dueDate) }
        : {}),
    },
    include: {
      tasks: {
        select: {
          status: true,
          dueDate: true,
        },
      },
    },
  });

  return toProjectWithStatsDto(updated, getTodayUtcMidnight());
}

export async function deleteProjectForUser(
  userId: string,
  projectId: string,
): Promise<void> {
  if (!isValidUuid(projectId)) {
    throw new AppError(404, "PROJECT_NOT_FOUND", "Project not found.");
  }

  const deleted = await prisma.project.deleteMany({
    where: {
      id: projectId,
      ownerId: userId,
    },
  });

  if (deleted.count === 0) {
    throw new AppError(404, "PROJECT_NOT_FOUND", "Project not found.");
  }
}
