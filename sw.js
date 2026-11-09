// Bewaart het kaartje op de telefoon, zodat het ook zonder internet opent.
const CACHE = 'kaartje-v35';
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
  const pad = new URL(r.url).pathname;
  const pagina = r.mode === 'navigate' && (pad.endsWith('/') || pad.endsWith('.html'));
  // Safari weigert in een beginscherm-app een antwoord met een doorverwijzing: maak er een schoon antwoord van
  const schoon = res => res.redirected ? res.blob().then(b => new Response(b, { status: res.status, statusText: res.statusText, headers: res.headers })) : res;
  const bewaar = (sleutel, res) => { if (res.ok) { const k = res.clone(); caches.open(CACHE).then(c => c.put(sleutel, k)); } return res; };
  if (pagina) {
    // eigen pagina: eerst internet (altijd de nieuwste versie), anders de bewaarde kopie, nooit een leeg antwoord
    e.respondWith(fetch(new URL('./', self.registration.scope).href, { cache: 'no-store' }).then(schoon).then(res => bewaar('./', res))
      .catch(() => caches.match('./', { ignoreSearch: true }))
      .then(res => res || new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="font-family:sans-serif;padding:30px;color:#00448a"><h2>Even geen internet</h2><p>Open het kaartje opnieuw zodra je verbinding hebt.</p><p><a href="./">Opnieuw proberen</a></p>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } })));
    return;
  }
  e.respondWith(fetch(r, { cache: 'no-cache' }).then(schoon).then(res => bewaar(r, res))
    .catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || fetch(r))));
});
