import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward /api requests to the backend so the frontend can call it without CORS issues
      '/api': 'http://localhost:3000',
    },
  },
})