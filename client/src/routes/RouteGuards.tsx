import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface GuardProps {
  isAuthenticated: boolean;
}

// Chặn người chưa đăng nhập vào trang nội bộ
export const ProtectedRoute: React.FC<GuardProps> = ({ isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

// Chặn người đã đăng nhập quay lại trang login/register
export const GuestRoute: React.FC<GuardProps> = ({ isAuthenticated }) => {
  if (isAuthenticated) {
    return <Navigate to="/tasks" replace />;
  }
  return <Outlet />;
};