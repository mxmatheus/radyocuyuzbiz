const CACHE_NAME = 'sonicatlas-v1';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './vite.svg'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    // Simple cache-first strategy for static assets, network-first for others
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
