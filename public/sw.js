// A basic, no-op service worker.
// This is just to prevent 404 errors for the service worker registration.

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
});

self.addEventListener('fetch', (event) => {
  // We are not intercepting fetch requests in this basic setup.
});
