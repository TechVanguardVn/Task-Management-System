import axios, { AxiosError } from 'axios';
import { ApiResponse } from '../../types/api.types';

/**
 * Khởi tạo Axios Client tập trung cho toàn bộ ứng dụng.
 * Tự động gắn token xác thực vào Header và xử lý bắt lỗi tập trung.
 */
export const axiosClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Request Interceptor: Tự động trích xuất JWT Token từ localStorage và gắn vào Authorization Header.
 */
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor: Tự động bóc tách ApiResponse và bắt mã lỗi 401 Unauthorized để chuyển hướng đăng nhập.
 */
axiosClient.interceptors.response.use(
  (response) => {
    // Trả về trực tiếp response object để tầng service lấy data
    return response;
  },
  (error: AxiosError<ApiResponse<null>>) => {
    if (error.response?.status === 401) {
      // Khi token hết hạn hoặc không hợp lệ: Xóa token rác khỏi bộ nhớ
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_info');
      
      // Nếu không ở màn hình đăng nhập thì điều hướng về /login
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);
