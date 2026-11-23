import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Dev: chuyển tiếp /api sang backend để không phải cấu hình CORS
      '/api': process.env.VITE_API_PROXY ?? 'http://localhost:4000',
    },
  },
});
