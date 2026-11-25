import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Kanban,
  Download,
  LogOut,
  Sun,
  Moon,
  Clock,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';

interface LayoutProps {
  children: React.ReactNode;
  onOpenCreateTaskModal?: () => void;
  onToggleActivityDrawer?: () => void;
}

/**
 * Layout chính của ứng dụng chứa Sidebar điều hướng, Navbar và vùng nội dung chính.
 */
export const MainLayout: React.FC<LayoutProps> = ({
  children,
  onOpenCreateTaskModal,
  onToggleActivityDrawer,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Quản lý theme Sáng / Tối
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Tổng quan (Dashboard)', icon: LayoutDashboard },
    { to: '/tasks', label: 'Danh sách công việc', icon: CheckSquare },
    { to: '/kanban', label: 'Bảng Kanban', icon: Kanban },
    { to: '/export', label: 'Xuất báo cáo (Export)', icon: Download },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-zinc-950 overflow-hidden">
      {/* Sidebar thanh điều hướng bên trái */}
      <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo & Tên dự án */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-100 dark:border-zinc-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              TV
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 dark:text-zinc-100 leading-tight">TaskManager</h1>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400">TechVanguard Edition</p>
            </div>
          </div>

          {/* Nút Tạo nhanh công việc */}
          {onOpenCreateTaskModal && (
            <div className="p-4">
              <Button
                variant="primary"
                size="md"
                className="w-full shadow-sm"
                onClick={onOpenCreateTaskModal}
              >
                <Plus className="w-4 h-4" />
                <span>Tạo công việc (C)</span>
              </Button>
            </div>
          )}

          {/* Danh mục menu */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-200'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Thông tin User và nút Đăng xuất ở chân Sidebar */}
        <div className="p-4 border-t border-gray-100 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-semibold text-gray-700 dark:text-zinc-200 shrink-0">
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-zinc-100 truncate">{user?.fullName}</p>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              title="Đổi giao diện Sáng / Tối"
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-zinc-600" />}
              <span>{isDark ? 'Sáng' : 'Tối'}</span>
            </button>

            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="flex items-center justify-center p-1.5 rounded-lg text-xs font-medium border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Vùng nội dung chính */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header trên cùng */}
        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400">
            <span>Chào mừng trở lại,</span>
            <span className="font-semibold text-gray-900 dark:text-zinc-100">{user?.fullName}</span>
          </div>

          <div className="flex items-center gap-3">
            {onToggleActivityDrawer && (
              <button
                onClick={onToggleActivityDrawer}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 transition-colors"
                title="Xem lịch sử hoạt động (Audit Trail)"
              >
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nhật ký hoạt động</span>
              </button>
            )}
          </div>
        </header>

        {/* Nội dung trang */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
