const CACHE_NAME = "shepherdroute-v2";
const STATIC_ASSETS = [
  "/login",
  "/manifest.webmanifest",
  "/shepherd-logo.svg",
  "/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png"
];
const CACHEABLE_DESTINATIONS = new Set(["style", "script", "image", "font"]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/shepherd-logo.svg" ||
    url.pathname === "/icon.svg" ||
    url.pathname.startsWith("/icons/") ||
    CACHEABLE_DESTINATIONS.has(event.request.destination);

  if (!isStaticAsset) {
    return;
  }

  if (url.pathname.startsWith("/_next/static/") && event.request.cache === "only-if-cached" && event.request.mode !== "same-origin") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }

        return response;
      }).catch(() => {
        return caches.match("/login");
      });
    })
  );
});
