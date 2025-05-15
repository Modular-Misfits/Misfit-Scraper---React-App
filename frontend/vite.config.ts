import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    port: parseInt(process.env.VITE_PORT || '5173', 10), // Use VITE_PORT or default to 5173
    host: '0.0.0.0', // Allow external connections
  },
});