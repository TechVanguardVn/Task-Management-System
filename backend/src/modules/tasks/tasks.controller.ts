import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../shared/errors";
import {
  createTaskSchema,
  listTasksQuerySchema,
  updateTaskSchema,
} from "./tasks.schema";
import {
  createTaskInProjectForUser,
  deleteTaskForUser,
  getTaskForUser,
  listProjectTasksForUser,
  updateTaskForUser,
} from "./tasks.service";

function requireUserId(req: Request): string {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }
  return req.auth.user.id;
}

export async function listProjectTasksHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const projectId = String(req.params.projectId ?? "");
    const query = listTasksQuerySchema.parse(req.query);
    const result = await listProjectTasksForUser(userId, projectId, query);

    res.set("Cache-Control", "no-store");
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function createProjectTaskHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const projectId = String(req.params.projectId ?? "");
    const input = createTaskSchema.parse(req.body);
    const task = await createTaskInProjectForUser(userId, projectId, input);

    res.set("Cache-Control", "no-store");
    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
}

export async function getTaskHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const taskId = String(req.params.taskId ?? "");
    const task = await getTaskForUser(userId, taskId);

    res.set("Cache-Control", "no-store");
    res.status(200).json({ task });
  } catch (error) {
    next(error);
  }
}

export async function updateTaskHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const taskId = String(req.params.taskId ?? "");
    const input = updateTaskSchema.parse(req.body);
    const task = await updateTaskForUser(userId, taskId, input);

    res.set("Cache-Control", "no-store");
    res.status(200).json({ task });
  } catch (error) {
    next(error);
  }
}

export async function deleteTaskHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const taskId = String(req.params.taskId ?? "");
    await deleteTaskForUser(userId, taskId);

    res.set("Cache-Control", "no-store");
    res.status(200).json({ status: "deleted", taskId });
  } catch (error) {
    next(error);
  }
}
