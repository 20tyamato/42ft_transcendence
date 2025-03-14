import path from 'path';
import { defineConfig } from 'vite';
import fs from 'fs';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    https: {
      key: fs.readFileSync('/app/certs/server.key'),
      cert: fs.readFileSync('/app/certs/server.crt'),
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
    hmr: {
      overlay: true,
      port: 24678,
      clientPort: 24678,
      host: '0.0.0.0',
    },
    port: 3001,
    host: '0.0.0.0',
  },
});
