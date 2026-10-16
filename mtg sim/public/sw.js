// Forge Sim's service worker (Design's change 18, NOTE-TO-CODE-16OCT-PHONE.md §3): the app's shell and the last
// decks and guides for reading with no signal (a store basement), a queue for matches logged offline, and push.
// Network first everywhere, so a deploy reaches the phone on the next load; the cache is only the fallback.
const SHELL = 'forge-shell-v1', DATA = 'forge-data-v1', QUEUE = 'forge-queue';
const SHELL_FILES = ['/', '/index.html', '/support.js', '/manifest.webmanifest', '/icon-192.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });

// ---- the offline queue for logged matches (IndexedDB: one store of { url, body }) ----
const db = () => new Promise((ok, no) => { const r = indexedDB.open(QUEUE, 1); r.onupgradeneeded = () => r.result.createObjectStore('q', { autoIncrement: true }); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
const tx = (mode, fn) => db().then(d => new Promise((ok, no) => { const t = d.transaction('q', mode), s = t.objectStore('q'), out = fn(s); t.oncomplete = () => ok(out && out.result !== undefined ? out.result : out); t.onerror = () => no(t.error); }));
async function replay() {
  const d = await db(), items = await new Promise(ok => { const out = []; const c = d.transaction('q').objectStore('q').openCursor(); c.onsuccess = () => { const x = c.result; if (!x) return ok(out); out.push({ key: x.key, ...x.value }); x.continue(); }; });
  for (const it of items) {
    try { const r = await fetch(it.url, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: it.body }); if (r.ok || r.status === 400 || r.status === 404) await tx('readwrite', s => s.delete(it.key)); }
    catch { return; } // still offline
  }
}
self.addEventListener('sync', e => { if (e.tag === 'forge-real') e.waitUntil(replay()); });
self.addEventListener('message', e => { if (e.data === 'online') replay(); });

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url); if (u.origin !== location.origin) return;
  // a logged match: stamped with its own id (the server files an id once), sent, or queued when there is no signal
  if (e.request.method === 'POST' && /^\/api\/brews\/\w+\/real$/.test(u.pathname)) {
    e.respondWith((async () => {
      let body = await e.request.clone().text();
      try { const j = JSON.parse(body); if (!j.id) { j.id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); body = JSON.stringify(j); } } catch {}
      try { return await fetch(e.request.url, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body }); }
      catch {
        await tx('readwrite', s => s.add({ url: e.request.url, body }));
        try { await self.registration.sync.register('forge-real'); } catch {}
        return new Response(JSON.stringify({ queued: true, note: 'Saved on this phone; it sends when you are back online.' }), { status: 202, headers: { 'Content-Type': 'application/json' } });
      }
    })());
    return;
  }
  if (e.request.method !== 'GET') return;
  // the brews and up to three guides: network first, the last good copy offline
  const data = u.pathname === '/api/brews' || /^\/api\/brews\/\w+\/guide$/.test(u.pathname);
  if (!data && u.pathname.startsWith('/api/')) return;
  e.respondWith((async () => {
    const cache = await caches.open(data ? DATA : SHELL);
    try {
      const r = await fetch(e.request);
      if (r.ok) {
        await cache.put(e.request, r.clone());
        if (data && u.pathname.endsWith('/guide')) { const keys = (await cache.keys()).filter(k => k.url.includes('/guide')); for (const k of keys.slice(0, Math.max(0, keys.length - 3))) await cache.delete(k); }
      }
      return r;
    } catch { return (await cache.match(e.request)) || (u.pathname === '/' ? cache.match('/index.html') : Response.error()); }
  })());
});

// ---- push: { title, body, url } from the server; a tap opens the deck link ----
self.addEventListener('push', e => {
  let m = {}; try { m = e.data ? e.data.json() : {}; } catch { m = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(m.title || 'Forge Sim', { body: m.body || '', icon: '/icon-192.png', badge: '/icon-192.png', data: { url: m.url || '/' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || '/', location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => { const w = ws.find(x => x.url.startsWith(location.origin)); return w ? w.navigate(url).then(x => (x || w).focus()) : self.clients.openWindow(url); }));
});
