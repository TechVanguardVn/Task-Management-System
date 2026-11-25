import { axiosClient } from './axiosClient';
import { ApiResponse } from '../../types/api.types';
import { AuthResponse, LoginRequest, RegisterRequest, UserProfile } from '../../types/user.types';

/**
 * Tầng Service giao tiếp các API xác thực người dùng.
 * Tách biệt hoàn toàn việc gọi HTTP ra khỏi component giao diện (tuân thủ quy chuẩn số 7: API Separation).
 */
export const authService = {
  /**
   * Đăng ký tài khoản mới.
   */
  async register(data: RegisterRequest): Promise<UserProfile> {
    const response = await axiosClient.post<ApiResponse<UserProfile>>('/auth/register', data);
    return response.data.data;
  },

  /**
   * Đăng nhập lấy JWT Access Token.
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await axiosClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data.data;
  },

  /**
   * Đăng xuất tài khoản và yêu cầu server đưa token vào Redis Blacklist.
   */
  async logout(): Promise<void> {
    try {
      await axiosClient.post<ApiResponse<void>>('/auth/logout');
    } catch {
      // Dù API có lỗi hay không thì phía client vẫn phải xóa token để bảo mật
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_info');
    }
  },

  /**
   * Lấy thông tin cá nhân của người dùng hiện tại qua token.
   */
  async getCurrentUser(): Promise<UserProfile> {
    const response = await axiosClient.get<ApiResponse<UserProfile>>('/auth/me');
    return response.data.data;
  },
};
