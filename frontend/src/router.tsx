import { Suspense } from "react";
import { Navigate } from "react-router";
import type { RouteObject } from "react-router";

import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PublicRoute } from "./components/auth/PublicRoute";
import { AppShell } from "./components/layout/AppShell";
import { SessionLoadingScreen } from "./components/layout/SessionLoadingScreen";
import {
  DashboardPage,
  KanbanPage,
  LoginPage,
  NotFoundPage,
  RegisterPage,
  TasksPage,
} from "./pages/lazyPages";

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    element: <PublicRoute />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "dashboard", element: <DashboardPage /> },
          { path: "tasks", element: <TasksPage /> },
          { path: "kanban", element: <KanbanPage /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: (
      <Suspense fallback={<SessionLoadingScreen />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
];
