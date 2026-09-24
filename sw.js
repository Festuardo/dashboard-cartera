/* © 2026 Fgarcia. Todos los derechos reservados. */
const PREFIX='fg-cartera-'+new URL(self.registration.scope).pathname+'-';
const CACHE=PREFIX+'v2';
const CORE=['./','./index.html','./manifest.webmanifest','./pwa.js','./assets/xlsx.full.min.js','./assets/icon-192.png','./assets/icon-512.png','./assets/icon-maskable-512.png','./LICENSE.txt'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 if(event.request.mode==='navigate'){
 event.respondWith(fetch(event.request).then(response=>{if(!response.ok)throw new Error('No disponible');const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put('./index.html',copy)));return response}).catch(()=>caches.match('./index.html')));return;
 }
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
