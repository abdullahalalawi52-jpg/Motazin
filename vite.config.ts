import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['clsx', 'tailwind-merge', 'sonner'],
          charts: ['recharts'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          pdf: ['pdfjs-dist', 'html2canvas', 'jspdf'],
          excel: ['xlsx', 'mammoth']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
})
