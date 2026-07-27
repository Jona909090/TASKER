const CACHE = 'tasker-v38'
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './style-v38.css?build=38',
  './main-v38.js?build=38',
  './materials.js',
  './icon-192.svg',
  './icon-512.svg',
  './profile-stefan.svg'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.all(CORE.map((url) => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) caches.open(CACHE).then((cache) => cache.put('./index.html', response.clone()))
          return response
        })
        .catch(() => caches.match('./index.html'))
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) =>
      fetch(request)
        .then((response) => {
          if (response.ok && new URL(request.url).origin === self.location.origin) {
            caches.open(CACHE).then((cache) => cache.put(request, response.clone()))
          }
          return response
        })
        .catch(() => cached || Response.error())
    )
  )
})
