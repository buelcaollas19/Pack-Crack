const CACHE = "cds-app-v1";
const CORE = ["./", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("cds-app-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;
  const scope = new URL(self.registration.scope);
  const rel = u.pathname.slice(scope.pathname.length);
  const nav = r.mode === "navigate";
  const isCore = nav || rel === "" || rel === "index.html" || rel === "manifest.webmanifest" || rel.startsWith("icons/");
  if (!isCore) return;
  const key = nav || rel === "index.html" ? "./" : r;
  e.respondWith(
    fetch(r, nav ? undefined : { cache: "no-cache" }).then(res => {
      if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(key, cp)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(key).then(m => m || caches.match("./")).then(m => m || Response.error()))
  );
});
