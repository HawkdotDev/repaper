const CACHE_NAME = 'repaper-cache-v2'
const STATIC_ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/logo.png']

// 1. Installation: Pre-cache core shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Core asset pre-cache error:', err)
      })
    })
  )
  self.skipWaiting()
})

// 2. Activation: Clean old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    )
  )
  self.clients.claim()
})

// 3. Fetch: Stale-While-Revalidate with Navigation Fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Handle SPA navigation requests: network first, fall back to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
          }
          return networkResponse
        })
        .catch(() => {
          return caches.match('/index.html').then((cached) => {
            return cached || caches.match('/')
          })
        })
    )
    return
  }

  // Stale-While-Revalidate for application assets, scripts, stylesheets, and fonts
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            (networkResponse.status === 200 || networkResponse.type === 'opaque')
          ) {
            const isCacheableOrigin =
              url.origin === location.origin ||
              url.origin === 'https://fonts.googleapis.com' ||
              url.origin === 'https://fonts.gstatic.com' ||
              url.href.includes('katex')

            if (isCacheableOrigin) {
              const responseToCache = networkResponse.clone()
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache)
              })
            }
          }
          return networkResponse
        })
        .catch((fetchErr) => {
          // If offline and not in cache, return fallback if available
          return cachedResponse || Promise.reject(fetchErr)
        })

      return cachedResponse || fetchPromise
    })
  )
})

// 4. Background Sync API for queued offline operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-file-operations') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'oink:background-sync-complete',
            timestamp: Date.now()
          })
        })
      })
    )
  }
})
