
  import { defineConfig, loadEnv } from 'vite';
  import react from '@vitejs/plugin-react';
  import tailwindcss from '@tailwindcss/vite';
  import path from 'path';

  export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const proxyTarget = env.VITE_LOCAL_PROXY_TARGET || 'http://localhost:8080';
    const isProd = mode === 'production';

    return {
      plugins: [react(), tailwindcss()],
      esbuild: {
        drop: isProd ? ['console', 'debugger'] : [],
      },
      resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        alias: {
          '@': path.resolve(__dirname, './src'),
        },
      },
      build: {
        target: 'esnext',
        outDir: 'build',
        chunkSizeWarningLimit: 600,
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (!id.includes('node_modules')) return;
              if (id.includes('recharts') || id.includes('/d3-') || id.includes('/d3/')) {
                return 'vendor-recharts';
              }
              if (id.includes('xlsx')) {
                return 'vendor-xlsx';
              }
            },
          },
        },
      },
      server: {
        port: Number(env.PORT) || 3000,
        open: true,
        proxy: {
          '/api': {
            target: proxyTarget,
            changeOrigin: true,
            secure: false,
          },
          '/uploads': {
            target: 'https://www.winnticket.store',
            changeOrigin: true,
            secure: false,
          },
        },
      },
    };
  });
