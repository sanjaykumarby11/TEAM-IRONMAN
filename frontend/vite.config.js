import { defineConfig } from 'vite';

export default defineConfig({
  root: './public',
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true
      }
    }
  }
});
