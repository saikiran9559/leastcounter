// Scorely service worker — stale-while-revalidate.
// Bump CACHE_VERSION whenever you want clients to drop their old cache.

const CACHE_VERSION = "scorely-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.addAll([
        "./",
        "./index.html",
        "./styles.css",
        "./app.js",
        "./engine.js",
        "./engine-grid.js",
        "./engine-counter.js",
        "./engine-ledger.js",
        "./engine-tennis.js",
        "./engine-bowling.js",
        "./engine-darts-cricket.js",
        "./games-rules.js",
        "./icon.svg",
        "./manifest.json",
      ]).catch(() => {})
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Skip non-GET (e.g. analytics beacons, future API calls).
  if (request.method !== "GET") return;

  // For HTML navigations, prefer fresh content but fall back to cache offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  // Stale-while-revalidate for everything else.
  event.respondWith(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.match(request).then((cached) => {
        const fetched = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              cache.put(request, response.clone()).catch(() => {});
            }
            return response;
          })
          .catch(() => cached);
        return cached || fetched;
      })
    )
  );
});
