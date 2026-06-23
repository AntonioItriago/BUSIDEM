const CACHE_NAME = 'busidem-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalación del Service Worker y almacenamiento en caché básico
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

// Evento FETCH Obligatorio para cumplir con los requisitos de instalación PWA
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});