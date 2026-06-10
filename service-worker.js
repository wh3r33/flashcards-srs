const CACHE_NAME = "studyos-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/login.html",
  "/register.html",
  "/dashboard.html",
  "/decks.html",
  "/deck.html",
  "/training.html",
  "/profile.html",
  "/public.html",
  "/offline.html",
  "/css/styles.css",
  "/js/main.js",
  "/js/config.js",
  "/js/supabaseClient.js",
  "/js/utils.js",
  "/js/layout.js",
  "/js/auth.js",
  "/js/decks.js",
  "/js/cards.js",
  "/js/reviews.js",
  "/js/srs.js",
  "/js/ai.js",
  "/js/csv.js",
  "/js/charts.js",
  "/manifest.json",
  "/assets/icons/icon-192.svg",
  "/assets/icons/icon-512.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => {
      if (event.request.mode === "navigate") return caches.match("/offline.html");
      return cached;
    }))
  );
});
