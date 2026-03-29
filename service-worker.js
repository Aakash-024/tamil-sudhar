const CACHE_NAME = "tamil-app-v2";

const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./Story 1.mp3",
  "./Story 2.mp3",
  "./Story 3.mp3",
  "./Story 4.mp3",
  "./Story 5.mp3",
  "./Story 6.mp3",
  "./Story 7.mp3",
  "./Story 8.mp3",
  "./Story 9.mp3",
  "./Story 10.mp3",
  "./Story 11.mp3",
  "./Story 12.mp3",
  "./Story 13.mp3",
  "./Story 14.mp3",
  "./Story 15.mp3"
];

// Install
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
