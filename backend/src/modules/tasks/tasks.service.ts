import { prisma } from "../../db";
import type { Prisma, TaskPriority, TaskStatus } from "../../generated/prisma/client";
import { AppError } from "../../shared/errors";
import {
  type CreateTaskInput,
  isValidUuid,
  type ListTasksQuery,
  type UpdateTaskInput,
} from "./tasks.schema";

export interface TaskDto {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListTasksResult {
  tasks: TaskDto[];
  pagination: TaskPaginationMeta;
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

function toTaskDto(task: {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): TaskDto {
  return {
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: formatDateOnly(task.dueDate),
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function rethrowIfArchivedTriggerError(err: unknown): never {
  if (
    err instanceof Error &&
    (err.message.includes("tasks_project_active") ||
      err.message.includes("Cannot create or update tasks in an archived project"))
  ) {
    throw new AppError(
      409,
      "PROJECT_ARCHIVED",
      "Cannot create or update tasks in an archived project.",
    );
  }
  throw err;
}

export async function listProjectTasksForUser(
  userId: string,
  projectId: string,
  query: ListTasksQuery,
): Promise<ListTasksResult> {
  if (!isValidUuid(projectId)) {
    throw new AppError(404, "PROJECT_NOT_FOUND", "Project not found.");
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
    select: {
      id: true,
    },
  });

  if (!project) {
    throw new AppError(404, "PROJECT_NOT_FOUND", "Project not found.");
  }

  const where: Prisma.TaskWhereInput = {
    projectId: project.id,
    ...(query.status ? { status: query.status } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
    ...(query.search
      ? {
          title: {
            contains: query.search,
            mode: "insensitive",
          },
        }
      : {}),
  };

  let orderBy: Prisma.TaskOrderByWithRelationInput[];
  if (query.sortBy === "dueDate") {
    orderBy = [
      { dueDate: { sort: query.sortOrder, nulls: "last" } },
      { createdAt: "desc" },
    ];
  } else if (query.sortBy === "priority") {
    orderBy = [{ priority: query.sortOrder }, { createdAt: "desc" }];
  } else if (query.sortBy === "title") {
    orderBy = [{ title: query.sortOrder }, { createdAt: "desc" }];
  } else if (query.sortBy === "updatedAt") {
    orderBy = [{ updatedAt: query.sortOrder }];
  } else {
    orderBy = [{ createdAt: query.sortOrder }];
  }

  const skip = (query.page - 1) * query.limit;

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy,
      skip,
      take: query.limit,
    }),
    prisma.task.count({ where }),
  ]);

  const totalPages = total === 0 ? 1 : Math.ceil(total / query.limit);

  return {
    tasks: tasks.map(toTaskDto),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
    },
  };
}

export async function createTaskInProjectForUser(
  userId: string,
  projectId: string,
  input: CreateTaskInput,
): Promise<TaskDto> {
  if (!isValidUuid(projectId)) {
    throw new AppError(404, "PROJECT_NOT_FOUND", "Project not found.");
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!project) {
    throw new AppError(404, "PROJECT_NOT_FOUND", "Project not found.");
  }

  if (project.status === "ARCHIVED") {
    throw new AppError(
      409,
      "PROJECT_ARCHIVED",
      "Cannot create or update tasks in an archived project.",
    );
  }

  try {
    const created = await prisma.task.create({
      data: {
        projectId: project.id,
        title: input.title,
        description: input.description ?? null,
        status: input.status,
        priority: input.priority,
        dueDate: parseDateOnlyToUtc(input.dueDate) ?? null,
      },
    });

    return toTaskDto(created);
  } catch (err) {
    rethrowIfArchivedTriggerError(err);
  }
}

export async function getTaskForUser(
  userId: string,
  taskId: string,
): Promise<TaskDto> {
  if (!isValidUuid(taskId)) {
    throw new AppError(404, "TASK_NOT_FOUND", "Task not found.");
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        ownerId: userId,
      },
    },
  });

  if (!task) {
    throw new AppError(404, "TASK_NOT_FOUND", "Task not found.");
  }

  return toTaskDto(task);
}

export async function updateTaskForUser(
  userId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<TaskDto> {
  if (!isValidUuid(taskId)) {
    throw new AppError(404, "TASK_NOT_FOUND", "Task not found.");
  }

  const existing = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        ownerId: userId,
      },
    },
    select: {
      id: true,
      project: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!existing) {
    throw new AppError(404, "TASK_NOT_FOUND", "Task not found.");
  }

  if (existing.project.status === "ARCHIVED") {
    throw new AppError(
      409,
      "PROJECT_ARCHIVED",
      "Cannot create or update tasks in an archived project.",
    );
  }

  try {
    const updated = await prisma.task.update({
      where: {
        id: existing.id,
      },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.dueDate !== undefined
          ? { dueDate: parseDateOnlyToUtc(input.dueDate) }
          : {}),
      },
    });

    return toTaskDto(updated);
  } catch (err) {
    rethrowIfArchivedTriggerError(err);
  }
}

export async function deleteTaskForUser(
  userId: string,
  taskId: string,
): Promise<void> {
  if (!isValidUuid(taskId)) {
    throw new AppError(404, "TASK_NOT_FOUND", "Task not found.");
  }

  const existing = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        ownerId: userId,
      },
    },
    select: {
      id: true,
      project: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!existing) {
    throw new AppError(404, "TASK_NOT_FOUND", "Task not found.");
  }

  if (existing.project.status === "ARCHIVED") {
    throw new AppError(
      409,
      "PROJECT_ARCHIVED",
      "Cannot delete tasks in an archived project.",
    );
  }

  await prisma.task.delete({
    where: {
      id: existing.id,
    },
  });
}
