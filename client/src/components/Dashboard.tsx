// src/modules/dashboard/pages/Dashboard.tsx (hoặc file dashboard hiện tại của bạn)
import React from 'react';
import { useAuthStore } from '../stores/useAuthStore';

export const Dashboard: React.FC = () => {
  // Lấy trực tiếp thông tin user và hàm logout từ Zustand
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout(); // Backend hủy cookie session, store chuyển isAuthenticated -> false
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-800">Task Management System</h1>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors border border-red-200 cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            Xin chào, {user?.name}! 
          </h2>
          <p className="text-gray-600 text-sm">
            Bạn đã đăng nhập thành công qua cơ chế <strong>Cookie-based SPA của Laravel Sanctum</strong>.
          </p>
        </div>
      </main>
    </div>
  );
};