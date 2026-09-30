import type { AppRoute } from '@/types/routesType';
import UserDetailPage from '@/modules/users/pages/UserDetailPage';

export const userRoutes: AppRoute[] = [
  {
    path: '/profile',
    element: <UserDetailPage />,
    isProtected: true,
    title: 'Thông tin người dùng',
  },
];
