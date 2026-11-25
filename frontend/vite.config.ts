import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Cấu hình Vite cho ứng dụng React SPA
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Chuyển hướng các request /api sang Backend Spring Boot (cổng 8080) để tránh lỗi CORS khi dev
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
