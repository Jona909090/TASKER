const CACHE = 'tasker-v65'
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './style-v51.css?build=51',
  './drive-endpoint-v52.js?build=65',
  './receipt-ledger-v57.js?build=65',
  './pdf-window-v59.js?build=65',
  './password-3d-v60.js?build=65',
  './about-author-v61.js?build=65',
  './about-polish-v62.js?build=65',
  './about-fix-v63.js?build=65',
  './about-exact-v64.js?build=65',
  './about-image-v65.js?build=65',
  './tasker-about-v65.jpg',
  './main-v51.js?build=65',
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
