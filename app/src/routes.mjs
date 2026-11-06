// The route table for the Star Shard shell. Plain JavaScript, no React, so build.mjs
// (Node) and the browser bundle read the same list. One entry per URL the shell owns.
//
// Fields: path (the URL), key (a stable id for data-route), label (what the nav shows,
// lowercase, the words a visitor reads), title (the <title>), description (meta and the
// page's one line), nav (true if it appears in the desktop header), tab (true if it is one
// of the five phone tabs), glyph (which icon the shell draws: see shell.jsx), external
// (true for a page the shell links to as a full navigation rather than rendering itself: the
// legal pages and the game at /play/).
//
// Vocabulary (WRITING.md, COSMOLOGY.md section 2): the 28 are stations; chart, shard and
// codex are the only coined words a visitor meets here, and the game's own name is "play".

export const SITE = 'star shard';

export const ROUTES = [
  { path: '/', key: 'home', label: 'home', title: 'star shard', description: 'the sky tonight, and the sky you were born under.', nav: true, tab: false, glyph: 'home' },
  { path: '/tonight', key: 'tonight', label: 'tonight', title: 'tonight', description: "the moon's station tonight, its degree, the planets and the next crossing.", nav: true, tab: true, glyph: 'moon' },
  { path: '/chart', key: 'chart', label: 'your chart', title: 'your chart', description: 'the wheel drawn to scale from your birth minute: houses, aspects, the planets, the 28 stations.', nav: true, tab: true, glyph: 'sun' },
  { path: '/shard', key: 'shard', label: 'your shard', title: 'your shard', description: 'the reading of your chart, kept as a document you return to.', nav: true, tab: true, glyph: 'shard' },
  { path: '/shard/start', key: 'firstrun', label: 'the arrival', title: 'your shard', description: 'the sky at the minute you were born, read for the first time.', nav: false, tab: false, glyph: 'shard' },
  { path: '/codex', key: 'codex', label: 'codex', title: 'codex', description: 'the 28 stations of the moon, one page each.', nav: true, tab: true, glyph: 'codex' },
  { path: '/station/:slug', key: 'station', label: 'station', title: 'station', description: 'one station of the moon: the four skies, who is born under it, when the moon crosses it, what the books say.', nav: false, tab: false, glyph: 'codex' },
  // /play/ is the game itself (the September Manzil file, copied into dist/play/ by build.mjs with
  // its own assets): a full navigation out of the shell and back, the same origin, the same
  // session cookie, the same api.js. No shell chrome over the stage (STARSHARD-LAUNCH.md 2.5).
  { path: '/play/', key: 'play', label: 'play', title: 'play', description: 'the card game played against tonight’s sky.', nav: true, tab: true, glyph: 'cards', external: true },
  { path: '/account', key: 'account', label: 'account', title: 'account', description: 'your charts, your data, your password.', nav: false, tab: false, glyph: 'account' },
  { path: '/signin', key: 'signin', label: 'sign in', title: 'sign in', description: 'sign in to star shard.', nav: false, tab: false },
  { path: '/signup', key: 'signup', label: 'sign up', title: 'sign up', description: 'keep your chart and your shard.', nav: false, tab: false },
  { path: '/reset', key: 'reset', label: 'reset password', title: 'reset your password', description: 'choose a new password.', nav: false, tab: false },
  { path: '/verify', key: 'verify', label: 'verify email', title: 'email confirmed', description: 'your email address is confirmed.', nav: false, tab: false },
  // privacy/ and terms/ are the static pages SS3 wrote; the build copies them into dist/
  // and the shell links to them as full pages. They are not rendered by the bundle.
  { path: '/privacy/', key: 'privacy', label: 'privacy', title: 'privacy', description: 'what star shard keeps and why.', nav: false, tab: false, external: true },
  { path: '/terms/', key: 'terms', label: 'terms', title: 'terms', description: 'the terms of use.', nav: false, tab: false, external: true },
];

// Match a pathname to a route. Returns { route, params } or null. Trailing slashes are
// ignored except on the root; '/station/the-gate' yields params.slug = 'the-gate'.
export function matchRoute(pathname) {
  let p = pathname || '/';
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  for (const route of ROUTES) {
    if (route.external) continue;
    const rp = route.path.endsWith('/') && route.path.length > 1 ? route.path.slice(0, -1) : route.path;
    if (!rp.includes(':')) {
      if (rp === p) return { route, params: {} };
      continue;
    }
    const a = rp.split('/');
    const b = p.split('/');
    if (a.length !== b.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < a.length; i++) {
      if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i]);
      else if (a[i] !== b[i]) { ok = false; break; }
    }
    if (ok) return { route, params };
  }
  return null;
}

// The routes that get a static index.html of their own in dist/ (so any static host
// serves the shell without rewrite rules). Station pages are added per slug by build.mjs.
export const STATIC_ROUTES = ROUTES.filter(r => !r.external && !r.path.includes(':'));
