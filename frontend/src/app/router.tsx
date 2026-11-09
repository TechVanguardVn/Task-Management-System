import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute } from "../components/ProtectedRoute";
import { AuthPage } from "../features/auth/pages/AuthPage";
import { DashboardPlaceholderPage } from "../features/dashboard/pages/DashboardPlaceholderPage";
import { ProjectsPlaceholderPage } from "../features/projects/pages/ProjectsPlaceholderPage";
import { AppShell } from "../layouts/AppShell";

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: "/login",
        element: <AuthPage mode="login" />,
      },
      {
        path: "/register",
        element: <AuthPage mode="register" />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardPlaceholderPage />,
          },
          {
            path: "/projects",
            element: <ProjectsPlaceholderPage />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);
