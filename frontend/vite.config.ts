import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../backend/src/lib'),
    },
  },
  server: {
    host: '0.0.0.0', // Allow access from other devices on the network
    port: 5173,
    proxy: {
      '/api': {
        // Target the backend origin — the /api prefix is preserved, so
        // /api/v1/auth/login → http://localhost:8000/api/v1/auth/login
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
