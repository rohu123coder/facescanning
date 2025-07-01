
const CACHE_NAME = 'karma-manager-cache-v2'; // Increment version on change
const urlsToCache = [
  '/',
  '/login',
  '/employee-login',
  '/parent-login',
  '/offline.html'
];

// On install, cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        const offlineFallback = new Response(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Offline</title>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 40px; }
              h1 { color: #333; }
            </style>
          </head>
          <body>
            <h1>You are offline</h1>
            <p>Please check your internet connection to use Karma Manager.</p>
          </body>
          </html>
        `, { headers: { 'Content-Type': 'text/html' }});
        
        return cache.put('/offline.html', offlineFallback)
          .then(() => cache.addAll(urlsToCache.filter(url => url !== '/offline.html')));
      })
  );
});

// On fetch, serve from cache if available
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch from network
        return fetch(event.request).catch(() => {
          // If network fails and it's a navigation request, return the offline fallback page
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// On activate, clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
