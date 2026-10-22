// sw.js: the offline helper ("service worker").
// RULE: every time you change ANY file, change the number below (v1 -> v2 -> v3).
// That tells phones to throw away the old saved copy and fetch the new one.
const CACHE = "oau-navigator-v12";

const CORE = [
  "./", "index.html", "style.css", "route.js", "app.js", "manifest.webmanifest",
  "data/places.json", "data/paths.json", "data/emergency.json", "data/lessons.json", "collect.html",
  "icons/icon-192.png", "icons/icon-512.png",
  "vendor/leaflet.js", "vendor/leaflet.css", "vendor/fonts.css", "vendor/icons.js", "category-icons.js"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
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

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
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
