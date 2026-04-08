import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 
  const env = loadEnv(mode, process.cwd(), '');
  
  // API URL 
  // - : https://api.winnticket.store
  // - : https://api.winnticket.co.kr
  const apiBaseUrl = env.VITE_API_BASE_URL || (mode === 'production' ? 'https://api.winnticket.co.kr' : 'https://api.winnticket.store');
  
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router'],
            'ui-vendor': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-popover',
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
            ],
          },
        },
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false, // HTTP 
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
            });
          },
        },
      },
    },
  };
});