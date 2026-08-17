importScripts("/proxy/baremux-worker.js");
importScripts("/uv/uv.bundle.js");
importScripts("/uv/uv.config.js");
importScripts(__uv$config.sw || "/uv/uv.sw.js");
importScripts("/proxy/scramjet/scramjet.all.js");

const uv = new UVServiceWorker();
let scramjet = null;

try {
  if (typeof $scramjetLoadWorker === "function") {
    const { ScramjetServiceWorker } = $scramjetLoadWorker();
    if (ScramjetServiceWorker) {
      scramjet = new ScramjetServiceWorker();
    }
  }
} catch (e) {
  console.warn("Failed initializing Scramjet Service Worker:", e);
}

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      // 1. Ultraviolet routing
      if (uv.route(event)) {
        return await uv.fetch(event);
      }

      // 2. Scramjet v2 routing
      if (scramjet) {
        try {
          if (typeof scramjet.loadConfig === "function") {
            await scramjet.loadConfig();
          }
          if (typeof scramjet.route === "function" && scramjet.route(event)) {
            return await scramjet.fetch(event);
          }
        } catch {
          /* proceed to fallback */
        }
      }

      return await fetch(event.request);
    })(),
  );
});
