import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, 'src/panel'),
  base: './',
  build: {
    outDir: resolve(__dirname, 'dist/panel'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        panel: resolve(__dirname, 'src/panel/index.html'),
      },
    },
  },
})
