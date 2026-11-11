import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function worker(proxy = 'https://proxy.example.com/api/apod') {
  const handlers = {};
  const stores = new Map();
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async addAll(urls) { for (const url of urls) store.set(url, new Response(`shell:${url}`)); },
        async match(request) { return store.get(typeof request === 'string' ? request : request.url)?.clone(); },
        async put(request, response) { store.set(request.url, response); },
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
  };
  let fetcher = async () => new Response('network');
  const self = {
    registration: { scope: 'https://example.com/app/' },
    __PRECACHE_MANIFEST__: ['https://example.com/app/', 'https://example.com/app/assets/app.js'],
    __APOD_PROXY_URL__: proxy,
    __CACHE_VERSION__: 'test',
    addEventListener(type, handler) { handlers[type] = handler; },
    async skipWaiting() {},
    clients: { async claim() {} },
  };
  vm.runInNewContext(await readFile(new URL('./service-worker.js', import.meta.url), 'utf8'), { self, caches, URL, fetch: (...args) => fetcher(...args) });
  return {
    handlers,
    setFetch(value) { fetcher = value; },
    async install() { let pending; handlers.install({ waitUntil(value) { pending = value; } }); await pending; },
    async request(url, mode = 'cors') { let pending; handlers.fetch({ request: { url, mode, method: 'GET' }, respondWith(value) { pending = value; } }); return pending; },
  };
}

test('pre-cached shell is served without a network request', async () => {
  const subject = await worker();
  await subject.install();
  subject.setFetch(() => { throw new Error('offline'); });
  assert.equal(await (await subject.request('https://example.com/app/', 'navigate')).text(), 'shell:https://example.com/app/');
  assert.equal(await (await subject.request('https://example.com/app/assets/app.js')).text(), 'shell:https://example.com/app/assets/app.js');
});

test('NASA and configured proxy responses use network first and fall back to their own cached request', async () => {
  const subject = await worker();
  for (const url of ['https://api.nasa.gov/planetary/apod?start_date=2024-01-01', 'https://proxy.example.com/api/apod?start_date=2024-01-01']) {
    subject.setFetch(async () => new Response('first'));
    assert.equal(await (await subject.request(url)).text(), 'first');
    subject.setFetch(async () => new Response('latest'));
    assert.equal(await (await subject.request(url)).text(), 'latest');
    subject.setFetch(async () => { throw new Error('offline'); });
    assert.equal(await (await subject.request(url)).text(), 'latest');
    await assert.rejects(subject.request(`${url}&end_date=2024-01-02`), /offline/);
  }
});

test('relative proxy paths use the origin, matching the APOD client', async () => {
  const subject = await worker('/api/apod');
  const url = 'https://example.com/api/apod?start_date=2024-01-01';
  subject.setFetch(async () => new Response('cached proxy data'));
  assert.equal(await (await subject.request(url)).text(), 'cached proxy data');
  subject.setFetch(async () => { throw new Error('offline'); });
  assert.equal(await (await subject.request(url)).text(), 'cached proxy data');
});