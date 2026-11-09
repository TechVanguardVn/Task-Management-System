import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  createProjectTaskHandler,
  listProjectTasksHandler,
} from "../tasks/tasks.controller";
import {
  createProjectHandler,
  deleteProjectHandler,
  getProjectHandler,
  getProjectSummaryHandler,
  listProjectsHandler,
  updateProjectHandler,
} from "./projects.controller";

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

projectsRouter.get("/", listProjectsHandler);
projectsRouter.post("/", createProjectHandler);
projectsRouter.get("/:projectId", getProjectHandler);
projectsRouter.get("/:projectId/summary", getProjectSummaryHandler);
projectsRouter.patch("/:projectId", updateProjectHandler);
projectsRouter.delete("/:projectId", deleteProjectHandler);
projectsRouter.get("/:projectId/tasks", listProjectTasksHandler);
projectsRouter.post("/:projectId/tasks", createProjectTaskHandler);
