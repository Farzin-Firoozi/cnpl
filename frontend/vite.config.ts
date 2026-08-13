/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      exclude: [
        'src/api/functions/**',
        'src/api/models/**',
        'src/api/config/**',
        'src/test/**',
        'src/vite-env.d.ts',
        'src/main.tsx',
        '**/*.config.*',
        '**/*.test.*',
        'dist/**',
      ],
    },
  },
})
