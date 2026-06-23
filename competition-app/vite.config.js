import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/competition/',
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    outDir: '../competition',
    emptyOutDir: true
  },
  server: {
    host: true,
    strictPort: false,
    hmr: {
      protocol: 'ws',
    }
  }
})
