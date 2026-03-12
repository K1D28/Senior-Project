import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        historyApiFallback: true,
        proxy: {
          '/api': {
            target: env.VITE_BACKEND_URL || 'http://localhost:5001',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, '/api'),
          },
        },
      },
      plugins: [react()],
      preview: {
        port: 4173,
        host: '0.0.0.0',
      },
      build: {
        outDir: 'dist',
        sourcemap: false,
        minify: 'terser',
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'https://backend-production-b273.up.railway.app'),
        'process.env.VITE_BACKEND_URL': JSON.stringify(env.VITE_BACKEND_URL || 'https://backend-production-b273.up.railway.app'),
        'process.env': {},
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
