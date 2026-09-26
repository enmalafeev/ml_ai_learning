/* Service worker: кэш приложения для работы офлайн.
   При изменении файлов приложения поднимай CACHE_VERSION — иначе браузер отдаст старую копию. */

const CACHE_VERSION = 'ml-journey-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/data-phase0.js',
  './js/data-phase0-math.js',
  './js/data-phase0-math2.js',
  './js/data-skeleton.js',
  './js/curriculum.js',
  './js/store.js',
  './js/progress.js',
  './js/sync.js',
  './js/views.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(function (cache) { return cache.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE_VERSION; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Внешние ссылки (материалы курсов, статьи) не кэшируем и не перехватываем
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (cached) {
      const network = fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        // офлайн: если в кэше ничего нет, отдаём оболочку приложения
        return cached || caches.match('./index.html');
      });
      return cached || network;
    })
  );
});
