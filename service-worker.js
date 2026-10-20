// Önbellek adı sürümlü: dosyalar değişince bu numarayı artır
const CACHE_ADI = 'cozum-defteri-v12';

// Çevrimdışı çalışması için önbelleğe alınacak dosyalar
const ONBELLEK_DOSYALAR = [
  './',
  './index.html',
  './style.css',
  './js/app.js',
  './js/db.js',
  './js/arama.js',
  './js/yedek.js',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  'https://cdn.jsdelivr.net/npm/dexie@4.0.8/dist/dexie.min.js',
  'https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js'
];

// INSTALL: Hemen aktif olmasını sağla
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_ADI)
      .then(cache => cache.addAll(ONBELLEK_DOSYALAR))
      .catch(err => console.warn('[SW] Cache hatasi:', err))
  );
});

// ACTIVATE: Eski tüm cache'leri anında sil ve sayfaları kontrolüne al
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(anahtarlar =>
      Promise.all(
        anahtarlar
          .filter(a => a !== CACHE_ADI)
          .map(a => caches.delete(a))
      )
    ).then(() => self.clients.claim())
  );
});

// FETCH: Network-First (Önce Ağdan Yeni Sürümü Al, İnternet Yoksa Önbellekten Al)
self.addEventListener('fetch', event => {
  // Sadece GET isteklerini işle
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(agYanit => {
        if (agYanit && agYanit.status === 200) {
          const kopya = agYanit.clone();
          caches.open(CACHE_ADI).then(cache => {
            cache.put(event.request, kopya);
          });
        }
        return agYanit;
      })
      .catch(() => {
        // İnternet yoksa önbellekten sun
        return caches.match(event.request).then(onbellek => {
          if (onbellek) return onbellek;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
