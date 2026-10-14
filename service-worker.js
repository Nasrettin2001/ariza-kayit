// Önbellek adı sürümlü: dosyalar değişince bu numarayı artır
const CACHE_ADI = 'cozum-defteri-v6';

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
  // CDN kütüphaneleri de önbelleğe al (çevrimdışı çalışsın)
  'https://cdn.jsdelivr.net/npm/@picocss/pico@2.0.6/css/pico.min.css',
  'https://cdn.jsdelivr.net/npm/dexie@4.0.8/dist/dexie.min.js',
  'https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js'
];

// INSTALL: Service worker ilk kurulduğunda dosyaları önbelleğe al
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_ADI)
      .then(cache => {
        console.log('[SW] Dosyalar önbelleğe alınıyor...');
        return cache.addAll(ONBELLEK_DOSYALAR);
      })
      .then(() => self.skipWaiting())
      .catch(hata => {
        console.warn('[SW] Önbelleğe alma sırasında hata (CDN erişilememiş olabilir):', hata);
      })
  );
});

// ACTIVATE: Eski önbellekleri temizle
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(anahtarlar =>
      Promise.all(
        anahtarlar
          .filter(a => a !== CACHE_ADI)
          .map(a => {
            console.log('[SW] Eski önbellek siliniyor:', a);
            return caches.delete(a);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// FETCH: Önce önbellekten bak, yoksa ağdan al
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(onbellekYanit => {
        if (onbellekYanit) {
          return onbellekYanit;
        }
        return fetch(event.request).then(agYanit => {
          // Başarılı ağ yanıtlarını da önbelleğe ekle (dinamik önbellekleme)
          if (agYanit && agYanit.status === 200) {
            const yanitKopyasi = agYanit.clone();
            caches.open(CACHE_ADI).then(cache => {
              cache.put(event.request, yanitKopyasi);
            });
          }
          return agYanit;
        });
      })
      .catch(() => {
        // Hem önbellek hem ağ başarısızsa çevrimdışı sayfayı göster
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
  );
});
