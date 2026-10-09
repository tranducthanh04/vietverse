import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Node 25+ ships a global localStorage that shadows jsdom's; turn it off so tests use jsdom storage.
    // Guarded because Node 20 (CI) rejects the flag.
    poolOptions: {
      forks: {
        execArgv: Number(process.versions.node.split('.')[0]) >= 22 ? ['--no-experimental-webstorage'] : [],
      },
    },
  },
});
