import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, LoginRequest, RegisterRequest } from '../types/user.types';
import { authService } from '../services/api/authService';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider quản lý trạng thái xác thực toàn cầu trong ứng dụng React.
 * Tự động đồng bộ với localStorage để giữ trạng thái đăng nhập khi người dùng F5 tải lại trang.
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem('user_info');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('access_token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Khi ứng dụng khởi chạy lần đầu, kiểm tra token hợp lệ bằng cách gọi API /auth/me
  useEffect(() => {
    const verifyAuth = async () => {
      const savedToken = localStorage.getItem('access_token');
      if (savedToken) {
        try {
          const profile = await authService.getCurrentUser();
          setUser(profile);
          localStorage.setItem('user_info', JSON.stringify(profile));
        } catch {
          // Token không hợp lệ hoặc đã hết hạn
          setUser(null);
          setToken(null);
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_info');
        }
      }
      setIsLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    const authData = await authService.login(data);
    setToken(authData.accessToken);
    setUser(authData.user);
    localStorage.setItem('access_token', authData.accessToken);
    localStorage.setItem('user_info', JSON.stringify(authData.user));
  };

  const register = async (data: RegisterRequest) => {
    await authService.register(data);
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};
