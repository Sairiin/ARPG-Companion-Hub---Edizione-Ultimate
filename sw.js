// Versione della cache: incrementala quando cambi asset importanti
const CACHE_NAME = 'arpg-hub-v1';

// Asset da precaricare (core dell'app)
const PRECACHE_ASSETS = [
  '/index.html',
  '/css/style.css',
  '/js/main.js',
  '/manifest.webmanifest'
];

// Install: precarica asset core
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: rimuovi cache vecchie
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: strategia "cache first" per HTML/CSS/JS, "network first" per JSON e dati
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Per JSON in /assets/ o altri dati: network first, fallback cache
  if (url.pathname.startsWith('/assets/') && url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Per HTML, CSS, JS: cache first, fallback network
  event.respondWith(
    caches.match(request)
      .then((cached) => {
        if (cached) return cached;
        return fetch(request);
      })
  );
});