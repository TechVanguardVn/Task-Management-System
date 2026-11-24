import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from '../layouts/AppLayout.jsx'
import { ProtectedLayout } from '../layouts/ProtectedLayout.jsx'
import { AuthLayout } from '../layouts/AuthLayout.jsx'
import { DashboardPage } from '../pages/DashboardPage.jsx'
import { ProjectsPage } from '../pages/ProjectsPage.jsx'
import { ProjectTasksPage } from '../pages/ProjectTasksPage.jsx'
import { TasksPage } from '../pages/TasksPage.jsx'
import { TaskDetailsPage } from '../pages/TaskDetailsPage.jsx'
import { LoginPage } from '../pages/LoginPage.jsx'
import { RegisterPage } from '../pages/RegisterPage.jsx'
import { NotFoundPage } from '../pages/NotFoundPage.jsx'

const KanbanPage = lazy(() =>
  import('../pages/KanbanPage.jsx').then((module) => ({
    default: module.KanbanPage,
  })),
)

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedLayout />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route
            path="/projects/:projectId/tasks"
            element={<ProjectTasksPage />}
          />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/:taskId" element={<TaskDetailsPage />} />
          <Route
            path="/kanban"
            element={
              <Suspense fallback={<p role="status">Đang tải bảng Kanban…</p>}>
                <KanbanPage />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
