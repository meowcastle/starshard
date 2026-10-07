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

// ---------- brews ----------
// A brew is one deck someone is working on. Each pasted list is a version; every
// run is filed under the version it played, with the field it faced frozen beside
// it. Results themselves live on the job (live) or in history (finished).
const BREWS = path.join(DATA, 'brews.json');
let brews = []; try { brews = JSON.parse(fs.readFileSync(BREWS, 'utf8')); } catch {}
const saveBrews = () => fs.writeFileSync(BREWS, JSON.stringify(brews));
// A run that was still reading decklists when the process stopped will never finish.
brews.forEach(b => b.runs.forEach(r => { if (r.status === 'preparing') { r.status = 'failed'; r.error = 'the server restarted before this run was queued'; } }));
const GAMES = 20;            // per pairing; the UI says "20 games each"
const LOAD_SECONDS = 30;     // Forge reads its card database once per pairing
const latest = b => b.versions[b.versions.length - 1];

function secondsPerGame(pod) {
  const ms = history.filter(h => (h.format === 'Commander') === pod).flatMap(h => h.pairings || []).filter(p => p.avgMs).slice(0, 50).map(p => p.avgMs);
  return ms.length ? ms.reduce((a, b) => a + b, 0) / ms.length / 1000 : pod ? 41 : 14;
}
const fmtTime = s => s < 3600 ? `~${Math.max(1, Math.round(s / 60))} min` : `~${(s / 3600).toFixed(1)} h`;
const teamFor = b => brews.filter(o => o.owner !== b.owner && o.format === b.format).slice(0, b.seats === 4 ? 3 : 12);

// The opponent sets the run picker offers for this brew.
function oppSets(b) {
  const pod = b.seats === 4, per = LOAD_SECONDS + GAMES * secondsPerGame(pod), team = teamFor(b);
  const teamSet = { id: 'team', title: `My pod · ${team.length} team deck${team.length === 1 ? '' : 's'}`, detail: team.length ? team.map(o => `${o.owner}'s ${o.name}`).join(', ') + '.' : `No other member has a ${b.format} brew yet.`, time: team.length ? fmtTime(per) : '', available: team.length > 0, n: team.length };
  if (pod) return [{ id: 'meta20', title: 'The field · top 3 commanders', detail: 'EDHREC, this week. Average decks, one pod.', time: fmtTime(per), available: true, n: 3 }, teamSet];
  if (!meta.GOLDFISH_FORMATS.includes(b.format)) return [{ id: 'meta20', title: 'The field', detail: `No metagame source for ${b.format}.`, time: '', available: false, n: 0 }, teamSet];
  return [
    { id: 'meta20', title: 'The field · top 20', detail: `MTGGoldfish ${b.format}, read when you queue. Weighted by meta share.`, time: fmtTime(20 * per), available: true, n: 20 },
    { id: 'meta10', title: 'The field · top 10', detail: 'Same source, the decks you will actually face.', time: fmtTime(10 * per), available: true, n: 10 },
    teamSet,
  ];
}

async function mapLimit(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; try { out[k] = await fn(items[k]); } catch (e) { out[k] = { error: e.message }; } } }));
  return out;
}
// Resolve an opponent set to real decklists, then queue the job. Runs after the
// request has answered, because 20 decklists from MTGGoldfish can take a while.
async function prepareRun(b, run, user) {
  try {
    let field;
    if (run.oppSet === 'team') {
      field = teamFor(b).map(o => ({ name: `${o.owner}'s ${o.name}`, owner: o.owner, metaPct: null, list: latest(o).list }));
      run.field = { source: 'team', label: 'team', date: run.created };
    } else if (b.seats === 4) {
      const top = (await meta.edhrecMeta()).slice(0, 3);
      field = (await mapLimit(top, 3, async d => ({ name: d.name, owner: 'EDHREC average', metaPct: null, list: await meta.edhrecDeck(d.id) })));
      run.field = { source: 'edhrec', label: 'EDHREC', date: run.created };
    } else {
      const n = run.oppSet === 'meta10' ? 10 : 20;
      const top = (await meta.goldfishMeta(b.format)).slice(0, n);
      field = await mapLimit(top, 4, async d => ({ name: d.name, owner: null, metaPct: d.pct, list: await meta.goldfishDeck(d.id) }));
      field.forEach((f, i) => { if (f.error) f.name = top[i].name; });
      run.field = { source: 'goldfish', label: 'MTGGoldfish', date: run.created };
    }
    run.skipped = field.filter(f => f.error || !f.list?.main?.length).map(f => f.name);
    field = field.filter(f => !f.error && f.list?.main?.length);
    if (!field.length) throw new Error('no opponent decklists could be read');
    run.opponents = await mapLimit(field, 2, async f => ({ name: f.name, owner: f.owner, metaPct: f.metaPct, ...(await meta.faceOf(f.list, f.name)) }));
    const v = b.versions.find(x => x.v === run.v);
    const decks = [{ name: b.name, ...v.list }, ...field.map(f => ({ name: f.name, main: f.list.main, side: f.list.side || [], commander: f.list.commander || [] }))];
    const job = enqueue({ mode: b.seats === 4 ? 'matchup' : 'gauntlet', decks, games: GAMES, format: b.seats === 4 ? 'Commander' : 'Constructed', clock: 180, owner: user.name, brew: b.id });
    run.jobId = job.id; run.status = 'queued';
    if (run.field.source === 'goldfish') run.benchmarkId = benchmarkFor(decks.slice(1), b.format).id;
  } catch (e) { run.status = 'failed'; run.error = e.message; }
  saveBrews();
}

// ---------- the benchmark ----------
// Forge's AI is a stronger pilot of some decks than others, so a raw win rate
// partly measures the AI. The benchmark takes the field's #1 deck through the
// same opponents under the same AI; the gap between it and a brew is what the
// brew itself is worth. One benchmark serves every run against the same field
// for a week, and it queues behind the run that asked for it.
const BENCH = path.join(DATA, 'benchmarks.json');
let benches = []; try { benches = JSON.parse(fs.readFileSync(BENCH, 'utf8')); } catch {}
const saveBench = () => fs.writeFileSync(BENCH, JSON.stringify(benches.slice(-100)));
const BENCH_DAYS = 7;
// A queued job does not survive a restart, so a benchmark is only as alive as its job.
const benchJob = bm => jobs.get(bm.jobId) || history.find(h => h.id === bm.jobId) || null;
const benchAlive = bm => { const j = benchJob(bm); return !!j && !['failed', 'cancelled'].includes(j.status); };
function benchmarkFor(field, format) {
  const names = field.map(f => f.name);
  const same = x => x.format === format && Date.now() - x.created < BENCH_DAYS * 864e5 && benchAlive(x) && x.names[0] === names[0] && names.slice(1).every(n => x.names.includes(n));
  const hit = benches.find(same);
  if (hit) return hit;
  const job = enqueue({ mode: 'gauntlet', decks: field, games: GAMES, format: 'Constructed', clock: 180, owner: 'benchmark' });
  const bm = { id: crypto.randomBytes(5).toString('hex'), format, created: Date.now(), names, jobId: job.id };
  benches.push(bm); saveBench();
  return bm;
}
function benchView(id) {
  const bm = id && benches.find(x => x.id === id); if (!bm) return null;
  const j = benchJob(bm), status = j ? j.status : 'lost';
  const prs = j?.pairings || [];
  return { name: bm.names[0], status, queuePos: j && jobs.has(j.id) ? queue.indexOf(j) : -1,
    opponents: bm.names.slice(1).map((n, i) => { const p = prs[i]; return { name: n, wins: p ? [p.wins[0] || 0, p.wins[1] || 0] : [0, 0] }; }) };
}
// Runs and brews from before the benchmark existed: give finished field runs a
// benchmark from the very decks they faced, and read each list's style once.
async function backfill() {
  let dirty = false;
  for (const b of brews) {
    for (const v of b.versions) if (!('style' in v)) { try { v.style = (await meta.describeDeck(v.list)).style; dirty = true; } catch {} }
    for (const run of b.runs) {
      const j = history.find(h => h.id === run.jobId); if (!j || run.field?.source !== 'goldfish') continue;
      const decks = j.decks.slice(1);
      for (const o of run.opponents || []) if (!('style' in o)) { const d = decks.find(x => x.name === o.name); if (d) { o.style = (await meta.faceOf(d, d.name)).style; dirty = true; } }
      const bm = run.benchmarkId && benches.find(x => x.id === run.benchmarkId);
      if (j.status === 'done' && !(bm && benchAlive(bm))) { run.benchmarkId = benchmarkFor(decks, b.format).id; dirty = true; }
    }
  }
  if (dirty) saveBrews();
}

// A run as the UI reads it: the frozen field plus whatever the job knows now.
function runView(b, run) {
  const j = run.jobId && (jobs.get(run.jobId) || history.find(h => h.id === run.jobId));
  const status = run.status === 'preparing' || run.status === 'failed' && !j ? run.status : j ? j.status : 'lost';
  const prs = j?.pairings || [];
  const played = p => p.games ? p.games.length : p.played || 0;
  const out = { id: run.id, v: run.v, oppSet: run.oppSet, created: run.created, started: j?.started || null, finished: j?.finished || null, status, error: run.error || null, queuePos: j && jobs.has(j.id) ? queue.indexOf(j) : -1, games: GAMES, field: run.field || null, skipped: run.skipped || [] };
  if (b.seats === 4) {
    const p = prs[0];
    out.seats = [{ name: b.name, owner: 'you', coverCard: b.coverCard }, ...(run.opponents || [])].map((s, i) => ({ name: s.name, owner: s.owner, commander: s.coverCard, wins: p ? p.wins[i] || 0 : 0 }));
    out.played = p ? played(p) : 0; out.total = GAMES;
  } else {
    out.opponents = (run.opponents || []).map((o, i) => { const p = prs[i]; return { ...o, wins: p ? [p.wins[0] || 0, p.wins[1] || 0] : [0, 0], draws: p?.draws || 0, played: p ? played(p) : 0, pairing: p?.status || 'queued' }; });
    out.played = out.opponents.reduce((s, o) => s + o.played, 0); out.total = GAMES * out.opponents.length;
  }
  out.warnings = [...new Set(prs.flatMap(p => p.warnings || []))].slice(0, 20);
  out.benchmark = benchView(run.benchmarkId);
  out.style = (b.versions.find(x => x.v === run.v) || {}).style || null;
  return out;
}
// Card-level change from one list to the next: [{ name, section, qty: +n | -n }],
// removals first. Sections are compared separately, so a card moved from the
// sideboard into the main shows as one out and one in.
function diffLists(a, b) {
  const count = l => { const m = new Map(); for (const s of ['main', 'side', 'commander']) for (const c of l[s] || []) { const k = s + '\u0000' + c.name; m.set(k, (m.get(k) || 0) + c.qty); } return m; };
  const A = count(a), B = count(b), out = [];
  for (const k of new Set([...A.keys(), ...B.keys()])) { const q = (B.get(k) || 0) - (A.get(k) || 0); if (q) { const [section, name] = k.split('\u0000'); out.push({ name, section, qty: q }); } }
  return out.sort((x, y) => (x.qty > 0) - (y.qty > 0) || x.section.localeCompare(y.section) || x.name.localeCompare(y.name));
}
const brewView = b => ({ ...b, runs: b.runs.map(r => runView(b, r)), oppSets: oppSets(b) });

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

    // brews
    let m;
    if (p === '/api/check' && req.method === 'POST') {
      const text = String((await readBody(req)).text || '').trim();
      const deck = /^https?:\/\/\S+$/.test(text) ? await meta.importUrl(text) : meta.parseList(text);
      if (!deck.main?.length && !deck.commander?.length) return send(res, 400, { error: "That doesn't read as a decklist. One card per line, like \"4 Lightning Bolt\"." });
      return send(res, 200, { ...(await meta.describeDeck({ main: deck.main || [], side: deck.side || [], commander: deck.commander || [] })), importedName: deck.name || null });
    }
    if (p === '/api/brews' && req.method === 'GET') {
      return send(res, 200, { brews: brews.filter(b => b.owner === user.name).map(brewView), queueLength: queue.length + (running ? 1 : 0) });
    }
    if (p === '/api/brews' && req.method === 'POST') {
      const { list, name, note } = await readBody(req);
      const deck = { main: list?.main || [], side: list?.side || [], commander: list?.commander || [] };
      if (!validDeck(deck.main.length ? deck : { ...deck, main: deck.commander })) return send(res, 400, { error: 'that list has no cards' });
      const d = await meta.describeDeck(deck);
      const now = Date.now();
      const b = { id: crypto.randomBytes(5).toString('hex'), owner: user.name, name: String(name || d.coverCard.split(',')[0] || 'Untitled').slice(0, 60), format: d.format, seats: d.format === 'commander' ? 4 : 2, created: now,
        coverCard: d.coverCard, colors: d.colors, notes: note && String(note).trim() ? [{ k: crypto.randomBytes(3).toString('hex'), t: String(note).trim().slice(0, 500) }] : [],
        versions: [{ v: 1, created: now, list: d.list, rows: d.rows, style: d.style }], runs: [] };
      brews.unshift(b); saveBrews();
      return send(res, 200, brewView(b));
    }
    if ((m = p.match(/^\/api\/brews\/(\w+)\/versions$/)) && req.method === 'POST') {
      const b = brews.find(x => x.id === m[1] && x.owner === user.name); if (!b) return send(res, 404, { error: 'no such brew' });
      const { list, note } = await readBody(req);
      const deck = { main: list?.main || [], side: list?.side || [], commander: list?.commander || [] };
      if (!validDeck(deck.main.length ? deck : { ...deck, main: deck.commander })) return send(res, 400, { error: 'that list has no cards' });
      const d = await meta.describeDeck(deck);
      if ((d.format === 'commander') !== (b.seats === 4)) return send(res, 400, { error: b.seats === 4 ? 'This brew is a Commander deck; that list has no commander.' : "That's a Commander list. Paste it as a new deck instead." });
      const prev = latest(b), diff = diffLists(prev.list, d.list);
      if (!diff.length) return send(res, 400, { error: `That's the same list as v${prev.v}.` });
      b.versions.push({ v: prev.v + 1, created: Date.now(), list: d.list, rows: d.rows, style: d.style, diff });
      if (note && String(note).trim()) b.notes.push({ k: crypto.randomBytes(3).toString('hex'), t: String(note).trim().slice(0, 500) });
      saveBrews();
      return send(res, 200, brewView(b));
    }
    if ((m = p.match(/^\/api\/brews\/(\w+)\/run$/)) && req.method === 'POST') {
      const b = brews.find(x => x.id === m[1] && x.owner === user.name); if (!b) return send(res, 404, { error: 'no such brew' });
      const body = await readBody(req);
      const set = oppSets(b).find(s => s.id === body.oppSet);
      if (!set || !set.available) return send(res, 400, { error: set ? set.detail : 'pick who it should play' });
      const v = b.versions.some(x => x.v === body.v) ? body.v : latest(b).v;
      const run = { id: crypto.randomBytes(4).toString('hex'), v, oppSet: set.id, created: Date.now(), status: 'preparing' };
      b.runs.unshift(run); saveBrews();
      prepareRun(b, run, user);
      return send(res, 200, brewView(b));
    }
    if ((m = p.match(/^\/api\/brews\/(\w+)\/notes\/(\w+)$/)) && req.method === 'DELETE') {
      const b = brews.find(x => x.id === m[1] && x.owner === user.name); if (!b) return send(res, 404, { error: 'no such brew' });
      b.notes = b.notes.filter(n => n.k !== m[2]); saveBrews();
      return send(res, 200, brewView(b));
    }

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
backfill().catch(e => console.error('backfill:', e.message));
