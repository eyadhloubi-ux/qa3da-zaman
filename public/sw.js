// قعدة زمان — service worker
const V = 'zaman-v2';
const CORE = ['/', '/style.css', '/app.js', '/games.js', '/manifest.webmanifest', '/icon-192.png', '/fonts/fonts.css', '/fonts/marhey-arabic-600-normal.woff2', '/fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2', '/fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/qr/') || u.pathname.startsWith('/stats') || u.pathname.startsWith('/admin')) return;
  // الشبكة أولاً، والكاش إذا انقطع النت
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(V).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('/'))));
});
