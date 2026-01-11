import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Thêm phần này để hỗ trợ chạy tốt trên mobile qua HTTPS
  server: {
    host: true
  }
})
