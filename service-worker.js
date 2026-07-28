const CACHE_NAME = 'bpm-battle-v1';

// Liste de tous les fichiers de ton jeu à sauvegarder sur le téléphone
const FILES_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './game.js',
    './grid.js',
    './player.js',
    './manifest.json'
];

// Installation : on met les fichiers en cache
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Fichiers mis en cache avec succès');
            return cache.addAll(FILES_TO_CACHE);
        })
    );
});

// Lecture : on sert les fichiers depuis le cache si on est hors ligne
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});