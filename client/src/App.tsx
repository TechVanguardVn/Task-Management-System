import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AppRoutes } from './routes/AppRoutes';
import { useAuthStore } from './stores/useAuthStore';

export default function App() {
  const { user, logout, isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 font-medium">Đang kiểm tra phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  const routes = <AppRoutes isAuthenticated={isAuthenticated} />;

  return (
    <BrowserRouter>
      {isAuthenticated ? (
        <AppLayout userName={user?.name} onLogout={logout} >
          {routes}
        </AppLayout>
      ) : (
        routes
      )}
    </BrowserRouter>
  );
}