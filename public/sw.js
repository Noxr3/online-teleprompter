// Bump the version whenever an app-shell file changes. An update waits until
// existing tabs close, so a running stage keeps one consistent set of files.
const PREFIX = `online-teleprompter-shell:${self.registration.scope}:`;
const CACHE = `${PREFIX}v1`;
const SHELL = [
  './', './zh/', './icon.svg', './manifest.webmanifest',
  './src/app.js', './src/follow.js', './src/format.js', './src/i18n.js',
  './src/icons.js', './src/stage.js', './src/store.js', './src/styles.css', './src/voice.js'
].map(path => new URL(path, self.registration.scope).href);
const ALLOWED = new Set(SHELL);

self.addEventListener('install', event => {
  // Only these public files are written to Cache Storage, never request bodies,
  // arbitrary URLs or the user's script (which stays in localStorage).
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(
    SHELL.map(url => new Request(url, { cache: 'reload', credentials: 'omit', mode: 'same-origin' }))
  )));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Explicit index URLs use the same offline document as their directory URL.
  if (url.pathname.endsWith('/index.html')) url.pathname = url.pathname.slice(0, -10);
  if (!ALLOWED.has(url.href)) return;
  event.respondWith(caches.match(url.href, { cacheName: CACHE }).then(
    cached => cached || fetch(request)
  ));
});
