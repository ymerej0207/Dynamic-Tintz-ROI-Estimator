const CACHE="dt-roi-v7-full";
const ASSETS=["./","./index.html","./app.js","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png","https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"];
self.addEventListener("install",(e)=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener("activate",(e)=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener("fetch",(e)=>{
  const req=e.request;
  if(req.mode==="navigate"){e.respondWith(fetch(req).catch(()=>caches.match("./index.html")));return;}
  e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res;}).catch(()=>caches.match("./index.html"))));
});