const CACHE='glossary-v2-2';
self.addEventListener('install', e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./index.html','./app.css','./app.js','./manifest.webmanifest','./icon-192.png','./icon-512.png']))); self.skipWaiting();});
self.addEventListener('activate', e=>{e.waitUntil((async()=>{const ks=await caches.keys(); await Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))); await self.clients.claim();})());});
self.addEventListener('fetch', e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});
