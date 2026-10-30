import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { scanEnginePlugin } from './server/vitePlugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), scanEnginePlugin()],
  server: {
    port: 3000,
    host: true
  }
});
