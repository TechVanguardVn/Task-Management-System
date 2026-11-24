import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { validateApiBaseUrl } from './src/api/config.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  validateApiBaseUrl(env.VITE_API_BASE_URL)

  return {
    plugins: [react(), tailwindcss()],
    server: { port: 5173, strictPort: true },
  }
})
