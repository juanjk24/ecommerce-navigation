import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// La SPA corre en 5173 y proxifica /api hacia la API Express en 5050, de modo
// que el navegador no enfrenta un problema de origen cruzado en la demostracion.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5050',
        changeOrigin: true,
      },
    },
  },
});
