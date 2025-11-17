import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: process.env.PORT ? parseInt(process.env.PORT) : 5158,
    strictPort: false,
    proxy: {
      '/api': 'http://localhost:3000'
    },
    // https: ... (if you want to enable SSL)
  }
})
