import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@store': path.resolve(__dirname, './src/store'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
  server: {
    port: parseInt(process.env.VITE_DEV_PORT || '5173', 10),
    cors: true,
    proxy: {
      // Browser calls http://localhost:5173/api/* → forwarded to backend
      '/api': {
        target: process.env.VITE_API_PROXY || 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: parseInt(process.env.VITE_DEV_PORT || '5173', 10),
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY || 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'recharts'],
          'vendor-utils': ['axios', '@tanstack/react-query', 'zustand'],
        },
      },
    },
  },
});


