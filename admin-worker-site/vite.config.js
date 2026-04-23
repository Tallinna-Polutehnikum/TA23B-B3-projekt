import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [react()],
    server: {
      host: 'localhost',
      port: 5156,
      proxy: {
        '/api': 'http://localhost:4000',
        '/uploads': 'http://localhost:4000'
      }
    }
  }
})
