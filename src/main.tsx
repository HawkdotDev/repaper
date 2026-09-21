import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { webFileSystem } from './services/webFileSystem'
import { webWindow } from './services/webWindow'

// Ensure window.api is initialized with real persistent web storage and window controls
if (!window.api || !window.api.fs || !window.api.window) {
  window.api = {
    fs: webFileSystem,
    window: webWindow
  }
}

// Pre-initialize storage and seed starter notes before rendering
void webFileSystem.init().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )

  // Register Service Worker for offline PWA capabilities
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('ServiceWorker registration failed: ', err)
      })
    })
  }
})
