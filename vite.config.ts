import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function vendorPackage(id: string): string {
  const normalized = id.replace(/\\/g, '/');
  const marker = '/node_modules/';
  const from = normalized.indexOf(marker);
  if (from === -1) return '';
  const spec = normalized.slice(from + marker.length);
  if (spec.startsWith('@')) {
    const [scope, name] = spec.split('/');
    return name ? `${scope}/${name}` : scope;
  }
  return spec.split('/')[0];
}

function vendorChunk(id: string): string | undefined {
  const pkg = vendorPackage(id);
  if (!pkg) return;

  switch (pkg) {
    case 'react':
    case 'react-dom':
    case 'scheduler':
      return 'vendor-react';
    case 'react-router':
    case 'react-router-dom':
    case '@remix-run/router':
      return 'vendor-router';
    case '@tanstack/react-query':
    case '@tanstack/query-core':
      return 'vendor-query';
    case 'framer-motion':
    case 'motion-dom':
    case 'motion-utils':
      return 'vendor-motion';
    case 'react-aria-components':
      return 'vendor-aria';
    case '@dnd-kit/core':
    case '@dnd-kit/sortable':
    case '@dnd-kit/utilities':
      return 'vendor-dnd';
    case 'recharts':
      return 'vendor-charts';
    case 'lucide-react':
      return 'vendor-icons';
    case 'axios':
      return 'vendor-http';
    case 'canvas-confetti':
      return 'vendor-confetti';
    default:
      if (
        pkg.startsWith('@react-aria/') ||
        pkg.startsWith('@react-stately/') ||
        pkg.startsWith('@react-types/') ||
        pkg.startsWith('@internationalized/')
      ) {
        return 'vendor-aria';
      }
  }
}

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
        manualChunks: vendorChunk,
      },
    },
  },
});
