// This is the "Offline page" service worker

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const CACHE = "pwabuilder-page";

// TODO: replace the following with the correct offline fallback page i.e.: const offlineFallbackPage = "offline.html";
const offlineFallbackPage = "offline.html";

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener('install', async (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.add(offlineFallbackPage)).catch((err) => {
        console.log(err)
      })
  );
});

if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preloadResp = await event.preloadResponse;

        if (preloadResp) {
          return preloadResp;
        }

        const networkResp = await fetch(event.request);
        return networkResp;
      } catch (error) {

        const cache = await caches.open(CACHE);
        const cachedResp = await cache.match(offlineFallbackPage);
        return cachedResp;
      }
    })());
  }
});

// console.log('service worker')
// self.addEventListener("install", function(event) {
//   event.waitUntil(preLoad());
// });

// var preLoad = function(){
//   console.log("Installing web app");
//   return caches.open("offline").then(function(cache) {
//     console.log("caching index and important routes");
//     return cache.addAll(['offline.html']);
//   });
// };

// self.addEventListener("fetch", function(event) {
//   event.respondWith(checkResponse(event.request).catch(function() {
//     return returnFromCache(event.request);
//   }));
//   event.waitUntil(addToCache(event.request));
// });

// var checkResponse = function(request){
//   return new Promise(function(fulfill, reject) {
//     fetch(request).then(function(response){
//       if(response.status !== 404) {
//         fulfill(response);
//       } else {
//         reject();
//       }
//     }, reject);
//   });
// };