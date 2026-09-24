/* © 2026 Fgarcia. Todos los derechos reservados. */
const SCOPE = self.registration.scope;
const PREFIX = 'fg-cartera-' + new URL(SCOPE).pathname + '-';
const CACHE = PREFIX + 'v3';
const CORE = ['./','./index.html','./manifest.webmanifest','./pwa.js','./assets/xlsx.full.min.js','./assets/icon-192.png','./assets/icon-512.png','./assets/icon-maskable-512.png','./LICENSE.txt'];
const appURL = path => new URL(path, SCOPE).href;
const ASSETS = new Set(CORE.map(appURL));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([...ASSETS])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => (key.startsWith(PREFIX) && key !== CACHE)).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(SCOPE)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(async () => {
      const cache = await caches.open(CACHE);
      return await cache.match(event.request) || await cache.match(appURL('./index.html')) || Response.error();
    }));
    return;
  }
  // Never read another app's cache or cache API / user data.
  if (!ASSETS.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Refresh installation metadata instead of retaining an obsolete identity.
    if (url.pathname.endsWith('/manifest.webmanifest')) {
      try {
        const response = await fetch(event.request, {cache: 'no-cache'});
        if (response.ok) await cache.put(event.request, response.clone());
        return response;
      } catch (_) { return await cache.match(event.request) || Response.error(); }
    }
    return await cache.match(event.request) || fetch(event.request);
  })());
});
