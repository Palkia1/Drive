// Minimal offline app-shell cache. Bump CACHE_NAME on a future deploy if the
// caching strategy itself changes and old cached responses need dropping —
// this doesn't auto-invalidate on every build the way a bundler-integrated
// service worker (Workbox/next-pwa) would.
const CACHE_NAME = "rijklaar-shell-v1";

// Static, rarely-changing assets worth serving straight from cache once
// they've been fetched once. API routes are deliberately never matched here
// (see the fetch handler) — those need fresh data or the app's own
// online/offline queue (src/lib/offlineQueue.ts), not blind SW caching.
const ASSET_PATTERNS = [/^\/_next\/static\//, /^\/icon-/, /^\/manifest\.json$/, /^\/scenes\//, /^\/signs\//, /^\/tiles\//, /\.(?:png|jpg|jpeg|svg|woff2?)$/];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isCacheableAsset(url) {
  return ASSET_PATTERNS.some((re) => re.test(url.pathname));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // POST/etc. always go straight to the network untouched

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Page navigations: network-first (always show live content when
  // online), falling back to whatever was last cached for that exact URL,
  // and finally to the app shell itself so opening the app fully offline
  // still shows *something* instead of the browser's own error page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/app")))
    );
    return;
  }

  if (isCacheableAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return res;
        });
      })
    );
  }
});
