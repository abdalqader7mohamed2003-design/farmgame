const CACHE = 'farm-v1';
const ASSETS = [
  './', './index.html', './style.css', './manifest.json',
  './data.js', './systems.js', './ui.js', './main.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
    if (resp.ok) caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
    return resp;
  })));
});
