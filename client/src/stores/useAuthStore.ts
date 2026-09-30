import { create } from 'zustand';
import type { LoginPayload, RegisterPayload, User } from '../modules/auth/types/authType';
import { authApi } from '@/modules/auth/api/authApi';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  checkAuth: () => Promise<void>;
  login: (credentials: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // true khi mới vào trang để đợi check cookie

  // 1. Kiểm tra session cookie hiện tại khi F5 tải lại trang
  checkAuth: async () => {
    try {
      const user = await authApi.getProfile();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  // 2. Luồng đăng nhập chuẩn Cookie Sanctum
  login: async (credentials: LoginPayload) => {
    await authApi.getCsrfCookie(); // Lấy mã CSRF cookie
    await authApi.login(credentials);
    const user = await authApi.getProfile(); // Lấy profile sau khi đã có session
    set({ user, isAuthenticated: true });
  },

  // 3. Luồng đăng ký
  register: async (payload: RegisterPayload) => {
    await authApi.getCsrfCookie();
    await authApi.register(payload);
    const user = await authApi.getProfile();
    set({ user, isAuthenticated: true });
  },

  // 4. Luồng đăng xuất
  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
}));