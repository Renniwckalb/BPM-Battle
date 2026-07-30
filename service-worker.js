const CACHE_NAME = 'bpm-battle-v1.1.4';

// Liste de tous les fichiers de ton jeu
const FILES_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './game.js',
    './grid.js',
    './player.js',
    './manifest.json'
];

// 1. INSTALLATION : on met les nouveaux fichiers en cache
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Nouveaux fichiers mis en cache');
            return cache.addAll(FILES_TO_CACHE);
        })
    );
});

// 2. ACTIVATION : on supprime les ANCIENNES versions du cache (C'est la partie qui manquait !)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((listeDesCaches) => {
            return Promise.all(
                listeDesCaches.map((nomDuCache) => {
                    // Si le cache ne correspond pas au nom actuel, on le supprime
                    if (nomDuCache !== CACHE_NAME) {
                        console.log('Ancien cache supprimé :', nomDuCache);
                        return caches.delete(nomDuCache);
                    }
                })
            );
        })
    );
});

// 3. LECTURE : on sert les fichiers
self.addEventListener('fetch', (event) => {
    // On ignore les requêtes qui ne sont pas standard (ex: extensions Chrome)
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        caches.match(event.request).then((response) => {
            // On retourne le cache s'il existe. 
            // Sinon, on tente de télécharger sur le réseau, et on "attrape" (catch) l'erreur silencieusement si on est hors ligne.
            return response || fetch(event.request).catch(() => {
                console.log("Ressource réseau indisponible (mode hors-ligne actif) :", event.request.url);
            });
        })
    );
});