const CACHE_NAME = "together-shell-v3";
const APP_SHELL = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/firebase-config.js",
  "/firebase-service.js",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-maskable.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
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

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isNavigationRequest = event.request.mode === "navigate";
  const isAppShellAsset =
    isSameOrigin &&
    [".html", ".js", ".css", ".webmanifest", ".svg"].some((ext) =>
      requestUrl.pathname.endsWith(ext)
    );

  if (isNavigationRequest || isAppShellAsset) {
    event.respondWith(networkFirstAppShell(event.request, isNavigationRequest));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});

async function networkFirstAppShell(request, isNavigationRequest) {
  try {
    const response = await fetch(request, { cache: "no-store" });

    if (shouldCache(response)) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    if (isNavigationRequest) {
      return caches.match("/index.html");
    }

    return caches.match("/index.html");
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (shouldCache(response)) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }

  return response;
}

function shouldCache(response) {
  return Boolean(response && response.ok && response.type === "basic");
}
