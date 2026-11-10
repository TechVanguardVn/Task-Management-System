import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  getDashboardSummaryHandler,
  getUpcomingTasksHandler,
} from "./dashboard.controller";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get("/summary", getDashboardSummaryHandler);
dashboardRouter.get("/upcoming-tasks", getUpcomingTasksHandler);
