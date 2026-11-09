import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  deleteTaskHandler,
  getTaskHandler,
  updateTaskHandler,
} from "./tasks.controller";

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

tasksRouter.get("/:taskId", getTaskHandler);
tasksRouter.patch("/:taskId", updateTaskHandler);
tasksRouter.delete("/:taskId", deleteTaskHandler);
