import React from 'react';
import { LoginForm } from '../components/LoginForm';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-zinc-950">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800 p-8">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-md mb-3">
            TV
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Đăng nhập</h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Hệ thống Quản lý công việc & Bảng Kanban
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
};
