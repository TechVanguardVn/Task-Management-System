import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../shared/errors";
import {
  createProjectSchema,
  listProjectsQuerySchema,
  updateProjectSchema,
} from "./projects.schema";
import {
  createProjectForUser,
  deleteProjectForUser,
  getProjectForUser,
  getProjectSummaryForUser,
  listProjectsForUser,
  updateProjectForUser,
} from "./projects.service";

function requireUserId(req: Request): string {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }
  return req.auth.user.id;
}

export async function listProjectsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const query = listProjectsQuerySchema.parse(req.query);
    const result = await listProjectsForUser(userId, query);

    res.set("Cache-Control", "no-store");
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function createProjectHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const input = createProjectSchema.parse(req.body);
    const project = await createProjectForUser(userId, input);

    res.set("Cache-Control", "no-store");
    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
}

export async function getProjectHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const projectId = String(req.params.projectId ?? "");
    const project = await getProjectForUser(userId, projectId);

    res.set("Cache-Control", "no-store");
    res.status(200).json({ project });
  } catch (error) {
    next(error);
  }
}

export async function getProjectSummaryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const projectId = String(req.params.projectId ?? "");
    const summary = await getProjectSummaryForUser(userId, projectId);

    res.set("Cache-Control", "no-store");
    res.status(200).json({ summary });
  } catch (error) {
    next(error);
  }
}

export async function updateProjectHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const projectId = String(req.params.projectId ?? "");
    const input = updateProjectSchema.parse(req.body);
    const project = await updateProjectForUser(userId, projectId, input);

    res.set("Cache-Control", "no-store");
    res.status(200).json({ project });
  } catch (error) {
    next(error);
  }
}

export async function deleteProjectHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const projectId = String(req.params.projectId ?? "");
    await deleteProjectForUser(userId, projectId);

    res.set("Cache-Control", "no-store");
    res.status(200).json({ status: "deleted", projectId });
  } catch (error) {
    next(error);
  }
}
