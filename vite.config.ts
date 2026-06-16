/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  envPrefix: 'REACT_APP_',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    exclude: ['node_modules', 'dist', 'tests'],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'vendor';
            if (id.includes('firebase')) return 'firebase';
            if (id.includes('pdfjs-dist') || id.includes('html2canvas') || id.includes('jspdf')) return 'pdf';
            if (id.includes('xlsx') || id.includes('mammoth')) return 'excel';
            if (id.includes('recharts')) return 'charts';
            if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('sonner')) return 'utils';
          }
        }
      }
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
} as any)
