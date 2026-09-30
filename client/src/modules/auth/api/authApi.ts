import axiosClient from '@/api/axiosClient';
import type { LoginPayload, RegisterPayload, User } from '@/modules/auth/types/authType';

export const authApi = {
  // 1. Bước bắt buộc trước khi Login/Register: Lấy CSRF Cookie
  getCsrfCookie: (): Promise<void> => {
    return axiosClient.get('/sanctum/csrf-cookie');
  },

  // 2. Đăng ký tài khoản
  register: (payload: RegisterPayload): Promise<{ user: User }> => {
    return axiosClient.post('/api/auth/register', payload);
  },

  // 3. Đăng nhập
  login: (payload: LoginPayload): Promise<{ message: string; user?: User }> => {
    return axiosClient.post('/api/auth/login', payload);
  },

  // 4. Lấy thông tin người dùng hiện tại (profile)
  getProfile: (): Promise<User> => {
    return axiosClient.get('/api/auth/user');
  },

  // 5. Đăng xuất
  logout: (): Promise<{ message: string }> => {
    return axiosClient.post('/api/auth/logout');
  },
};