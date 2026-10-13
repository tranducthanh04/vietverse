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
  build: {
    rollupOptions: {
      output: {
        // Vendor code changes rarely: separate chunks stay cached (immutable /assets) across app deploys.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          // Libraries used only by lazily loaded pages stay with those pages.
          if (/node_modules[\\/](canvas-confetti|idb-keyval)[\\/]/.test(id)) return undefined;
          if (/node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
          return 'vendor';
        },
      },
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
