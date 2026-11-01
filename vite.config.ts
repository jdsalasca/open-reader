import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { target: 'es2022' },
  server: {
    port: 5177,
    watch: { ignored: ['**/src-tauri/**', '**/dist/**', '**/public/pdfjs/**'] },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
  },
})
