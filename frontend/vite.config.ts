import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    watch: {
      usePolling: true,
      interval: 100,
    },
    hmr: {
      overlay: true,
      port: 24678,
      clientPort: 24678,
      host: '0.0.0.0',
      protocol: 'ws',
    },
    port: 3001,
    host: '0.0.0.0',
    cors: true,
  },
  optimizeDeps: {
    include: ['gsap'],
  },
  publicDir: 'public', // public ディレクトリを Vite でサーバーに公開
});
