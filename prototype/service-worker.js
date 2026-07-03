const CACHE_NAME = "together-shell-v3";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./firebase-config.js",
  "./firebase-service.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-maskable.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isAppShellRequest =
    isSameOrigin &&
    [".html", ".js", ".css", ".webmanifest", ".svg"].some((ext) =>
      requestUrl.pathname.endsWith(ext)
    );

  if (!isSameOrigin) {
    return;
  }

  event.respondWith(
    isAppShellRequest
      ? fetch(event.request)
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            return response;
          })
          .catch(() =>
            caches
              .match(event.request)
              .then((cached) => cached || caches.match("./index.html"))
          )
      : caches.match(event.request).then((cached) => {
          if (cached) {
            return cached;
          }

          return fetch(event.request)
            .then((response) => {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
              return response;
            })
            .catch(() => caches.match("./index.html"));
        })
  );
});
