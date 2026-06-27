import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { LanguageProvider } from './i18n.tsx'
import { ThemeProvider } from './ThemeContext.tsx'
import ErrorBoundary from './ErrorBoundary.tsx'
import { registerSW } from 'virtual:pwa-register'
import { BrowserRouter } from 'react-router-dom'

registerSW({
  onNeedRefresh() {},
  onOfflineReady() {
    console.log('App is ready to work offline.')
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <LanguageProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </LanguageProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
