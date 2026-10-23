import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
const scope = 'https://example.test/prompter/';
const prefix = `online-teleprompter-shell:${scope}:`;

function worker({ cached, installError, keys = [] } = {}) {
  const handlers = new Map();
  const writes = [];
  const deleted = [];
  const fetched = [];
  let claimed = false;
  vm.runInNewContext(source, {
    URL, Request,
    self: {
      registration: { scope },
      addEventListener: (type, handler) => handlers.set(type, handler),
      clients: { claim: async () => { claimed = true; } }
    },
    caches: {
      open: async name => ({ addAll: async requests => {
        if (installError) throw installError;
        writes.push({ name, requests });
      } }),
      match: async (url, options) => {
        assert.equal(options.cacheName, `${prefix}v1`);
        return cached?.get(url);
      },
      keys: async () => keys,
      delete: async name => { deleted.push(name); return true; }
    },
    fetch: async request => { fetched.push(request.url); return new Response('network'); }
  });
  function dispatch(type, request) {
    let result;
    handlers.get(type)({ request, waitUntil: promise => { result = promise; }, respondWith: promise => { result = promise; } });
    return result;
  }
  return { dispatch, writes, deleted, fetched, claimed: () => claimed };
}

test('installation caches only the public app shell, without credentials', async () => {
  const w = worker();
  await w.dispatch('install');
  assert.equal(w.writes.length, 1);
  const { name, requests } = w.writes[0];
  assert.equal(name, `${prefix}v1`);
  const modules = (await readdir(new URL('../public/src/', import.meta.url))).filter(file => file.endsWith('.js'));
  const expected = ['', 'zh/', 'icon.svg', 'manifest.webmanifest', 'src/styles.css', ...modules.map(file => `src/${file}`)];
  assert.deepEqual(Array.from(requests, request => request.url).sort(), expected.map(path => new URL(path, scope).href).sort());
  for (const request of requests) {
    assert.equal(request.method, 'GET');
    assert.equal(request.credentials, 'omit');
    assert.equal(request.mode, 'same-origin');
    assert.equal(request.cache, 'reload');
  }
});

test('a cached app page reopens without a network fetch, including index aliases', async () => {
  for (const path of ['', 'index.html', 'zh/', 'zh/index.html']) {
    const canonical = path.startsWith('zh/') ? 'zh/' : '';
    const w = worker({ cached: new Map([[new URL(canonical, scope).href, new Response('shell')]]) });
    const response = await w.dispatch('fetch', new Request(new URL(path, scope)));
    assert.equal(await response.text(), 'shell');
    assert.equal(w.fetched.length, 0);
    assert.equal(w.writes.length, 0);
  }
});

test('a missing shell entry falls back to the network without caching its response', async () => {
  const w = worker();
  const response = await w.dispatch('fetch', new Request(`${scope}src/app.js`));
  assert.equal(await response.text(), 'network');
  assert.deepEqual(w.fetched, [`${scope}src/app.js`]);
  assert.equal(w.writes.length, 0);
});

test('arbitrary URLs, query strings, other origins and non-GET requests are not intercepted', () => {
  const w = worker();
  const requests = [
    new Request(`${scope}private-script`),
    new Request(`${scope}?script=synthetic`),
    new Request(`${scope}src/app.js?content=synthetic`),
    new Request('https://other.example/src/app.js'),
    new Request('https://example.test/other/'),
    new Request(scope, { method: 'POST', body: 'synthetic script' })
  ];
  for (const request of requests) assert.equal(w.dispatch('fetch', request), undefined);
  assert.equal(w.writes.length, 0);
  assert.equal(w.fetched.length, 0);
});

test('activation removes only this scope\'s old shell caches', async () => {
  const w = worker({ keys: [`${prefix}v0`, `${prefix}v1`, 'unrelated-cache', 'online-teleprompter-shell:https://example.test/other/:v0'] });
  await w.dispatch('activate');
  assert.deepEqual(w.deleted, [`${prefix}v0`]);
  assert.equal(w.claimed(), true);
});

test('an incomplete installation rejects instead of claiming offline readiness', async () => {
  const failure = new Error('missing shell asset');
  const w = worker({ installError: failure });
  await assert.rejects(w.dispatch('install'), error => error === failure);
  assert.equal(w.claimed(), false);
  assert.equal(w.deleted.length, 0);
});
