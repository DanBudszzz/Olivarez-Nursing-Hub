// A simple service worker for caching main assets for offline use.
const CACHE_NAME = 'nursing-hub-cache-v3'; // Bumped cache version
const urlsToCache = [
  './',
  'index.html',
  'library.html',
  'practicequiz.html',
  'transes.html',
  'manifest.json',
  'logo.png',
  'startup.mp4',
  'books.json',
  'cover.jpg',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css'
];

// Function to fetch and update the cache.
const updateCache = async () => {
    console.log('[Service Worker] Updating cache...');
    try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(urlsToCache);
        console.log('[Service Worker] Cache updated successfully.');
        return true;
    } catch (error) {
        console.error('[Service Worker] Failed to update cache:', error);
        return false;
    }
};


self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      // If the request is in the cache, return it. Otherwise, fetch from the network.
      return response || fetch(e.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Periodic Background Sync listener: Keeps content fresh.
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'content-update') {
    console.log('[Service Worker] Firing Periodic Sync for content-update.');
    event.waitUntil(updateCache());
  }
});

// Background Sync listener: For deferred actions until connectivity is restored.
self.addEventListener('sync', (event) => {
  if (event.tag === 'data-sync-request') {
    console.log('[Service Worker] Firing Background Sync for data-sync-request.');
    event.waitUntil(updateCache());
  }
});
