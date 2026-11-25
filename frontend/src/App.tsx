import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { TasksPage } from './features/tasks/pages/TasksPage';
import { KanbanPage } from './features/tasks/pages/KanbanPage';
import { ExportPage } from './features/export/pages/ExportPage';
import { TaskModal } from './features/tasks/components/TaskModal';
import { ActivityDrawer } from './features/activity/components/ActivityDrawer';
import { taskService } from './services/api/taskService';
import { CreateTaskRequest } from './types/task.types';

/**
 * Route bảo vệ: Chỉ cho phép người dùng đã xác thực token truy cập,
 * ngược lại tự động điều hướng sang trang /login.
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 text-xs text-gray-400">
        Đang khởi động ứng dụng...
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppContent: React.FC = () => {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);

  const handleCreateTask = async (data: CreateTaskRequest) => {
    await taskService.createTask(data);
    setIsTaskModalOpen(false);
    // Tự động tải lại trang hiện tại để cập nhật danh sách
    window.location.reload();
  };

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected App Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout
                onOpenCreateTaskModal={() => setIsTaskModalOpen(true)}
                onToggleActivityDrawer={() => setIsActivityDrawerOpen(true)}
              >
                <Routes>
                  <Route path="/" element={<DashboardPage onOpenCreateTaskModal={() => setIsTaskModalOpen(true)} />} />
                  <Route path="/tasks" element={<TasksPage />} />
                  <Route path="/kanban" element={<KanbanPage />} />
                  <Route path="/export" element={<ExportPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>

      {/* Modal tạo nhanh task toàn cục (kích hoạt từ Navbar hoặc bấm phím C) */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleCreateTask}
      />

      {/* Ngăn kéo nhật ký hoạt động Audit Trail */}
      <ActivityDrawer
        isOpen={isActivityDrawerOpen}
        onClose={() => setIsActivityDrawerOpen(false)}
      />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
