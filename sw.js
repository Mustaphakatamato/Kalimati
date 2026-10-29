const CACHE = 'kalimati-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Network first for the page and the shared sound file, so new versions arrive;
// the cached copy keeps the app working offline.
function networkFirst(req, key){
  return fetch(req).then(res => {
    if (res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
    return res;
  }).catch(() => caches.match(key, {ignoreSearch:true}));
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin){
    if (req.mode === 'navigate'){ e.respondWith(networkFirst(req, './index.html')); return; }
    if (url.pathname.endsWith('/kalimati-lyd.json')){ e.respondWith(networkFirst(req, url.origin + url.pathname)); return; }
    e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
    return;
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'){
    e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { c.put(req, res.clone()); return res; }))));
  }
});
