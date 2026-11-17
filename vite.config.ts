import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // The API runs separately in development (npm run dev starts both).
    proxy: { '/api': 'http://localhost:8787' },
  },
});
