import express from "express";
import { fileURLToPath } from "node:url";
import swaggerUi from "swagger-ui-express";
import { prisma } from "./db";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { authRouter } from "./modules/auth/auth.routes";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";
import { projectsRouter } from "./modules/projects/projects.routes";
import { tasksRouter } from "./modules/tasks/tasks.routes";

export const app = express();

app.disable("x-powered-by");

app.use((_req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(express.json({ limit: "100kb" }));

const specPath = fileURLToPath(new URL("../openapi.yaml", import.meta.url));
app.get("/api/openapi.yaml", (_req, res) => {
  res.type("application/yaml").sendFile(specPath);
});
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(null, {
  swaggerUrl: "/api/openapi.yaml",
  swaggerOptions: { validatorUrl: null },
  customSiteTitle: "Task Management API",
}));

app.get("/api/v1/health", async (_req, res) => {
  res.set("Cache-Control", "no-store");
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "unavailable" });
  }
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/projects", projectsRouter);
app.use("/api/v1/tasks", tasksRouter);
app.use("/api/v1/dashboard", dashboardRouter);

app.use(notFoundHandler);
app.use(errorHandler);
