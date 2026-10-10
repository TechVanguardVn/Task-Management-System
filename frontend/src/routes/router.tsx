import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/routes/ProtectedRoute'
import GuestRoute from '@/routes/GuestRoute'
import { PageLoading } from '@/components/ui/PageLoading/PageLoading'

const LoginPage    = lazy(() => import('@/pages/Auth/login/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/Auth/register/RegisterPage'))
const VerifyEmailPage = lazy(() => import('@/pages/Auth/verify-email/VerifyEmailPage'))
const MainLayout   = lazy(() => import('@/components/layout/MainLayout'))
const DashboardPage  = lazy(() => import('@/pages/Dashboard'))
const TaskListPage   = lazy(() => import('@/pages/Tasks/TaskList/TaskListPage'))
const TaskBoardPage  = lazy(() => import('@/pages/Tasks/TaskBoard/TaskBoardPage'))
const WorkspaceHubPage = lazy(() => import('@/pages/WorkspaceHub/WorkspaceHubPage'))
const WorkspaceMembersPage = lazy(() => import('@/pages/WorkspaceMembers/WorkspaceMembersPage'))
const NotFoundPage   = lazy(() => import('@/pages/error/NotFoundPage'))
const ForbiddenPage  = lazy(() => import('@/pages/error/ForbiddenPage'))

const withSuspense = (element: React.ReactNode) => (
  <Suspense fallback={<PageLoading />}>{element}</Suspense>
)

const withAuthSuspense = (element: React.ReactNode) => (
  <Suspense fallback={<PageLoading />}>{element}</Suspense>
)

const router = createBrowserRouter([
  {
    path: '/login',
    element: withAuthSuspense(<GuestRoute><LoginPage /></GuestRoute>),
  },
  {
    path: '/register',
    element: withAuthSuspense(<GuestRoute><RegisterPage /></GuestRoute>),
  },
  {
    path: '/verify-email',
    element: withAuthSuspense(<GuestRoute><VerifyEmailPage /></GuestRoute>),
  },
  {
    path: '/403',
    element: withSuspense(<ForbiddenPage />),
  },
  {
    path: '/',
    element: withSuspense(<ProtectedRoute><MainLayout /></ProtectedRoute>),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: withSuspense(<DashboardPage />) },
      { path: 'task-list', element: withSuspense(<TaskListPage />) },
      { path: 'kanban-board', element: withSuspense(<TaskBoardPage />) },
      { path: 'workspaces', element: withSuspense(<WorkspaceHubPage />) },
      { path: 'workspaces/:workspaceId/members', element: withSuspense(<WorkspaceMembersPage />) },
    ],
  },
  {
    path: '*',
    element: withSuspense(<NotFoundPage />),
  },
])

export default router
