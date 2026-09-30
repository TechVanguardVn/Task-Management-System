// src/api/axiosClient.ts
import axios, { AxiosError } from 'axios';

const axiosClient = axios.create({
  // Để baseURL là domain gốc của Backend (ví dụ: http://localhost:8000)
  // để tiện gọi cả /sanctum/csrf-cookie và các route /api/...
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true, // BẮT BUỘC: Cho phép gửi Cookie qua lại giữa FE và BE
  withXSRFToken: true,   // BẮT BUỘC (Axios 1.6+): Tự đọc cookie XSRF-TOKEN gắn vào header X-XSRF-TOKEN
});

// Response Interceptor: Trả về trực tiếp response.data và bắt lỗi xác thực
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error: AxiosError) => {
    // Khi session hết hạn hoặc chưa đăng nhập, backend trả về 401
    if (error.response?.status === 401) {
      // Tuỳ chọn: chuyển hướng về trang login nếu cần
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;