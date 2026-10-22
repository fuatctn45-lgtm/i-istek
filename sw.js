const CACHE_NAME = 'akg-bakim-is-istek-v27';
const urlsToCache = [
  './',
  './index.html',
  './admin.html',
  './dashboard.html',
  './style.css',
  './app.js',
  './admin.js',
  './dashboard.js',
  './AKGLOG.png',
  './icon.svg',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(err => {
        console.warn('SW Precache non-critical item failed:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Sadece HTTP/HTTPS GET isteklerini önbellekle (POST ve Firebase mutasyonları doğrudan ağa gider)
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone).catch(() => {});
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ==========================================================================
// ANDROID BİLDİRİM VE PUSH DESTEĞİ
// ==========================================================================

// Bildirime tıklandığında uygulamayı öne getir
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) 
    ? event.notification.data.url 
    : './index.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Arka plan bildirim alma olayı
self.addEventListener('push', event => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'AKG Bakım Bildirimi', body: event.data.text() };
    }
  }

  const title = data.title || '🚨 AKG Bakım - Yeni Arıza';
  const options = {
    body: data.body || 'Yeni bir bakım talebi bildirildi.',
    icon: './AKGLOG.png',
    badge: './AKGLOG.png',
    vibrate: [300, 100, 300, 100, 300],
    data: { url: data.url || './index.html' },
    renotify: true,
    tag: data.tag || 'akg-push-' + Date.now()
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
