const CACHE_NAME = "tamil-app-v999";

const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./Story-01.mp3",
  "./Story-02.mp3",
  "./Story-03.mp3",
  "./Story-04.mp3",
  "./Story-05.mp3",
  "./Story-06.mp3",
  "./Story-07.mp3",
  "./Story-08.mp3",
  "./Story-09.mp3",
  "./Story-10.mp3",
  "./Story-11.mp3",
  "./Story-12.mp3",
  "./Story-13.mp3",
  "./Story-14.mp3",
  "./Story-15.mp3"
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
