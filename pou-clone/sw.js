/* Pou Clone — Service Worker: pełny offline po pierwszym wczytaniu */
const CACHE = 'pou-clone-v1';
const ASSETS = [
  './', 'index.html', 'styles.css', 'manifest.json', 'icon.svg',
  'js/data.js', 'js/audio.js', 'js/state.js', 'js/pou.js',
  'js/minigames.js', 'js/ui.js', 'js/main.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request))
  );
});
