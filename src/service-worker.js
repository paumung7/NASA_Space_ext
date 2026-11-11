const cacheVersion = self.__CACHE_VERSION__ || 'development';
const shellCache = `space-explorer-shell-${cacheVersion}`;
const apiCache = 'space-explorer-api-v1';
const scopeUrl = new URL(self.registration.scope);
const proxyUrl = self.__APOD_PROXY_URL__ ? new URL(self.__APOD_PROXY_URL__, scopeUrl.origin) : null;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(shellCache).then((cache) => cache.addAll(self.__PRECACHE_MANIFEST__)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('space-explorer-shell-') && key !== shellCache).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const isNasaApi = url.origin === 'https://api.nasa.gov' && url.pathname === '/planetary/apod';
  const isProxy = proxyUrl && url.origin === proxyUrl.origin && url.pathname === proxyUrl.pathname;

  if (isNasaApi || isProxy) {
    event.respondWith((async () => {
      const cache = await caches.open(apiCache);
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone()).catch(() => {});
        else if (response.status >= 500) return (await cache.match(request)) || response;
        return response;
      } catch (error) {
        const cached = await cache.match(request);
        if (cached) return cached;
        throw error;
      }
    })());
    return;
  }

  if (url.origin !== scopeUrl.origin || !url.pathname.startsWith(scopeUrl.pathname)) return;
  if (request.mode !== 'navigate' && !/\.(?:js|css|png|svg|ico|webmanifest|json)$/i.test(url.pathname)) return;

  event.respondWith((async () => {
    const cache = await caches.open(shellCache);
    const cached = await cache.match(request.mode === 'navigate' ? scopeUrl.href : request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && request.mode !== 'navigate') await cache.put(request, response.clone()).catch(() => {});
    return response;
  })());
});