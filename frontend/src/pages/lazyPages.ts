import { lazy } from "react";

export const DashboardPage = lazy(() =>
  import("./DashboardPage").then((m) => ({ default: m.DashboardPage })),
);

export const TasksPage = lazy(() =>
  import("./TasksPage").then((m) => ({ default: m.TasksPage })),
);

export const KanbanPage = lazy(() =>
  import("./KanbanPage").then((m) => ({ default: m.KanbanPage })),
);

export const LoginPage = lazy(() =>
  import("./LoginPage").then((m) => ({ default: m.LoginPage })),
);

export const RegisterPage = lazy(() =>
  import("./RegisterPage").then((m) => ({ default: m.RegisterPage })),
);

export const NotFoundPage = lazy(() =>
  import("./NotFoundPage").then((m) => ({ default: m.NotFoundPage })),
);
