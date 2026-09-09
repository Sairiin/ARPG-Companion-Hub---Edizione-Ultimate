// Service Worker base per attivare il prompt di installazione App
self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
    // Non fa nulla, serve solo per superare il check PWA di Chrome
});