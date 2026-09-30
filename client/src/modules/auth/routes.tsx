// src/modules/auth/routes.tsx
import type { AppRoute } from '../../types/routesType';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export const authRoutes: AppRoute[] = [
  {
    path: '/login',
    element: <LoginPage />,
    isProtected: false,
    title: 'Đăng nhập',
  },
  {
    path: '/register',
    element: <RegisterPage />,
    isProtected: false,
    title: 'Đăng ký tài khoản',
  }
  
];