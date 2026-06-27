/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  envPrefix: ['VITE_', 'REACT_APP_'],
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-maskable.png'],
      manifest: {
        name: 'حاسبة الميزانية متزن',
        short_name: 'متزن',
        description: 'تطبيق متزن لحساب الميزانية وإدارة المعاملات المالية بكل سهولة.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
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
    rolldownOptions: {
    },
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
