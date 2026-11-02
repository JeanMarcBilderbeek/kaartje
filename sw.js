// Bewaart het kaartje op de telefoon, zodat het ook zonder internet opent.
const CACHE = 'kaartje-v20';
const BASIS = ['./', './jean-marc-bilderbeek.vcf', './manifest.webmanifest', './icoon-180.png', './icoon-192.png', './icoon-512.png', './kvn-de-kracht-van-verwondering.jpg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASIS))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const lettertype = r.url.includes('fonts.googleapis.com') || r.url.includes('fonts.gstatic.com');
  if (lettertype) {  // lettertypes: eerst uit de bewaarde kopie
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { const k = res.clone(); caches.open(CACHE).then(c => c.put(r, k)); return res; })));
    return;
  }
  if (new URL(r.url).origin !== location.origin) return;
  // eigen pagina: eerst internet (dan zie je altijd de nieuwste versie), anders de bewaarde kopie
  e.respondWith(fetch(r).then(res => { const k = res.clone(); caches.open(CACHE).then(c => c.put(r.mode === 'navigate' ? './' : r, k)); return res; })
    .catch(() => caches.match(r.mode === 'navigate' ? './' : r, { ignoreSearch: true })));
});
