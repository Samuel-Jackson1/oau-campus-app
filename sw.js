// sw.js: the offline helper ("service worker").
// RULE: every time you change ANY file, change the number below (v1 -> v2 -> v3).
// That tells phones to throw away the old saved copy and fetch the new one. (Pages, code and data are also checked
// online first on every open, so updates show up quickly; photos are only refreshed when this number changes.)
const CACHE = "oau-navigator-v21";

const CORE = [
  "./", "index.html", "style.css", "route.js", "app.js", "manifest.webmanifest",
  "data/places.json", "data/paths.json", "data/emergency.json", "data/lessons.json", "collect.html",
  "icons/icon-192.png", "icons/icon-512.png",
  "vendor/leaflet.js", "vendor/leaflet.css", "vendor/fonts.css", "vendor/icons.js", "category-icons.js", "icons/oau-crest.webp"
];

// GitHub Pages lets browsers keep files for 10 minutes, so every download here says "reload" / "no-cache":
// otherwise the browser would quietly hand back the OLD file and phones would stay on the old version.
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, {cache: "reload"})))));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// iPhones ask for audio in slices ("Range" requests). This answers them from the saved copy.
async function fromCache(req) {
  const hit = await caches.match(req);
  if (!hit) return null;
  const range = req.headers.get("range");
  if (!range) return hit;
  const buf = await hit.arrayBuffer();
  const m = /bytes=(\d+)-(\d*)/.exec(range);
  const start = Number(m[1]);
  const end = m[2] ? Number(m[2]) : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": hit.headers.get("Content-Type") || "audio/mpeg",
      "Content-Range": "bytes " + start + "-" + end + "/" + buf.byteLength,
      "Content-Length": String(end - start + 1)
    }
  });
}

// Pages, code and data: try the internet first, so everyone sees the newest version (and the newest Collector form)
// as soon as they open the app online. If there is no internet, or it takes more than 3 seconds, use the saved copy.
const FRESH_FIRST = /(\/|\.html|\.js|\.css|\.json|\.webmanifest)$/;
async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const fresh = req.mode === "navigate" ? fetch(req.url, {cache: "no-cache", credentials: "same-origin"}) : fetch(req, {cache: "no-cache"});
    const res = await Promise.race([fresh, new Promise((_, no) => setTimeout(() => no(new Error("slow")), 3000))]);
    if (res.status === 200) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await caches.match(req, {ignoreSearch: req.mode === "navigate"});
    if (hit) return hit;
    throw err;
  }
}

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  if (e.request.mode === "navigate" || FRESH_FIRST.test(url.pathname)) { e.respondWith(networkFirst(e.request)); return; }
  // Photos, icons, fonts and audio rarely change: saved copy first, internet only if it is missing.
  e.respondWith((async () => {
    const cached = await fromCache(e.request);
    if (cached) return cached;
    const res = await fetch(e.request);
    if (res.status === 200) {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
    }
    return res;
  })());
});
