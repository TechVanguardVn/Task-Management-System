import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../shared/errors";
import { upcomingTasksQuerySchema } from "./dashboard.schema";
import {
  getDashboardSummaryForUser,
  getUpcomingTasksForUser,
} from "./dashboard.service";

function requireUserId(req: Request): string {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }
  return req.auth.user.id;
}

export async function getDashboardSummaryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const summary = await getDashboardSummaryForUser(userId);

    res.set("Cache-Control", "no-store");
    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
}

export async function getUpcomingTasksHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const query = upcomingTasksQuerySchema.parse(req.query);
    const result = await getUpcomingTasksForUser(userId, query);

    res.set("Cache-Control", "no-store");
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
