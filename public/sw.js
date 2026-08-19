/*
 * Chrome will not treat a site as installable without a service worker
 * that handles fetch, so this exists to satisfy that and nothing else.
 *
 * It deliberately does not cache. Sell1 reads live data on every screen,
 * and a cache here would serve a salesperson a stale pipeline, which is
 * worse than a slow one. Offline support, if it is ever wanted, is a
 * deliberate piece of work rather than a side effect of this file.
 */
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Straight to the network. No respondWith, no interception.
});
