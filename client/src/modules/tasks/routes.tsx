import type { AppRoute } from '../../types/routesType';
import TaskDashboardPage from '@/modules/tasks/pages/TaskDashboardPage';
import TaskPage from '@/modules/tasks/pages/TaskPage';

export const taskRoutes: AppRoute[] = [
  {
    path: '/dashboard',
    element: <TaskDashboardPage />,
    isProtected: true,
    title: 'Dashboard chung',
  },
  {
    path: '/tasks',
    element: <TaskPage />,
    isProtected: true,
    title: 'Quản lý công việc',
  },
];
