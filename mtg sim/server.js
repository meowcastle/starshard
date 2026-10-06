// sim.starshard.net — tiny API + static UI around Forge's headless simulator.
// No dependencies: Node 20's http + fetch only.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { runSim, forgeVersion } = require('./forge');
const meta = require('./meta');

const PORT = +process.env.PORT || 8088;
const DATA = process.env.DATA_DIR || '/data';
const HOST = process.env.HOST || '127.0.0.1';
// Logins are Star Shard accounts. The sim never sees a password hash: it asks the
// Star Shard API (same NAS, loopback only) to log the user in, keeps the session
// token it gets back in its own cookie, and re-checks it against /api/me, so a
// Star Shard logout or password reset ends the sim session too.
const STARSHARD_API = (process.env.STARSHARD_API || 'http://127.0.0.1:4001').replace(/\/$/, '');
const list = v => (v || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
const ALLOWED = list(process.env.SIM_USERS);   // Star Shard usernames allowed in; "*" = any account
const ADMINS = list(process.env.SIM_ADMINS);
const MAX_GAMES = +process.env.MAX_GAMES || 200;
fs.mkdirSync(path.join(DATA, 'jobs'), { recursive: true });
if (!ALLOWED.length) console.warn('SIM_USERS is empty, so nobody can sign in. Add Star Shard usernames to .env.');

const COOKIE = 'sim_session';
const allowed = u => ALLOWED.includes('*') || ALLOWED.includes(u.toLowerCase());
const tokenOf = req => { const c = (req.headers.cookie || '').match(/(?:^|;\s*)sim_session=([^;]+)/); return c && decodeURIComponent(c[1]); };
const clientIp = req => (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;
const seen = new Map(); // token -> { user, at }
async function currentUser(req) {
  const token = tokenOf(req); if (!token) return null;
  const hit = seen.get(token);
  if (hit && Date.now() - hit.at < 60e3) return hit.user;
  const r = await fetch(STARSHARD_API + '/api/me', { headers: { Cookie: `starshard_session=${token}` } });
  if (!r.ok) { seen.delete(token); return null; }
  const me = await r.json();
  const user = me.username && allowed(me.username) ? { name: me.username, isAdmin: ADMINS.includes(me.username.toLowerCase()) } : null;
  seen.set(token, { user, at: Date.now() });
  if (seen.size > 500) seen.delete(seen.keys().next().value);
  return user;
}

// ---------- jobs ----------
const HIST = path.join(DATA, 'history.json');
let history = []; try { history = JSON.parse(fs.readFileSync(HIST, 'utf8')); } catch {}
const saveHist = () => fs.writeFileSync(HIST, JSON.stringify(history.slice(0, 200)));
const jobs = new Map(); const queue = []; let running = null;

function publicJob(j) {
  const { child, log, ...rest } = j;
  return { ...rest, logTail: (log || []).slice(-40) };
}
function enqueue(spec) {
  const id = crypto.randomBytes(5).toString('hex');
  const job = { id, status: 'queued', created: Date.now(), ...spec, log: [], results: null };
  jobs.set(id, job); queue.push(job); pump();
  return job;
}
async function pump() {
  if (running || !queue.length) return;
  const job = running = queue.shift();
  job.status = 'running'; job.started = Date.now();
  // A gauntlet is a series of pairings; a matchup is one.
  const pairings = job.mode === 'gauntlet' ? job.decks.slice(1).map(o => [job.decks[0], o]) : [job.decks];
  job.pairings = pairings.map(p => ({ names: p.map(d => d.name), wins: p.map(() => 0), draws: 0, games: [], status: 'queued' }));
  for (let i = 0; i < pairings.length && job.status !== 'cancelled'; i++) {
    const pr = job.pairings[i]; pr.status = 'running';
    const run = runSim({
      decks: pairings[i], games: job.games, format: job.format, clock: job.clock,
      workDir: path.join(DATA, 'jobs', job.id, String(i)),
      onLine: l => { job.log.push(l); if (job.log.length > 2000) job.log.shift(); },
    });
    job.child = run.child;
    // live view: share the parser's arrays
    pr.wins = run.results.wins; pr.games = run.results.games; pr.names = run.results.names; pr.warnings = run.results.warnings;
    const { code, results } = await run.done;
    pr.draws = results.draws; pr.status = code === 0 || results.games.length ? 'done' : 'failed'; pr.exit = code;
  }
  delete job.child;
  if (job.status !== 'cancelled') job.status = job.pairings.every(p => p.status === 'failed') ? 'failed' : 'done';
  job.finished = Date.now();
  history.unshift({ id: job.id, owner: job.owner, mode: job.mode, format: job.format, games: job.games, created: job.created, finished: job.finished, status: job.status,
    pairings: job.pairings.map(({ names, wins, draws, games }) => ({ names, wins, draws, played: games.length, avgMs: games.length ? Math.round(games.reduce((s, g) => s + g.ms, 0) / games.length) : 0 })),
    decks: job.decks });
  saveHist();
  running = null;
  setTimeout(() => jobs.delete(job.id), 6 * 3600e3);
  pump();
}

// ---------- http ----------
const send = (res, code, body, headers = {}) => {
  const isStr = typeof body === 'string' || Buffer.isBuffer(body);
  res.writeHead(code, { 'Content-Type': isStr ? 'text/plain; charset=utf-8' : 'application/json', 'Cache-Control': 'no-store', ...headers });
  res.end(isStr ? body : JSON.stringify(body));
};
const readBody = req => new Promise((ok, bad) => {
  let b = ''; req.on('data', d => { b += d; if (b.length > 2e6) { bad(new Error('too large')); req.destroy(); } });
  req.on('end', () => { try { ok(b ? JSON.parse(b) : {}); } catch (e) { bad(e); } });
});
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };
function serveStatic(req, res, p) {
  const file = path.join(__dirname, 'public', p === '/' ? 'index.html' : path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
  if (!file.startsWith(path.join(__dirname, 'public'))) return send(res, 403, 'no');
  fs.readFile(file, (err, buf) => err ? send(res, 404, 'not found') : send(res, 200, buf, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }));
}

function validDeck(d) {
  if (!d || !Array.isArray(d.main)) return false;
  const ok = c => c && typeof c.name === 'string' && c.name.length < 150 && Number.isInteger(c.qty) && c.qty > 0 && c.qty < 100;
  return d.main.every(ok) && (d.side || []).every(ok) && (d.commander || []).every(ok) && d.main.length > 0;
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const p = u.pathname;
  try {
    if (p === '/api/login' && req.method === 'POST') {
      const { username, password } = await readBody(req);
      if (typeof username !== 'string' || typeof password !== 'string' || !username.trim()) return send(res, 400, { error: 'enter your Star Shard username and password' });
      const id = username.trim();
      const r = await fetch(STARSHARD_API + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': clientIp(req) },
        body: JSON.stringify(id.includes('@') ? { email: id, password } : { username: id, password }),
      });
      if (r.status === 429) return send(res, 429, { error: 'too many tries, wait 15 minutes' });
      if (!r.ok) return send(res, 401, { error: 'wrong username or password' });
      const me = await r.json();
      const token = (r.headers.getSetCookie?.() || []).map(c => c.match(/^starshard_session=([^;]+)/)).find(Boolean)?.[1];
      if (!token) return send(res, 502, { error: 'Star Shard login did not return a session' });
      if (!allowed(me.username)) return send(res, 403, { error: `@${me.username} isn't on the simulator list yet. Ask Justin to add you.` });
      seen.delete(token);
      return send(res, 200, { ok: true, user: me.username }, { 'Set-Cookie': `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 86400}` });
    }
    if (p === '/api/logout') { seen.delete(tokenOf(req)); return send(res, 200, { ok: true }, { 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0` }); }
    if (p === '/api/health') return send(res, 200, { ok: true, forge: forgeVersion() });
    if (!p.startsWith('/api/')) return serveStatic(req, res, p);
    const user = await currentUser(req);
    if (!user) return send(res, 401, { error: 'login required' });

    if (p === '/api/me') return send(res, 200, { ok: true, user, forge: forgeVersion(), maxGames: MAX_GAMES, goldfish: meta.GOLDFISH_FORMATS, top8: Object.keys(meta.TOP8_FORMATS) });

    // meta
    if (p === '/api/meta') {
      const src = u.searchParams.get('source'), fmt = u.searchParams.get('format');
      const list = src === 'goldfish' ? await meta.goldfishMeta(fmt) : src === 'top8' ? await meta.top8Meta(fmt) : src === 'edhrec' ? await meta.edhrecMeta() : null;
      return list ? send(res, 200, { decks: list }) : send(res, 400, { error: 'unknown source' });
    }
    if (p === '/api/meta/deck') {
      const src = u.searchParams.get('source'), id = u.searchParams.get('id');
      const deck = src === 'goldfish' ? await meta.goldfishDeck(id) : src === 'top8' ? await meta.top8Deck(id) : src === 'edhrec' ? await meta.edhrecDeck(id) : null;
      return deck ? send(res, 200, deck) : send(res, 400, { error: 'unknown source' });
    }
    if (p === '/api/import') return send(res, 200, await meta.importUrl(u.searchParams.get('url')));
    if (p === '/api/parse' && req.method === 'POST') { const { text } = await readBody(req); return send(res, 200, meta.parseList(String(text || ''))); }

    // jobs
    if (p === '/api/sim' && req.method === 'POST') {
      const b = await readBody(req);
      const mode = b.mode === 'gauntlet' ? 'gauntlet' : 'matchup';
      const decks = (b.decks || []).slice(0, mode === 'gauntlet' ? 13 : 4);
      if (decks.length < 2 || !decks.every(validDeck)) return send(res, 400, { error: 'need at least two valid decks' });
      decks.forEach((d, i) => { d.name = String(d.name || `Deck ${i + 1}`).slice(0, 60); });
      const games = Math.max(1, Math.min(MAX_GAMES, +b.games || 10));
      const format = ['Constructed', 'Commander', 'Brawl', 'Oathbreaker', 'TinyLeaders'].includes(b.format) ? b.format : 'Constructed';
      const clock = Math.max(30, Math.min(900, +b.clock || 180));
      const job = enqueue({ mode, decks, games, format, clock, owner: user.name });
      return send(res, 200, { id: job.id });
    }
    let m;
    if ((m = p.match(/^\/api\/jobs\/(\w+)$/))) {
      const j = jobs.get(m[1]);
      if (req.method === 'DELETE') {
        if (j && j.owner !== user.name && !user.isAdmin) return send(res, 403, { error: 'only the owner can cancel this run' });
        if (j) { j.status = 'cancelled'; const qi = queue.indexOf(j); if (qi >= 0) queue.splice(qi, 1); j.child?.kill('SIGKILL'); }
        return send(res, 200, { ok: true });
      }
      if (j) return send(res, 200, { ...publicJob(j), queuePos: queue.indexOf(j) });
      const h = history.find(x => x.id === m[1]);
      return h ? send(res, 200, { ...h, fromHistory: true }) : send(res, 404, { error: 'no such job' });
    }
    if ((m = p.match(/^\/api\/jobs\/(\w+)\/log$/))) { const j = jobs.get(m[1]); return send(res, 200, (j?.log || []).join('\n')); }
    if (p === '/api/jobs') return send(res, 200, { running: running && publicJob(running), queued: queue.map(publicJob), history: history.slice(0, 50).map(({ decks, ...h }) => h) });
    return send(res, 404, { error: 'not found' });
  } catch (e) {
    console.error(p, e.message);
    return send(res, 502, { error: e.message });
  }
});
server.listen(PORT, HOST, () => console.log(`sim listening on ${HOST}:${PORT} (forge ${forgeVersion()}), accounts via ${STARSHARD_API}`));
