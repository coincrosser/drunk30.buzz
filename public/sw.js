const CACHE_NAME = 'drunk30-studio-v1';
const urlsToCache = [
  '/',
  '/studio',
  '/join',
  '/episodes',
  '/links',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Skip API calls - always fetch from network
  if (event.request.url.includes('/api/')) {
    return event.respondWith(
      fetch(event.request)
        .catch(() => new Response(JSON.stringify({error: 'Offline'}), {status: 503}))
    );
  }

  // Cache-first strategy for pages and assets
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .then(response => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => cache.put(event.request, responseToCache));
        return response;
      })
      .catch(() => caches.match('/studio'))
  );
});

// Handle background sync for uploaded videos
self.addEventListener('sync', event => {
  if (event.tag === 'sync-recordings') {
    event.waitUntil(
      fetch('/api/sync/recordings', {method: 'POST'})
        .then(r => r.json())
    );
  }
});
