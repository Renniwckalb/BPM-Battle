const CACHE_NAME = 'bpm-battle-v1.1.8';

// Liste de tous les fichiers de ton jeu
const FILES_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    
    './js/game.js',
    
    // Core
    './js/core/config.js',
    './js/core/engine.js',
    
    // Entities
    './js/entities/grid.js',
    './js/entities/player.js',
    

    // Systems
    './js/system/combat.js',
    './js/system/input.js',
    './js/system/network.js',
    
    // UI
    './js/ui/ui.js',
    './js/ui/lang.js',

    // Librairies externes
    'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js'
];

// INSTALLATION
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Nouveaux fichiers mis en cache');
            return cache.addAll(FILES_TO_CACHE);
        })
    );
});

// ACTIVATION
self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());

    event.waitUntil(
        caches.keys().then((listeDesCaches) => {
            return Promise.all(
                listeDesCaches.map((nomDuCache) => {
                    if (nomDuCache !== CACHE_NAME) {
                        console.log('Ancien cache supprimé :', nomDuCache);
                        return caches.delete(nomDuCache);
                    }
                })
            );
        })
    );
});

// LECTURE
self.addEventListener('fetch', (event) => {
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).catch(() => {
                console.log("Ressource réseau indisponible (mode hors-ligne actif) :", event.request.url);
            });
        })
    );
});