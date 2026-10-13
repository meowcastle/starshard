// sim.starshard.net — tiny API + static UI around Forge's headless simulator.
// No dependencies: Node 20's http + fetch only.
const http = require('http');
const config = require('./config');
const { writeJson, readJson } = require('./store');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { runSim, forgeVersion, pilotTag, pilotFor, engine, engineKey } = require('./forge');
const meta = require('./meta');
const sideboard = require('./sideboard');
const cardstats = require('./cardstats');
const usage = require('./usage');
const score = require('./score');
const realdata = require('./realdata');
const calib = require('./calib');
const aihints = require('./aihints');
const codex = require('./codex');
const coach = require('./coach');
// the formats a brew can be created in (COACH-PARAMETERS-13OCT.md part 2); Standard is the default
// (Commander comes from the list itself: a list with a commander is a Commander brew)
const FORMATS = ['standard', 'pioneer', 'modern', 'legacy', 'vintage'];
const planner = require('./plan');
const claude = require('./claude');

const PORT = config.PORT;
const DATA = config.DATA_DIR;
const HOST = config.HOST;
// Logins are Star Shard accounts. The sim never sees a password hash: it asks the
// Star Shard API (same NAS, loopback only) to log the user in, keeps the session
// token it gets back in its own cookie, and re-checks it against /api/me, so a
// Star Shard logout or password reset ends the sim session too.
const STARSHARD_API = config.STARSHARD_API.replace(/\/$/, '');
const ALLOWED = config.SIM_USERS.map(x => x.toLowerCase());   // Star Shard usernames allowed in; "*" = any account
const ADMINS = config.SIM_ADMINS.map(x => x.toLowerCase());
const MAX_GAMES = config.MAX_GAMES;

// Forge's newest stable release, checked daily (daily snapshots are prereleases, so
// /releases/latest skips them). Admins see a notice when it is newer than ours.
let forgeLatest = null;
const verNum = v => (String(v).match(/\d+(\.\d+)*/) || ['0'])[0].split('.').map(Number);
const newer = (a, b) => { const x = verNum(a), y = verNum(b); for (let i = 0; i < Math.max(x.length, y.length); i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; };
async function checkForge() {
  try {
    const r = await fetch('https://api.github.com/repos/Card-Forge/forge/releases/latest', { headers: { 'User-Agent': 'forge-sim', Accept: 'application/vnd.github+json' } });
    if (!r.ok) throw new Error('GitHub answered ' + r.status);
    const j = await r.json(), version = String(j.tag_name || '').replace(/^forge-/, '');
    if (version) forgeLatest = { version, published: j.published_at, url: j.html_url, checked: Date.now() };
  } catch (e) { console.error('forge release check:', e.message); }
}
setTimeout(checkForge, 30e3); setInterval(checkForge, 24 * 3600e3);
// Daily limits, per person over the last 24 hours (admins are exempt): runs started,
// questions asked, and a ceiling on what the whole sim spends on the model in a day.
const D24 = 864e5;
const RUNS_PER_DAY = config.SIM_RUNS_PER_DAY, ASKS_PER_DAY = config.SIM_ASKS_PER_DAY;
const DAILY_BUDGET = config.SIM_DAILY_BUDGET;
const inTime = ms => { const m = Math.max(1, Math.ceil(ms / 60e3)); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : ''); };
function limitsFor(user) {
  if (user.isAdmin) return null;
  const left = (kind, cap) => { const t = usage.events(user.name, kind, D24).sort((a, b) => a - b); return { cap, left: Math.max(0, cap - t.length), freeIn: t.length >= cap ? t[t.length - cap] + D24 - Date.now() : 0 }; };
  return { runs: left('run', RUNS_PER_DAY), asks: left('ask', ASKS_PER_DAY), budget: DAILY_BUDGET > 0 && usage.spent(D24) >= DAILY_BUDGET };
}
// null if allowed, else the sentence to show
function refusal(user, kind) {
  const l = limitsFor(user); if (!l) return null;
  if (l.budget) return 'The sim has spent its model budget for today. Try again tomorrow, or ask Justin.';
  const x = kind === 'run' ? l.runs : l.asks;
  return x.left ? null : `That's your ${x.cap} ${kind === 'run' ? 'runs' : 'questions'} for today. The next one frees up in ${inTime(x.freeIn)}.`;
}
const forgeUpdate = () => forgeLatest && newer(forgeLatest.version, forgeVersion()) ? forgeLatest : null;
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
let history = readJson(HIST, []);
const saveHist = () => writeJson(HIST, history.slice(0, 200));
const jobs = new Map(); const queue = []; // queue: every job not yet finished, in the order it was queued

function publicJob(j) {
  const { children, log, plan, post, onDone, ...rest } = j;
  return { ...rest, logTail: (log || []).slice(-40) };
}
function enqueue(spec) {
  const id = crypto.randomBytes(5).toString('hex');
  const job = { id, status: 'queued', created: Date.now(), engine: engine(), ...spec, log: [], results: null };
  job.plan = pairingsOf(job);
  job.pairings = job.plan.map(p => ({ names: p.decks.map(d => d.name), wins: p.decks.map(() => 0), draws: 0, games: [], status: 'queued', phase: p.phase, opp: p.opp, a: p.a, b: p.b }));
  job.pending = job.plan.map((_, i) => i); job.inflight = 0; job.children = new Set(); job.base = job.plan.length;
  jobs.set(id, job); queue.push(job); pump();
  return job;
}
// What a job plays, in order. A gauntlet is deck 0 against each of the others; a
// round robin is every deck against every other; a matchup is one pod. When the
// job carries post-board lists (job.post, keyed like the pairing), each pairing is
// followed by its games 2 and 3: the same two decks, boarded.
function pairingsOf(job) {
  const base = job.mode === 'gauntlet' ? job.decks.slice(1).map((o, i) => ({ decks: [job.decks[0], o], opp: i, a: 0, b: i + 1 }))
    : job.mode === 'roundrobin' ? job.decks.flatMap((x, i) => job.decks.slice(i + 1).map((y, k) => ({ decks: [x, y], a: i, b: i + 1 + k })))
    : [{ decks: job.decks, opp: 0 }];
  return base.flatMap(p => { const post = job.post && job.post[p.a + ':' + p.b]; return post ? [{ ...p, phase: 'pre' }, { ...p, decks: post, phase: 'post' }] : [{ ...p, phase: 'pre' }]; });
}

// ---------- players ----------
// A pairing (one opponent, game 1 or boarded) is the unit of work, and several play
// at once: SIM_PARALLEL Forge processes here, plus any remote workers (worker.js on
// another machine) that check pairings out over /api/worker. Every free player takes
// the next pairing by the same rule: people take turns (the job whose owner was
// served longest ago goes next, a person's own jobs in the order they started), and
// calibration only plays when nobody is waiting and never takes the last local
// player, so a person's run always starts at once.
const SLOTS = Math.max(1, config.SIM_PARALLEL);
let localBusy = 0;
const lastServed = new Map();
function claim(where) {
  const open = queue.filter(j => j.status !== 'cancelled' && j.pending.length);
  let from = open.filter(j => !j.low);
  if (!from.length) {
    if (where === 'local' && SLOTS > 1 && localBusy >= SLOTS - 1) return null;
    from = open;
  }
  if (!from.length) return null;
  const job = from.reduce((best, j) => !best || (lastServed.get(j.owner) || 0) < (lastServed.get(best.owner) || 0) ? j : best, null);
  const i = job.pending.shift(), pr = job.pairings[i];
  job.inflight++; lastServed.set(job.owner, Date.now());
  if (job.status === 'queued') { job.status = 'running'; job.started = job.started || Date.now(); }
  Object.assign(pr, { status: 'running', where, wins: pr.names.map(() => 0), draws: 0, games: [], warnings: [], cards: null });
  return { job, i, pr };
}
// a pairing a player gave up on (a remote worker that went quiet) goes back to the front
function unclaim(job, i) {
  const pr = job.pairings[i];
  Object.assign(pr, { status: 'queued', where: null, wins: pr.names.map(() => 0), draws: 0, games: [], warnings: [], cards: null });
  job.inflight--; if (job.status !== 'cancelled') job.pending.unshift(i);
  settle(job); pump();
}
// Every pairing gets a fixed Forge seed from its job and index, kept on the pairing, so
// it can be replayed. Forge isn't fully deterministic (its AI has a wall-clock limit per
// decision), but the same seed and lists give the same shuffles and the same AI rolls.
const seedOf = (jobId, i) => { let h = 2166136261; for (const ch of jobId + ':' + i) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return (h >>> 0) % 2147483647; };
function pump() {
  while (localBusy < SLOTS) {
    const t = claim('local'); if (!t) break;
    localBusy++;
    playLocal(t).catch(e => { t.pr.status = 'failed'; t.pr.error = e.message; })
      .finally(() => { localBusy--; t.job.inflight--; settle(t.job); pump(); });
  }
}
// Where a pairing's per-turn game logs go, with a meta.json saying what was played and by which engine.
// background (the default): the calibration round robins and benchmarks, meta deck against meta
// deck, where nobody waits; the bridge plays about a third slower than forge sim (13 Oct 2026).
const logsJob = job => config.SIM_GAME_LOG === 'all' || (config.SIM_GAME_LOG === 'background' && (job.owner === 'calibration' || job.owner === 'benchmark'));
function gameLogDir(job, i) {
  if (!logsJob(job)) return null;
  const dir = path.join(DATA, 'gamelogs', job.id, String(i));
  try { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ job: job.id, pairing: i, mode: job.mode, owner: job.owner, meta: job.meta || null, phase: job.plan[i].phase || null, decks: job.plan[i].decks.map(d => d.name), engine: job.engine || null, created: Date.now() })); } catch { return null; }
  return dir;
}
async function playLocal({ job, i, pr }) {
  pr.seed = seedOf(job.id, i);
  const run = runSim({
    decks: job.plan[i].decks, games: job.games, format: job.format, clock: job.clock, seed: pr.seed,
    workDir: path.join(DATA, 'jobs', job.id, String(i)), logDir: gameLogDir(job, i),
    onLine: l => { job.log.push(l); if (job.log.length > 2000) job.log.shift(); },
  });
  job.children.add(run.child);
  // live view: share the parser's arrays
  pr.wins = run.results.wins; pr.games = run.results.games; pr.names = run.results.names; pr.warnings = run.results.warnings; pr.cards = run.results.cards;
  const { code, results } = await run.done;
  job.children.delete(run.child);
  pr.draws = results.draws; pr.status = code === 0 || results.games.length ? 'done' : 'failed'; pr.exit = code;
}
function cancelJob(j) {
  if (!j || ['done', 'failed', 'cancelled'].includes(j.status)) return;
  j.status = 'cancelled'; j.pending = [];
  for (const c of j.children) c.kill('SIGKILL');
  settle(j);
}
// a job is finished once nothing of it is waiting or playing
function settle(job) {
  if (!job.pending.length && job.status !== 'cancelled' && !job.finished) { try { extend(job); } catch (e) { console.error('extend:', e.message); } }
  if (job.inflight > 0 || (job.pending.length && job.status !== 'cancelled') || job.finished) return;
  const qi = queue.indexOf(job); if (qi >= 0) queue.splice(qi, 1);
  if (job.status !== 'cancelled') job.status = job.pairings.every(p => p.status === 'failed') ? 'failed' : 'done';
  job.finished = Date.now();
  history.unshift({ id: job.id, owner: job.owner, mode: job.mode, format: job.format, games: job.games, created: job.created, finished: job.finished, status: job.status,
    pairings: job.pairings.map(({ names, wins, draws, games, phase, opp, a, b, cards, where, ext, seed }) => ({ names, wins, draws, seed: seed ?? null, played: games.length, avgMs: games.length ? Math.round(games.reduce((s, g) => s + g.ms, 0) / games.length) : 0, phase, opp, a, b, pd: score.tallyGames(games), where: where || null, ...(ext ? { ext: true } : {}), ...(job.brew && cards ? { cards } : {}) })),
    decks: job.decks, meta: job.meta || null, engine: job.engine || null });
  saveHist();
  setTimeout(() => jobs.delete(job.id), 6 * 3600e3);
  if (job.onDone) try { job.onDone(job); } catch (e) { console.error('onDone:', e.message); }
}

// More games where they change the answer. A brew's field run plays 20 games of each
// phase per opponent first; after that, while its headline's 95% range is wider than
// SIM_TARGET points either side, each finished pairing tops the queue up with another
// 20 games for the matchups whose uncertainty moves the headline most (meta share
// squared times the matchup's variance, discounted by the games it already has),
// until the extra games reach SIM_EXTRA times the first pass. Games already played by
// earlier runs of the same list count, so a rerun often needs none.
const TARGET = config.SIM_TARGET / 100, EXTRA = config.SIM_EXTRA;
function extend(job) {
  if (!job.brew || job.mode !== 'gauntlet' || !job.base || !EXTRA) return;
  const room = Math.min(Math.max(4, SLOTS + leases.size) - job.inflight, Math.round(job.base * EXTRA) - (job.plan.length - job.base)); if (room <= 0) return;
  const b = brews.find(x => x.id === job.brew), run = b && b.runs.find(r => r.jobId === job.id); if (!run || run.cancelled) return;
  const rv = runView(b, run); if (!rv.score || (rv.score.hi - rv.score.lo) / 2 <= TARGET) return;
  const busy = new Set(job.pairings.filter(p => p.status === 'running' || p.status === 'queued').map(p => p.opp));
  const pick = rv.opponents.map((o, i) => ({ i, s: rv.scores[i] })).filter(x => x.s && x.s.counted && !busy.has(x.i))
    .map(x => ({ ...x, gain: x.s.wt * x.s.wt * x.s.v * GAMES / (x.s.n + GAMES) })).sort((x, y) => y.gain - x.gain).slice(0, room);
  for (const { i, s } of pick) {
    const base = job.plan.filter(p => p.opp === i), post = base.find(p => p.phase === 'post');
    // the boarded games when they are the thinner half, else game 1
    const from = post && s.n2 < s.n1 ? post : base.find(p => p.phase !== 'post'); if (!from) continue;
    job.plan.push({ ...from, ext: true });
    job.pairings.push({ names: from.decks.map(d => d.name), wins: from.decks.map(() => 0), draws: 0, games: [], status: 'queued', phase: from.phase, opp: from.opp, a: from.a, b: from.b, ext: true });
    job.pending.push(job.plan.length - 1);
  }
  if (pick.length) pump();
}

// Remote workers. A worker checks out one pairing at a time (a lease), plays it with
// its own Forge, and reports as it goes; a lease with no report for two minutes goes
// back in line. Off unless SIM_WORKER_TOKEN is set, and a worker running a different
// Forge version than ours is turned away, so every game in a run plays the same AI.
// where a job stands in line: -1 once it has started playing
const waitPos = j => j && jobs.has(j.id) && j.status === 'queued' ? queue.filter(x => x.status === 'queued').indexOf(j) : -1;
const WORKER_TOKEN = config.SIM_WORKER_TOKEN;
const LEASE_MS = config.SIM_LEASE_MS;
const leases = new Map(); // id -> { job, i, pr, worker, until }
const workersSeen = new Map(); // name -> { at, forge, playing }
const workerOk = req => {
  if (!WORKER_TOKEN) return false;
  const got = Buffer.from(String(req.headers.authorization || '').replace(/^Bearer /, '')), want = Buffer.from(WORKER_TOKEN);
  return got.length === want.length && crypto.timingSafeEqual(got, want);
};
setInterval(() => { for (const [id, l] of leases) if (Date.now() > l.until) { leases.delete(id); console.warn(`worker ${l.worker} went quiet; pairing ${l.job.id}/${l.i} back in line`); unclaim(l.job, l.i); } }, Math.min(15e3, LEASE_MS / 2));
const clean = r => ({
  wins: Array.isArray(r?.wins) ? r.wins.slice(0, 4).map(x => +x || 0) : null, draws: +r?.draws || 0,
  games: Array.isArray(r?.games) ? r.games.slice(0, MAX_GAMES).map(g => ({ n: +g.n || 0, winner: Number.isInteger(g.winner) ? g.winner : -1, ms: +g.ms || 0, ...(g.turn ? { turn: +g.turn } : {}), ...(g.first === 0 || g.first === 1 ? { first: g.first } : {}) })) : [],
  warnings: Array.isArray(r?.warnings) ? r.warnings.slice(0, 50).map(String) : [], cards: Array.isArray(r?.cards) ? r.cards.slice(0, 4) : null,
});

// ---------- brews ----------
// A brew is one deck someone is working on. Each pasted list is a version; every
// run is filed under the version it played, with the field it faced frozen beside
// it. Results themselves live on the job (live) or in history (finished).
const BREWS = path.join(DATA, 'brews.json');
let brews = readJson(BREWS, []);
const saveBrews = () => writeJson(BREWS, brews);
// A run that was still reading decklists when the process stopped will never finish.
brews.forEach(b => b.runs.forEach(r => { if (r.status === 'preparing') { r.status = 'failed'; r.error = 'the server restarted before this run was queued'; } }));
// an answer that was being written when the process stopped will not arrive
brews.forEach(b => { if (b.thinking) { b.thinking = false; (b.thread = b.thread || []).push({ role: 'coach', text: 'I lost that question when the simulator restarted. Ask again?', at: Date.now(), kind: 'error' }); } });
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
  // a best-of-three run plays game 1 and the boarded games as separate pairings
  const pod = b.seats === 4, per = (LOAD_SECONDS + GAMES * secondsPerGame(pod)) * (!pod && sideboard.available() ? 2 : 1), team = teamFor(b);
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
// Both sides' sideboard plans for a set of pairings, and the boarded lists Forge
// plays for games 2 and 3. `pairs` is [[i, j], ...] into `decks`. A pairing whose
// plans board nothing on either side gets no post-board games: its games 2-3 are
// game 1's lists, so game 1's rate stands for them.
// "real pilots carry ..." for an archetype the calibration has seen, as a line for the plan writer
const realSideOf = (format, name) => { const a = calibs[String(format).toLowerCase()]?.sideboards?.[name]; return a ? `Real tournament pilots of ${name} (${a.pilots} decks, last ${REAL_DAYS} days) most often carry in their sideboards: ` + a.cards.slice(0, 12).map(c => `${c.name} (${Math.round(c.share * 100)}% of decks, ${c.copies.toFixed(1)} copies)`).join(', ') + '.' : null; };
async function boardAll(decks, pairs, format) {
  if (!sideboard.available()) return { post: null, plans: {}, note: 'no-model' };
  const post = {}, plans = {};
  await mapLimit(pairs, 4, async ([i, j]) => {
    const k = i + ':' + j;
    try {
      const p = await sideboard.planFor(decks[i], decks[j], format, { a: realSideOf(format, decks[i].name), b: realSideOf(format, decks[j].name) });
      plans[k] = { a: p.a, b: p.b };
      if (p.a.in.length || p.b.in.length) post[k] = [sideboard.apply(decks[i], p.a), sideboard.apply(decks[j], p.b)];
    } catch (e) { plans[k] = { error: e.message }; }
  });
  return { post, plans };
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
    const decks = [{ name: b.name, ...v.list, ...(v.style?.kind === 'control' ? { ai: 'control' } : {}) }, ...field.map(f => ({ name: f.name, main: f.list.main, side: f.list.side || [], commander: f.list.commander || [] }))];
    let post = null;
    if (b.seats !== 4) {
      // best of three: game 1 as listed, games 2 and 3 boarded
      const bd = await usage.as({ who: b.owner, kind: 'plans', brew: b.id }, () => boardAll(decks, decks.slice(1).map((_, i) => [0, i + 1]), b.format));
      post = bd.post; run.bo3 = bd.note === 'no-model' ? 'unboarded' : 'boarded';
      // a key that expired or ran out of credit fails every call: say so instead of quietly playing unboarded
      const errs = Object.values(bd.plans).filter(p => p.error);
      if (errs.length) { run.planErrors = errs.length; run.planError = errs[0].error.slice(0, 200); if (errs.length === Object.keys(bd.plans).length) run.bo3 = 'plan-failed'; }
      run.opponents.forEach((o, i) => { const p = bd.plans['0:' + (i + 1)]; o.plan = p ? (p.error ? { error: p.error } : { me: p.a, opp: p.b }) : null; });
    }
    if (run.cancelled) { saveBrews(); return; }
    const job = enqueue({ mode: b.seats === 4 ? 'matchup' : 'gauntlet', decks, post, games: GAMES, format: b.seats === 4 ? 'Commander' : 'Constructed', clock: CLOCK_S, owner: user.name, brew: b.id });
    run.jobId = job.id; run.status = 'queued';
    if (run.field.source === 'goldfish') run.benchmarkId = (await benchmarkFor(decks.slice(1), b.format)).id;
  } catch (e) { run.status = 'failed'; run.error = e.message; }
  saveBrews();
}

// A pairing's game-1 and post-board results for opponent i. History from before
// best-of-three has no phase or opponent index: there, pairing i is opponent i.
// A matchup can have several pairings per phase (the first pass and any games added
// where the result was still uncertain); they are merged into one.
function phasesOf(prs, i) {
  if (prs.length && prs[0].opp == null && prs[0].a == null) return { pre: mergePr(prs[i] ? [prs[i]] : []), post: null };
  return { pre: mergePr(prs.filter(p => p.opp === i && p.phase !== 'post')), post: mergePr(prs.filter(p => p.opp === i && p.phase === 'post')) };
}
const played = p => p ? (p.games ? p.games.length : p.played || 0) : 0;
// who went first in each game, from the brew's side: live pairings carry their games, finished ones a tally
const pdOf = p => p.games ? score.tallyGames(p.games) : p.pd || { P: [0, 0], D: [0, 0], U: [p.wins[0] || 0, (p.wins[0] || 0) + (p.wins[1] || 0)] };
function mergePr(list) {
  if (!list.length) return null;
  const has = k => list.some(p => p.status === k);
  const st = list.every(p => p.status === 'queued') ? 'queued' : list.every(p => p.status === 'failed') ? 'failed' : has('running') || has('queued') ? 'running' : 'done';
  const cards = list.some(p => p.cards) ? [0, 1].map(s => cardstats.merge(list.map(p => p.cards && p.cards[s]))) : null;
  return { wins: [0, 1].map(s => list.reduce((t, p) => t + (p.wins[s] || 0), 0)), draws: list.reduce((t, p) => t + (p.draws || 0), 0), played: list.reduce((t, p) => t + played(p), 0),
    status: list.length === 1 ? list[0].status || 'done' : st, cards, pd: list.reduce((t, p) => score.addT(t, pdOf(p)), score.T0()), parts: list.length };
}
const tally = p => p ? { wins: [p.wins[0] || 0, p.wins[1] || 0], draws: p.draws || 0, played: played(p), status: p.status || 'done' } : null;

// ---------- the benchmark ----------
// Forge's AI is a stronger pilot of some decks than others, so a raw win rate
// partly measures the AI. The benchmark takes the field's #1 deck through the
// same opponents under the same AI, best of three like the run; the gap between
// it and a brew is what the brew itself is worth. One benchmark serves every run
// against the same field for a week, and it queues behind the run that asked.
const BENCH = path.join(DATA, 'benchmarks.json');
let benches = readJson(BENCH, []);
const saveBench = () => writeJson(BENCH, benches.slice(-100));
const BENCH_DAYS = 7;
// A queued job does not survive a restart, so a benchmark is only as alive as its job.
const jobOf = id => jobs.get(id) || history.find(h => h.id === id) || null;
const benchAlive = bm => { const j = jobOf(bm.jobId); return !!j && !['failed', 'cancelled'].includes(j.status); };
const benchPending = new Map(); // field key -> promise, so two runs at once share one benchmark
async function benchmarkFor(field, format) {
  const names = field.map(f => f.name), key = format + '|' + names.join('|');
  // an unboarded benchmark is not reused once plans can be written
  const same = x => x.format === format && Date.now() - x.created < BENCH_DAYS * 864e5 && benchAlive(x) && (x.bo3 === 'boarded' || !sideboard.available()) && (x.engine ? engineKey(x.engine) === engineKey(engine()) : (x.pilot || 'off') === pilotTag()) && x.names[0] === names[0] && names.slice(1).every(n => x.names.includes(n));
  const hit = benches.find(same); if (hit) return hit;
  if (benchPending.has(key)) return benchPending.get(key);
  const p = (async () => {
    const bd = await usage.as({ who: 'benchmark', kind: 'plans' }, () => boardAll(field, field.slice(1).map((_, i) => [0, i + 1]), format));
    const job = enqueue({ mode: 'gauntlet', decks: field, post: bd.post, games: GAMES, format: 'Constructed', clock: CLOCK_S, owner: 'benchmark', meta: format, onDone: () => refit(format).catch(e => console.error('refit:', e.message)) });
    const failed = bd.note !== 'no-model' && Object.values(bd.plans).every(p => p.error);
    const bm = { id: crypto.randomBytes(5).toString('hex'), format, created: Date.now(), names, jobId: job.id, pilot: pilotTag(), engine: engine(), bo3: bd.note === 'no-model' ? 'unboarded' : failed ? 'plan-failed' : 'boarded' };
    benches.push(bm); saveBench();
    return bm;
  })().finally(() => benchPending.delete(key));
  benchPending.set(key, p);
  return p;
}
function benchView(id) {
  const bm = id && benches.find(x => x.id === id); if (!bm) return null;
  const j = jobOf(bm.jobId), status = j ? j.status : 'lost', prs = j?.pairings || [];
  return { name: bm.names[0], status, bo3: bm.bo3 || null, queuePos: waitPos(j),
    opponents: bm.names.slice(1).map((n, i) => { const ph = phasesOf(prs, i); return { name: n, ...(tally(ph.pre) || { wins: [0, 0], played: 0 }), post: tally(ph.post) }; }) };
}

// ---------- calibration against real tournaments ----------
// Once a week per format, the field's top decks play each other (best of three,
// low priority, giving way to any run). Together with the benchmarks, that gives
// Forge's rate for meta-vs-meta pairings; real tournament results give people's.
// calib.fit turns the two into one "how much does Forge overrate this deck"
// number per archetype, which the page uses to correct every matchup.
const CAL = path.join(DATA, 'calibration.json');
let calibs = readJson(CAL, {});
const saveCal = () => writeJson(CAL, calibs);
coach.useField(format => calibs[String(format).toLowerCase()]?.lists || null);
const CAL_TOP = config.CALIBRATE_TOP;
const CAL_DAYS = 7, FORGE_DAYS = 21, REAL_DAYS = config.REAL_DAYS;

// Forge's meta-vs-meta results, pooled over game 1 and boarded games, keyed by pair.
function forgePairs(format) {
  const out = {}, since = Date.now() - FORGE_DAYS * 864e5;
  for (const h of history) {
    if (h.meta !== format || h.finished < since || !['benchmark', 'calibration'].includes(h.owner)) continue;
    for (const p of h.pairings || []) {
      if (!p.played || p.names.length !== 2 || p.names[0] === p.names[1]) continue;
      const k = calib.pairKey(p.names[0], p.names[1]), first = p.names[0] < p.names[1] ? 0 : 1;
      // the loser of each game plays first in the next, so the raw count leans toward 50%:
      // balance it as half the games on the play and half on the draw when both were seen
      const t = pdOf(p), n = p.wins[0] + p.wins[1], r = (w, m) => (w + 0.5) / (m + 1);
      const w0 = t.P[1] >= 3 && t.D[1] >= 3 ? n * (r(t.P[0], t.P[1]) + r(t.D[0], t.D[1])) / 2 : p.wins[0];
      const c = out[k] = out[k] || [0, 0]; c[first] += w0; c[1 - first] += n - w0;
    }
  }
  return out;
}
// The newest field lists Forge played for a format: the decks real results are sorted into.
// Every list from this format's recent benchmarks and round robins, newest first per
// name, so real decks are sorted against the whole top 20 and not just the top 10.
function fieldLists(format) {
  const since = Date.now() - FORGE_DAYS * 864e5, seen = new Map();
  for (const h of history) if (h.meta === format && h.finished >= since && ['benchmark', 'calibration'].includes(h.owner) && h.status === 'done') for (const d of h.decks) if (!seen.has(d.name)) seen.set(d.name, d);
  return seen.size ? [...seen.values()] : null;
}
async function refit(format) {
  const field = fieldLists(format); if (!field) return null;
  const real = await realdata.matrix(field, format, { days: REAL_DAYS });
  const realPairs = {};
  for (const [a, row] of Object.entries(real.pairs)) for (const [b, p] of Object.entries(row)) if (a < b) realPairs[calib.pairKey(a, b)] = p.games;
  const forge = forgePairs(format), f = calib.fit(forge, realPairs);
  // what real pilots of each archetype carry in their sideboards, for the plan writer's hint and the audit
  let sbs = null; try { sbs = await realdata.sideboards(field, format, { days: REAL_DAYS }); } catch (e) { console.error('sideboards:', e.message); }
  const sideboards = sbs && Object.fromEntries(Object.entries(sbs).filter(([, a]) => a.pilots >= 5).map(([n, a]) => [n, { pilots: a.pilots,
    cards: Object.entries(a.cards).map(([name, x]) => ({ name, share: x.decks / a.pilots, copies: x.copies / x.decks })).filter(x => x.share >= 0.15).sort((x, y) => y.share - x.share).slice(0, 20) }]));
  // each archetype's real match record: against the whole field from fully published MTGO events
  // where there are 20+ such matches, else its head-to-head matches against the other field decks
  const h2h = Object.fromEntries(Object.entries(real.pairs).map(([a, row]) => { let w = 0, l = 0; for (const [b, p] of Object.entries(row)) if (b !== a) { w += p.matches[0]; l += p.matches[1]; } return [a, { w, l, vs: 'field decks' }]; }));
  const realField = { ...h2h, ...Object.fromEntries(Object.entries(real.vsField || {}).filter(([, x]) => x.w + x.l >= 20).map(([a, x]) => [a, { w: x.w, l: x.l, vs: 'whole field', events: x.events }])) };
  calibs[format] = { at: Date.now(), beta: f.beta, evidence: f.evidence, lambda: f.lambda, pairs: f.pairs, realGames: f.realGames, forgePairs: Object.keys(forge).length,
    events: real.events, mtgoEvents: real.mtgoEvents || 0, completeEvents: real.completeEvents || 0, decks: real.decks, other: real.other, matches: real.matches, newest: real.newest, days: real.days, seen: real.seen, realField,
    lists: field.map(d => ({ name: d.name, main: d.main })),
    // the fit's inputs, kept so it can be audited and tested offline
    inputs: { forge, real: realPairs }, fidelity: calib.fidelity(forge, realPairs), deckFidelity: calib.deckFidelity(forge, realField), sideboards: sideboards || calibs[format]?.sideboards || null };
  saveCal();
  return calibs[format];
}
// Queue this week's round robin for every format someone has a brew in.
async function calibrateDue() {
  for (const format of [...new Set(brews.filter(b => b.seats === 2 && meta.GOLDFISH_FORMATS.includes(b.format)).map(b => b.format))]) {
    const recent = history.find(h => h.meta === format && h.owner === 'calibration' && h.status === 'done' && Date.now() - h.finished < CAL_DAYS * 864e5);
    const inFlight = [...jobs.values()].some(j => j.meta === format && j.owner === 'calibration' && !['done', 'failed', 'cancelled'].includes(j.status));
    if (recent || inFlight) continue;
    try {
      const top = (await meta.goldfishMeta(format)).slice(0, CAL_TOP);
      const lists = await mapLimit(top, 4, async d => ({ name: d.name, ...(await meta.goldfishDeck(d.id)) }));
      const decks = lists.filter(d => !d.error && d.main?.length).map(d => ({ name: d.name, main: d.main, side: d.side || [], commander: [] }));
      if (decks.length < 4) continue;
      const pairs = decks.flatMap((_, i) => decks.slice(i + 1).map((__, k) => [i, i + 1 + k]));
      const bd = await usage.as({ who: 'calibration', kind: 'plans' }, () => boardAll(decks, pairs, format));
      enqueue({ mode: 'roundrobin', decks, post: bd.post, games: GAMES, format: 'Constructed', clock: CLOCK_S, owner: 'calibration', meta: format, low: true, onDone: () => refit(format).catch(e => console.error('refit:', e.message)) });
    } catch (e) { console.error('calibrate', format, e.message); }
  }
}
// The calibration a run's page reads: each opponent's beta, the brew's own (from
// the archetype it is closest to), and how much real data stands behind it.
const MIN_EVIDENCE = 2;
function calibView(b, run) {
  const c = calibs[b.format]; if (!c || !run.opponents) return null;
  const v = b.versions.find(x => x.v === run.v); if (!v) return null;
  const me = realdata.vec(v.list.main); let best = 0, near = null;
  for (const l of c.lists) { const s = realdata.overlap(me, realdata.vec(l.main)); if (s > best) { best = s; near = l.name; } }
  const known = n => c.beta[n] != null && (c.evidence[n] || 0) >= MIN_EVIDENCE;
  const mine = best >= realdata.MATCH_AT && known(near) ? near : null;
  return { at: c.at, events: c.events, matches: c.matches, realGames: c.realGames, days: c.days, newest: c.newest, pairs: c.pairs, lambda: c.lambda || 2, fidelity: c.fidelity || null, deckFidelity: c.deckFidelity || null,
    me: { near: mine, overlap: Math.round(best * 100), beta: mine ? c.beta[mine] : 0, evidence: mine ? c.evidence[mine] : 0 },
    opp: Object.fromEntries(run.opponents.map(o => [o.name, known(o.name) ? { beta: c.beta[o.name], evidence: Math.round(c.evidence[o.name] * 10) / 10, real: c.realField[o.name] || null, decks: c.seen[o.name] || 0 } : null])) };
}

// An uploaded cover arrives as a data URL; keep the bytes, and only images.
const COVER_TYPES = { 'image/jpeg': 1, 'image/png': 1, 'image/webp': 1 };
function saveCover(id, dataUrl) {
  const m = String(dataUrl).match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!m || !COVER_TYPES[m[1]]) throw new Error('the cover has to be a JPEG, PNG or WebP image');
  const buf = Buffer.from(m[2], 'base64'); if (buf.length > 4 * 1024 * 1024) throw new Error('the cover image is over 4 MB');
  fs.mkdirSync(path.join(DATA, 'covers'), { recursive: true }); fs.writeFileSync(path.join(DATA, 'covers', id + '.img'), buf);
  coverTypes[id] = m[1];
  return '/api/brews/' + id + '/cover';
}
const coverTypes = {};

// ---------- the Codex's view of the world ----------
// Standard only for now: members' Standard brews, and the field the sim has been
// playing against (the newest benchmark/round-robin lists, else the newest run's).
async function codexCtx(user) {
  const format = 'standard';
  let field = fieldLists(format);
  // before the first benchmark finishes: the opponents of the newest Standard field run
  if (!field) { const ids = new Set(brews.filter(b => b.format === format).flatMap(b => b.runs.filter(r => r.field?.source === 'goldfish').map(r => r.jobId))); const h = history.find(x => ids.has(x.id)); field = h ? h.decks.slice(1) : []; }
  const shares = {}; try { (await meta.goldfishMeta(format)).forEach(d => { shares[d.name] = d.pct; }); } catch {}
  const at = history.find(h => h.meta === format && h.status === 'done')?.finished || Date.now();
  const mine = brews.filter(b => b.owner === user.name && b.format === format && b.seats === 2);
  // this member's record against an archetype: each brew's newest finished run that faced it, game 1 and boarded games together
  const records = name => mine.flatMap(b => {
    for (const r of b.runs) {
      const v = runView(b, r); if (v.status !== 'done') continue;
      const o = (v.opponents || []).find(x => x.name === name); if (!o || !o.played) continue;
      const w = o.wins[0] + (o.post ? o.post.wins[0] : 0), l = o.wins[1] + (o.post ? o.post.wins[1] : 0);
      return [{ brew: b.name + ' v' + r.v, note: new Date(r.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' + (w + l) + ' games', rec: w + '–' + l, bad: w < l }];
    }
    return [];
  });
  return { brews: brews.filter(b => b.format === format), field: field.map(d => ({ name: d.name, main: d.main, side: d.side || [] })), shares, me: user.name,
    snapshot: new Date(at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' field', real: n => calibs[format]?.realField?.[n] || null, records };
}

// Runs and brews from before the benchmark existed: give finished field runs a
// benchmark from the very decks they faced, and read each list's style once.
// A version's reading (plan.js): its plan, the nearest meta deck on the calibration field, and
// what it is short or long of for the plan. Stored on the version; redone when the field changes.
async function readVersion(b, v) {
  const c = calibs[b.format];
  if (b.seats !== 2 || !c || !c.lists || (v.reading && v.reading.at === c.at)) return false;
  try {
    v.reading = { ...(await planner.readList(v.list, c.lists)), at: c.at }; delete v.reading.counts;
    // rotation: re-checked with each field refresh; a version that has stopped being legal is marked
    if (b.format !== 'commander') { const find = await meta.cards([...v.list.main, ...(v.list.side || [])].map(x => x.name)); const r = meta.legalFor(v.list, b.format, find); v.legal = { ok: r.ok, illegal: r.illegal, unknown: r.unknown, at: Date.now() }; }
    return true;
  }
  catch (e) { console.warn('reading:', e.message); return false; }
}
const readSoon = (b, v) => { readVersion(b, v).then(ch => { if (ch) saveBrews(); }); };

async function backfill() {
  let dirty = false;
  for (const b of brews) {
    for (const v of b.versions) if (!('style' in v)) { try { v.style = (await meta.describeDeck(v.list)).style; dirty = true; } catch {} }
    for (const v of b.versions) if (await readVersion(b, v)) dirty = true;
    for (const run of b.runs) {
      const j = history.find(h => h.id === run.jobId); if (!j || run.field?.source !== 'goldfish') continue;
      const decks = j.decks.slice(1);
      for (const o of run.opponents || []) if (!('style' in o)) { const d = decks.find(x => x.name === o.name); if (d) { o.style = (await meta.faceOf(d, d.name)).style; dirty = true; } }
      const bm = run.benchmarkId && benches.find(x => x.id === run.benchmarkId);
      if (j.status === 'done' && !(bm && benchAlive(bm) && (bm.bo3 === 'boarded' || !sideboard.available()))) { run.benchmarkId = (await benchmarkFor(decks, b.format)).id; dirty = true; }
    }
  }
  if (dirty) saveBrews();
}

// A run as the UI reads it: the frozen field plus whatever the job knows now.
function runView(b, run) {
  const j = run.jobId && jobOf(run.jobId);
  const status = run.cancelled && !(j && j.status === 'done') ? 'cancelled' : run.status === 'preparing' || run.status === 'failed' && !j ? run.status : j ? j.status : 'lost';
  const status2 = status;
  const prs = j?.pairings || [];
  const out = { id: run.id, v: run.v, oppSet: run.oppSet, created: run.created, started: j?.started || null, finished: j?.finished || null, status: status2, error: run.error || null, queuePos: waitPos(j), games: GAMES, field: run.field || null, skipped: run.skipped || [], bo3: run.bo3 || null, planErrors: run.planErrors || 0, planError: run.planError || null };
  if (b.seats === 4) {
    const p = prs[0];
    out.seats = [{ name: b.name, owner: 'you', coverCard: b.coverCard }, ...(run.opponents || [])].map((s, i) => ({ name: s.name, owner: s.owner, commander: s.coverCard, wins: p ? p.wins[i] || 0 : 0 }));
    out.played = played(p); out.total = GAMES;
  } else {
    out.opponents = (run.opponents || []).map((o, i) => { const ph = phasesOf(prs, i), pre = tally(ph.pre); return { ...o, wins: pre ? pre.wins : [0, 0], draws: pre?.draws || 0, played: pre?.played || 0, pairing: pre?.status || 'queued', post: tally(ph.post) }; });
    out.played = prs.reduce((s, p) => s + played(p), 0); out.total = j?.pairings ? GAMES * j.pairings.length : GAMES * out.opponents.length;
  }
  out.warnings = [...new Set(prs.flatMap(p => p.warnings || []))].slice(0, 20);
  // one entry per game in play order while the run is live: 1 won, 0 lost or drawn, null not played yet
  if (j && jobs.has(j.id) && j.pairings) out.pulse = j.pairings.flatMap(p => Array.from({ length: GAMES }, (_, g) => p.games[g] ? (p.games[g].winner === 0 ? 1 : 0) : null));
  out.benchmark = benchView(run.benchmarkId);
  out.style = (b.versions.find(x => x.v === run.v) || {}).style || null;
  out.coach = run.coach || null;
  out.cards = cardsView(b, run, prs);
  out.aiCards = aiView(b, j);
  out.calibration = b.seats === 2 ? calibView(b, run) : null;
  out.method = methodOf(b, run, j);
  out.engine = j?.engine || null;
  out.reading = (b.versions.find(x => x.v === run.v) || {}).reading || null;
  if (b.seats === 2 && out.opponents) scoreView(b, run, j, out);
  out.extended = j?.pairings ? j.pairings.filter(p => p.ext).length * GAMES : 0;
  return out;
}

// How the run's numbers are made, in one object (WORKORDER-DESIGN-CODE-13OCT.md item 3): the
// page shows it in one place instead of method sentences scattered across its screens.
const HATCH_UNDER = 30, CLOCK_S = 180;
function methodOf(b, run, j) {
  const c = b.seats === 2 ? calibs[b.format] : null;
  const piloted = j && j.decks ? j.decks.map(d => ({ name: d.name, pilot: pilotFor(d) })).filter(x => x.pilot) : [];
  return {
    forge: forgeVersion(),
    pilot: { tag: pilotTag(), decks: piloted },
    gamesPerPairing: GAMES, extraGames: b.seats === 2 ? { target: TARGET, upTo: EXTRA } : null,
    clockSeconds: CLOCK_S, bo3: run.bo3 || null,
    calibration: c ? { realGames: c.realGames, events: c.events, mtgoEvents: c.mtgoEvents || 0, days: c.days, pairs: c.pairs, at: c.at } : null,
    hatchUnder: HATCH_UNDER,
    notCounted: b.seats === 2 ? 'A matchup against a deck Forge pilots badly (control or combo) is left out of the headline until real tournament results have calibrated it.' : null,
    cardStats: 'Read from Forge\'s game logs. Cast counts each game once. Forge doesn\'t log draws, so a low cast rate can mean not drawn or stuck in hand. Lands are left out.',
    field: run.field && run.field.source ? { source: run.field.source, label: run.field.label || null, date: run.field.date || null } : null,
  };
}

// Cards Forge's AI won't play (or plays only now and then), and cards Forge doesn't
// have at all, for the brew and each opponent as this run played them (aihints.js).
// Shown beside the matchup and handed to the coach; nothing is left out of the numbers.
const aiSeen = new Map();
function aiView(b, j) {
  if (!j || !j.decks) return null;
  if (aiSeen.has(j.id)) return aiSeen.get(j.id);
  const opt = { version: forgeVersion(), commander: b.format === 'commander' }, slim = r => (r.unplayable.length || r.limited.length || r.missing.length) ? r : null;
  const v = { mine: slim(aihints.scan(j.decks[0], opt)), opp: j.decks.slice(1).map(d => slim(aihints.scan(d, opt))) };
  aiSeen.set(j.id, v); if (aiSeen.size > 500) aiSeen.delete(aiSeen.keys().next().value);
  return v;
}

// ---------- the numbers (score.js) ----------
// Every matchup counts this run's games plus those of earlier runs of the same version
// against the same opponent list (90% of the nonland cards the same), so a rerun adds
// evidence instead of replacing it. A run is never pooled with runs after it.
const SAME_LIST = 0.9;
const vecs = new WeakMap();
const vecOf = d => { let v = vecs.get(d); if (!v) { v = realdata.vec(d.main || []); vecs.set(d, v); } return v; };
const scored = new Map();
function scoreView(b, run, j, out) {
  const cal = out.calibration && Object.values(out.calibration.opp || {}).some(Boolean) ? out.calibration : null;
  // a beta's uncertainty: its evidence plus the pull toward zero it was fitted under
  const lam = cal ? cal.lambda : 2, meBeta = cal ? cal.me.beta : 0, meVar = cal && cal.me.near ? 1 / ((cal.me.evidence || 0) + lam) : 0;
  const shiftOf = (name, base, baseVar) => { const c = cal && cal.opp[name]; return c ? { d: c.beta - base, sd: Math.sqrt(1 / (c.evidence + lam) + baseVar) } : null; };
  const prs = j?.pairings || [];
  const earlier = !j || !j.decks ? [] : b.runs.filter(r => r !== run && r.v === run.v && r.created < run.created && r.jobId && r.opponents)
    .map(r => ({ r, rj: jobOf(r.jobId) })).filter(({ rj }) => rj && rj.decks && rj.pairings && (rj.decks[0].ai || null) === (j.decks[0].ai || null));
  let sig = run.id + '|' + (cal ? cal.at : 0);
  const opps = out.opponents.map((o, i) => {
    const ph = phasesOf(prs, i), pre = ph.pre ? { ...ph.pre.pd } : score.T0(), post = ph.post ? { ...ph.post.pd } : score.T0();
    const mine = j && j.decks && j.decks[i + 1];
    let runs = 0, boarded = !!ph.post;
    for (const { r, rj } of earlier) {
      const k = r.opponents.findIndex(x => x.name === o.name); if (k < 0 || !mine || !rj.decks[k + 1]) continue;
      if (realdata.overlap(vecOf(mine), vecOf(rj.decks[k + 1])) < SAME_LIST) continue;
      const eph = phasesOf(rj.pairings, k); if (!eph.pre || !eph.pre.played) continue;
      runs++; score.addT(pre, eph.pre.pd); if (eph.post) { score.addT(post, eph.post.pd); boarded = true; }
    }
    sig += '|' + score.nOf(pre) + ':' + score.wOf(pre) + ':' + score.nOf(post) + ':' + score.wOf(post);
    const shift = shiftOf(o.name, meBeta, meVar);
    o.pooled = runs ? { runs, pre: [score.wOf(pre), score.nOf(pre) - score.wOf(pre)], post: [score.wOf(post), score.nOf(post) - score.wOf(post)] } : null;
    return { name: o.name, w: o.metaPct != null ? o.metaPct : null, counted: !!shift || !o.style, pre, post: boarded ? post : null, boarded, shift };
  });
  // the field's #1 deck through the same opponents, over the ones both have played
  const bm = run.benchmarkId && benches.find(x => x.id === run.benchmarkId), bj = bm && jobOf(bm.jobId);
  if (bj && bj.pairings) sig += '|b' + bj.pairings.reduce((t, p) => t + played(p), 0);
  const apply = res => { Object.assign(out, res); out.opponents.forEach((o, i) => { o.score = res.scores[i] || null; }); return out; };
  if (scored.has(sig)) return apply(scored.get(sig));
  const sc = score.run(opps);
  const res = { score: sc && sc.overall ? { p: sc.overall.p, lo: sc.overall.lo, hi: sc.overall.hi, n: sc.overall.n, k: sc.overall.k, wtd: sc.overall.wtd, eta: sc.eta } : null,
    scores: sc ? sc.opp.map(x => x && { p: x.p, lo: x.lo, hi: x.hi, v: x.v, raw: x.raw, g1: x.g1, onPlay: x.onPlay, onDraw: x.onDraw, n: x.n, n1: x.n1, n2: x.n2, wt: x.wt, cal: x.cal, counted: x.counted }) : [], benchScore: null, event: null };
  let bt = null;
  if (sc && bj && bj.pairings) {
    const bBeta = cal && cal.opp[bm.names[0]] ? cal.opp[bm.names[0]].beta : 0, bVar = cal && cal.opp[bm.names[0]] ? 1 / (cal.opp[bm.names[0]].evidence + lam) : 0;
    const theirs = bm.names.slice(1).map((n, k) => { const ph = phasesOf(bj.pairings, k); return { name: n, ph }; }).filter(x => x.ph.pre && x.ph.pre.played);
    const shared = new Set(theirs.map(x => x.name).filter(n => { const i = out.opponents.findIndex(o => o.name === n); return i >= 0 && res.scores[i] && res.scores[i].counted; }));
    if (shared.size) {
      const a = score.run(opps.map(o => ({ ...o, counted: o.counted && shared.has(o.name) })));
      const t = score.run(theirs.filter(x => shared.has(x.name)).map(x => { const o = opps.find(y => y.name === x.name); return { name: x.name, w: o.w, counted: true, pre: x.ph.pre.pd, post: x.ph.post ? x.ph.post.pd : null, boarded: !!x.ph.post, shift: shiftOf(x.name, bBeta, bVar) }; }), { seed: 11 });
      const d = score.diff(a, t);
      if (d) res.benchScore = { k: shared.size, mine: { p: a.overall.p, lo: a.overall.lo, hi: a.overall.hi, n: a.overall.n }, theirs: { p: t.overall.p, lo: t.overall.lo, hi: t.overall.hi, n: t.overall.n }, edge: d };
      bt = score.tournament(t);
    }
  }
  // the tournament: the whole field (decks not played counted as even), top-8 odds, and
  // what bringing each losing matchup to even is worth. The #1 deck on the same footing:
  // its shared opponents as played, everything else even (its own mirror is even exactly).
  const ev = sc && score.tournament(sc);
  if (ev) {
    const levers = sc.opp.map((o, i) => o && o.counted && o.p < 0.5 ? { name: opps[i].name, p: o.p, ...score.lever(sc, ev, i) } : null).filter(Boolean).sort((a, b) => b.gain - a.gain);
    res.event = { rounds: ev.rounds, rest: ev.rest, field: ev.field, top8: ev.top8, levers, bench: null };
    if (bt) {
      const dd = Float64Array.from(ev.samples, (x, s) => x - bt.samples[s]);
      res.event.bench = { name: bm.names[0], field: bt.field, top8: bt.top8, edge: { p: dd.reduce((s, x) => s + x, 0) / dd.length, above: dd.filter(x => x > 0).length / dd.length } };
    }
  }
  scored.set(sig, res); if (scored.size > 500) scored.delete(scored.keys().next().value);
  return apply(res);
}
// How each card played, read from the game logs (cardstats.js). Yours: how often it
// was cast, on which turn, your win rate in games it was cast against games it
// wasn't, and the damage it dealt. Theirs: the opposing cards you lost to most.
// "Won when cast" carries selection bias (cards get cast in longer games, and in
// games already going well), the same caveat 17lands' numbers carry.
const MIN_CAST = 8;
function cardsView(b, run, prs) {
  const mine = cardstats.merge(prs.map(p => p.cards && p.cards[0]));
  if (!mine.games) return null;
  const ver = b.versions.find(x => x.v === run.v) || latest(b), land = new Map((ver.rows || []).map(r => [r.name, !!r.land]));
  const qty = new Map((ver.list.main || []).concat(ver.list.commander || []).map(c => [c.name, c.qty])), side = new Set((ver.list.side || []).map(c => c.name));
  const rate = (w, n) => n ? w / n : null;
  const rows = [...new Set([...qty.keys(), ...Object.keys(mine.cards)])].filter(n => !land.get(n) && !(mine.cards[n] && mine.cards[n].l) && (qty.has(n) || side.has(n))).map(n => {
    const c = mine.cards[n] || { c: 0, w: 0, t: 0, d: 0, x: 0 }, notN = mine.games - c.c;
    const won = rate(c.w, c.c), wonNot = rate(mine.wins - c.w, notN);
    return { name: n, qty: qty.get(n) || 0, side: !qty.has(n), cast: c.c, castPct: rate(c.c, mine.games), turn: c.c ? c.t / c.c : null, won, wonNot,
      lift: c.c >= MIN_CAST && notN >= MIN_CAST ? won - wonNot : null, dmg: c.d / mine.games, discards: c.x, ai: aihints.hintOf(n, forgeVersion()) };
  }).sort((x, y) => (x.side - y.side) || (y.castPct || 0) - (x.castPct || 0));
  // the cards that beat you: per opponent, your win rate in games they cast the card
  // against your overall rate in that matchup, weighted by how often they cast it
  const threats = [];
  if (b.seats === 2) (run.opponents || []).forEach((o, i) => {
    const ph = phasesOf(prs, i), th = cardstats.merge([ph.pre, ph.post].map(p => p && p.cards && p.cards[1]));
    if (!th.games) return;
    const base = (th.games - th.wins) / th.games;
    for (const [n, c] of Object.entries(th.cards)) {
      if (c.c < 5 || c.l) continue;
      const you = (c.c - c.w) / c.c;
      if (you < base) threats.push({ name: n, opp: o.name, cast: c.c, games: th.games, you, base, dmg: c.d / Math.max(1, c.c), cost: (base - you) * c.c / th.games * (o.metaPct || 1) });
    }
  });
  threats.sort((x, y) => y.cost - x.cost);
  return { games: mine.games, wins: mine.wins, mull: mine.mull / mine.games, minCast: MIN_CAST, rows, threats: threats.slice(0, 10) };
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
const brewView = b => ({ ...b, runs: b.runs.map(r => runView(b, r)), oppSets: oppSets(b), coachOn: claude.available() });

// ---------- the coach ----------
// A finished field run gets its readout written once (lazily, when its brew is
// next read). Swaps the model suggests are checked: cards out must be in the main
// deck, cards in must exist and be legal in the format, and the counts must match;
// a swap that fails the check becomes advice instead of a test button.
const coachBusy = new Set();
async function cleanSwap(b, ver, o) {
  if (o.kind !== 'swap') return { title: o.title, detail: o.detail, kind: 'note' };
  const main = new Map(ver.list.main.map(c => [c.name.toLowerCase(), c]));
  const outs = (o.out || []).map(c => { const m2 = main.get(String(c.name).toLowerCase()); return m2 && c.qty > 0 ? { qty: Math.min(c.qty, m2.qty), name: m2.name } : null; }).filter(Boolean);
  const find = await meta.cards((o.in || []).map(c => c.name));
  const ins = (o.in || []).map(c => { const k = find(c.name); return k && c.qty > 0 && k.legalities?.[b.format] === 'legal' ? { qty: Math.min(4, c.qty), name: meta.forgeName(k) } : null; }).filter(Boolean);
  const n = Math.min(ins.reduce((t, c) => t + c.qty, 0), outs.reduce((t, c) => t + c.qty, 0));
  const trim = l => { let k = n; return l.map(c => { const q = Math.min(c.qty, k); k -= q; return q ? { qty: q, name: c.name } : null; }).filter(Boolean); };
  return n ? { title: o.title, detail: o.detail, kind: 'swap', in: trim(ins), out: trim(outs) } : { title: o.title, detail: o.detail, kind: 'note' };
}
function coachWriteups(b) {
  if (!claude.available() || b.seats !== 2) return;
  // the newest finished run only; a failed writeup is tried again after ten minutes
  const run = b.runs.find(r => runView(b, r).status === 'done');
  if (!run || !run.field?.source || coachBusy.has(run.id) || (run.coach && !(run.coach.error && Date.now() - run.coach.at > 600e3))) return;
  coachBusy.add(run.id);
  (async () => {
    const rv = runView(b, run), ver = b.versions.find(x => x.v === run.v);
    const w = await usage.as({ who: b.owner, kind: 'readout', brew: b.id }, () => coach.writeup(b, rv));
    const options = await Promise.all((w.options || []).slice(0, 3).map(o => cleanSwap(b, ver, o)));
    run.coach = { weakness: String(w.weakness || '').slice(0, 120), weaknessNote: String(w.weaknessNote || '').slice(0, 600), options, at: Date.now() };
    (b.thread = b.thread || []).push({ role: 'coach', text: String(w.summary || '').slice(0, 2000), at: Date.now(), run: run.id, kind: 'writeup' });
    saveBrews();
  })().catch(e => { run.coach = { error: e.message, at: Date.now() }; saveBrews(); console.error('coach writeup:', e.message); }).finally(() => coachBusy.delete(run.id));
}
// The run the coach talks about: the newest one with games, else a stand-in with none.
function talkRun(b) {
  const r = b.runs.find(x => runView(b, x).played > 0);
  return r ? runView(b, r) : { v: latest(b).v, opponents: [], status: 'not run yet', played: 0, total: 0, field: null };
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
    // remote workers authenticate with SIM_WORKER_TOKEN, not a person's session
    if (p.startsWith('/api/worker/')) {
      if (!workerOk(req)) return send(res, 401, { error: WORKER_TOKEN ? 'bad worker token' : 'workers are off: set SIM_WORKER_TOKEN in .env' });
      const body = req.method === 'POST' ? await readBody(req) : {};
      const name = String(body.worker || 'worker').slice(0, 40);
      if (p === '/api/worker/claim' && req.method === 'POST') {
        workersSeen.set(name, { at: Date.now(), forge: body.forge || '?', playing: [...leases.values()].filter(l => l.worker === name).length });
        if (body.forge !== forgeVersion()) return send(res, 409, { error: `this server runs Forge ${forgeVersion()} and the worker runs ${body.forge}; install the same version on the worker` });
        if (engineKey(body.engine) !== engineKey(engine())) return send(res, 409, { error: `this server plays with engine ${engineKey(engine())} and the worker with ${engineKey(body.engine)}: copy the server's pilot.js and forge-pilot/ to the worker (and the same SIM_PILOT), rebuild the bridge, restart it` });
        const t = claim('remote:' + name); if (!t) return send(res, 204, '');
        if (t.job.engine && engineKey(t.job.engine) !== engineKey(body.engine)) { t.job.pending.unshift(t.i); t.job.inflight--; t.job.pairings[t.i].status = 'queued'; return send(res, 409, { error: `this run was started with engine ${engineKey(t.job.engine)}; the worker runs ${engineKey(body.engine)}` }); }
        const id = crypto.randomBytes(6).toString('hex');
        leases.set(id, { ...t, worker: name, engine: engineKey(body.engine), until: Date.now() + LEASE_MS });
        t.pr.seed = seedOf(t.job.id, t.i);
        return send(res, 200, { lease: id, job: t.job.id, pairing: t.i, decks: t.job.plan[t.i].decks, games: t.job.games, format: t.job.format, clock: t.job.clock, seed: t.pr.seed, log: logsJob(t.job), meta: { mode: t.job.mode, owner: t.job.owner, phase: t.job.plan[t.i].phase || null } });
      }
      if (p === '/api/worker/report' && req.method === 'POST') {
        const l = leases.get(String(body.lease || ''));
        if (!l) return send(res, 410, { cancel: true, error: 'that lease is gone' });
        const { job, pr } = l;
        if (l.engine && engineKey(body.engine) !== l.engine) { console.warn(`worker ${name} reported with engine ${engineKey(body.engine)}, claimed with ${l.engine}: refused`); return send(res, 409, { cancel: true, error: 'engine changed since the claim; results refused' }); }
        if (job.status === 'cancelled') { leases.delete(body.lease); pr.status = 'cancelled'; job.inflight--; settle(job); return send(res, 200, { cancel: true }); }
        const r = clean(body.results);
        if (r.wins) pr.wins = r.wins; pr.games = r.games; pr.draws = r.draws; pr.warnings = r.warnings; if (r.cards) pr.cards = r.cards;
        l.until = Date.now() + LEASE_MS;
        if (body.done) {
          leases.delete(body.lease); pr.status = body.code === 0 || r.games.length ? 'done' : 'failed'; pr.exit = body.code;
          job.inflight--; settle(job); pump();
        }
        return send(res, 200, { ok: true });
      }
      return send(res, 404, { error: 'not found' });
    }
    const user = await currentUser(req);
    if (!user) return send(res, 401, { error: 'login required' });

    // A card's picture: Scryfall's image CDN address from the card data the server already
    // fetched in one batch when the deck was made. The page used to ask Scryfall's exact-name
    // lookup for every picture, which is rate-limited hard: a deck page broke half its images.
    if (p === '/api/img') {
      const name = u.searchParams.get('name') || '', v = u.searchParams.get('v') === 'art_crop' ? 'art_crop' : 'normal';
      if (!name || name.length > 150) return send(res, 400, { error: 'name required' });
      const c = (await meta.cards([name]).catch(() => () => null))(name);
      const src = c && (c.image_uris?.[v] || c.card_faces?.[0]?.image_uris?.[v]);
      if (!src) return send(res, 404, { error: 'no image' });
      res.writeHead(302, { Location: src, 'Cache-Control': 'private, max-age=86400' });
      return res.end();
    }

    if (p === '/api/me') return send(res, 200, { ok: true, user, forge: forgeVersion(), forgeUpdate: user.isAdmin ? forgeUpdate() : null, spentToday: user.isAdmin ? usage.spent(D24) : null, maxGames: MAX_GAMES, goldfish: meta.GOLDFISH_FORMATS, top8: Object.keys(meta.TOP8_FORMATS) });

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
      const lastBody = await readBody(req), text = String(lastBody.text || '').trim();
      const deck = /^https?:\/\/\S+$/.test(text) ? await meta.importUrl(text) : meta.parseList(text);
      if (!deck.main?.length && !deck.commander?.length) return send(res, 400, { error: "That doesn't read as a decklist. One card per line, like \"4 Lightning Bolt\"." });
      const fmt = FORMATS.includes(String(lastBody.format || '').toLowerCase()) ? String(lastBody.format).toLowerCase() : 'standard';
      return send(res, 200, { ...(await meta.describeDeck({ main: deck.main || [], side: deck.side || [], commander: deck.commander || [] }, fmt)), importedName: deck.name || null });
    }
    if ((m = p.match(/^\/api\/brews\/(\w+)\/cover$/)) && req.method === 'GET') {
      const b = brews.find(x => x.id === m[1]); const f = b && b.coverUrl && path.join(DATA, 'covers', b.id + '.img');
      if (!f || !fs.existsSync(f)) return send(res, 404, 'no cover');
      return send(res, 200, fs.readFileSync(f), { 'Content-Type': b.coverType || 'image/jpeg', 'Cache-Control': 'private, max-age=86400' });
    }
    // Claude's sideboard plans against what real pilots of each archetype carry (realdata.sideboards).
    // Per deck: how much of the list's own sideboard is cards real pilots carry. Per pairing: the
    // share of each side's "in" copies that 15%+ of real pilots carry. The real files hold whole
    // sideboards, not per-matchup boarding, so this checks the plan's card choice, not its timing.
    if (p === '/api/plans/audit' && req.method === 'GET') {
      if (!user.isAdmin) return send(res, 403, { error: 'admins only' });
      const format = String(u.searchParams.get('format') || 'standard').toLowerCase(), real = calibs[format]?.sideboards;
      const rr = history.find(h => h.meta === format && h.owner === 'calibration' && h.status === 'done' && h.decks?.length);
      if (!real || !rr) return send(res, 404, { error: 'needs a finished calibration round robin and a refit with real sideboards' });
      const shareOf = (deck, n) => { const c = real[deck]?.cards.find(x => x.name.toLowerCase() === n.toLowerCase()); return c ? c.share : 0; };
      const side = (deck, list) => { const ins = list.map(c => ({ ...c, real: Math.round(shareOf(deck, c.name) * 100) / 100 })), n = ins.reduce((t, c) => t + c.qty, 0); return { cards: ins, agree: n ? ins.reduce((t, c) => t + (c.real >= 0.15 ? c.qty : 0), 0) / n : null }; };
      const decks = rr.decks.map(d => ({ name: d.name, pilots: real[d.name]?.pilots || 0, sideboard: side(d.name, d.side || []), realTop: (real[d.name]?.cards || []).slice(0, 8) }));
      const pairings = []; let agreeN = 0, agreeW = 0;
      for (let i = 0; i < rr.decks.length; i++) for (let j = i + 1; j < rr.decks.length; j++) {
        const pl = sideboard.peek(rr.decks[i], rr.decks[j]); if (!pl) continue;
        const a = side(rr.decks[i].name, pl.a.in), b = side(rr.decks[j].name, pl.b.in);
        for (const x of [[a, pl.a.in], [b, pl.b.in]]) if (x[0].agree != null && real[x[1] === pl.a.in ? rr.decks[i].name : rr.decks[j].name]) { const q = x[1].reduce((t, c) => t + c.qty, 0); agreeW += x[0].agree * q; agreeN += q; }
        pairings.push({ a: rr.decks[i].name, b: rr.decks[j].name, hinted: !!pl.hinted, aIn: a, bIn: b });
      }
      return send(res, 200, { format, roundRobin: rr.id, finished: rr.finished, realDays: REAL_DAYS, agreement: agreeN ? agreeW / agreeN : null, plannedCopies: agreeN, decks, pairings });
    }
    if (p === '/api/usage' && req.method === 'GET') {
      if (!user.isAdmin) return send(res, 403, { error: 'admins only' });
      return send(res, 200, { ...usage.summary(), limits: { runsPerDay: RUNS_PER_DAY, asksPerDay: ASKS_PER_DAY, dailyBudget: DAILY_BUDGET, spentToday: usage.spent(D24) } });
    }
    if (p === '/api/codex' && req.method === 'GET') return send(res, 200, await codex.index(await codexCtx(user)));
    // entry ids look like "card:sunderflock"; the page escapes the colon
    if ((m = p.match(/^\/api\/codex\/([\w%:-]+)$/)) && req.method === 'GET') { const e = await usage.as({ who: user.name, kind: 'codex' }, async () => codex.entry(decodeURIComponent(m[1]), await codexCtx(user))); return e ? send(res, 200, e) : send(res, 404, { error: 'no such entry' }); }
    if ((m = p.match(/^\/api\/codex\/([\w%:-]+)\/notes$/)) && req.method === 'POST') { const { t } = await readBody(req); const n = codex.addNote(decodeURIComponent(m[1]), user.name, t); return n ? send(res, 200, { notes: n }) : send(res, 400, { error: 'empty note' }); }
    if (p === '/api/brews' && req.method === 'GET') {
      const mine = brews.filter(b => b.owner === user.name); mine.forEach(coachWriteups);
      return send(res, 200, { brews: mine.map(brewView), queueLength: queue.length, bo3: sideboard.available(), limits: limitsFor(user) });
    }
    if (p === '/api/brews' && req.method === 'POST') {
      const { list, name, note, cover, format } = await readBody(req);
      const deck = { main: list?.main || [], side: list?.side || [], commander: list?.commander || [] };
      if (!validDeck(deck.main.length ? deck : { ...deck, main: deck.commander })) return send(res, 400, { error: 'that list has no cards' });
      const fmt = FORMATS.includes(String(format || '').toLowerCase()) ? String(format).toLowerCase() : 'standard';
      const d = await meta.describeDeck(deck, fmt);
      if (d.legality && !d.legality.ok) return send(res, 400, { error: meta.legalityError(d.legality), legality: d.legality });
      const now = Date.now(), id = crypto.randomBytes(5).toString('hex');
      // the cover: a card from the list (by name), or an uploaded image kept beside the data
      const pickCard = cover?.card && d.rows.some(r => r.name === cover.card && !r.land) ? cover.card : d.coverCard;
      let coverUrl = null;
      if (cover?.upload) { try { coverUrl = saveCover(id, cover.upload); } catch (e) { return send(res, 400, { error: e.message }); } }
      const b = { id, owner: user.name, name: String(name || d.coverCard.split(',')[0] || 'Untitled').trim().slice(0, 60) || 'Untitled', format: d.format, seats: d.format === 'commander' ? 4 : 2, created: now,
        coverCard: pickCard, coverUrl, colors: d.colors, notes: note && String(note).trim() ? [{ k: crypto.randomBytes(3).toString('hex'), t: String(note).trim().slice(0, 500) }] : [],
        versions: [{ v: 1, created: now, list: d.list, rows: d.rows, style: d.style }], runs: [] };
      setImmediate(() => readSoon(b, b.versions[0]));
      if (coverTypes[id]) b.coverType = coverTypes[id];
      brews.unshift(b); saveBrews();
      return send(res, 200, brewView(b));
    }
    if ((m = p.match(/^\/api\/brews\/(\w+)\/versions$/)) && req.method === 'POST') {
      const b = brews.find(x => x.id === m[1] && x.owner === user.name); if (!b) return send(res, 404, { error: 'no such brew' });
      const { list, note } = await readBody(req);
      const deck = { main: list?.main || [], side: list?.side || [], commander: list?.commander || [] };
      if (!validDeck(deck.main.length ? deck : { ...deck, main: deck.commander })) return send(res, 400, { error: 'that list has no cards' });
      const d = await meta.describeDeck(deck, b.seats === 4 ? null : b.format);
      if (d.legality && !d.legality.ok) return send(res, 400, { error: meta.legalityError(d.legality), legality: d.legality });
      if ((d.format === 'commander') !== (b.seats === 4)) return send(res, 400, { error: b.seats === 4 ? 'This brew is a Commander deck; that list has no commander.' : "That's a Commander list. Paste it as a new deck instead." });
      const prev = latest(b), diff = diffLists(prev.list, d.list);
      if (!diff.length) return send(res, 400, { error: `That's the same list as v${prev.v}.` });
      b.versions.push({ v: prev.v + 1, created: Date.now(), list: d.list, rows: d.rows, style: d.style, diff });
      readSoon(b, b.versions[b.versions.length - 1]);
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
      const vl = (b.versions.find(x => x.v === v) || {}).legal;
      if (vl && !vl.ok) return send(res, 400, { error: `v${v} is no longer ${b.format}-legal (${[...vl.illegal.map(x => x.name), ...vl.unknown].join(', ')}). Paste a new version without ${vl.illegal.length + vl.unknown.length === 1 ? 'it' : 'them'}; v${v}'s results stay.` });
      // a run is quiet while it reads the field, so a second click would start an identical one
      const dup = b.runs.find(r => r.v === v && r.oppSet === set.id && ['preparing', 'queued', 'running'].includes(runView(b, r).status));
      if (dup) return send(res, 409, { error: `v${v} is already running against that field. Cancel it first if you want to start over.` });
      const no = refusal(user, 'run'); if (no) return send(res, 429, { error: no });
      const run = { id: crypto.randomBytes(4).toString('hex'), v, oppSet: set.id, created: Date.now(), status: 'preparing' };
      b.runs.unshift(run); saveBrews(); usage.mark(user.name, 'run');
      prepareRun(b, run, user);
      return send(res, 200, brewView(b));
    }
    // ask the coach: the question goes in the thread now, the answer when it is written
    if ((m = p.match(/^\/api\/brews\/(\w+)\/ask$/)) && req.method === 'POST') {
      const b = brews.find(x => x.id === m[1] && x.owner === user.name); if (!b) return send(res, 404, { error: 'no such brew' });
      if (!claude.available()) return send(res, 400, { error: 'the coach needs an API key on the server' });
      if (b.thinking) return send(res, 409, { error: 'the coach is still answering' });
      const text = String((await readBody(req)).text || '').trim().slice(0, 2000); if (!text) return send(res, 400, { error: 'ask something' });
      const no = refusal(user, 'ask'); if (no) return send(res, 429, { error: no });
      usage.mark(user.name, 'ask');
      (b.thread = b.thread || []).push({ role: 'user', text, at: Date.now() }); b.thinking = true; saveBrews();
      usage.as({ who: user.name, kind: 'chat', brew: b.id }, () => coach.reply(b, talkRun(b), b.thread))
        .then(t => b.thread.push({ role: 'coach', text: t.slice(0, 6000), at: Date.now() }))
        .catch(e => b.thread.push({ role: 'coach', text: 'I couldn\'t answer that: ' + e.message, at: Date.now(), kind: 'error' }))
        .finally(() => { b.thinking = false; saveBrews(); });
      return send(res, 200, brewView(b));
    }
    // "Test it": the coach's swap becomes the next version and runs against the same kind of field
    if ((m = p.match(/^\/api\/brews\/(\w+)\/runs\/(\w+)\/test$/)) && req.method === 'POST') {
      const b = brews.find(x => x.id === m[1] && x.owner === user.name); if (!b) return send(res, 404, { error: 'no such brew' });
      const run = b.runs.find(r => r.id === m[2]); const i = (await readBody(req)).i | 0, o = run?.coach?.options?.[i];
      if (!o || o.kind !== 'swap') return send(res, 400, { error: 'nothing to test' });
      if (o.test) return send(res, 400, { error: 'already tested as v' + o.test.v });
      const no = refusal(user, 'run'); if (no) return send(res, 429, { error: no });
      const base = b.versions.find(x => x.v === run.v), main = new Map(base.list.main.map(c => [c.name, c.qty]));
      o.out.forEach(c => main.set(c.name, (main.get(c.name) || 0) - c.qty)); o.in.forEach(c => main.set(c.name, (main.get(c.name) || 0) + c.qty));
      const list = { ...base.list, main: [...main].filter(([, q]) => q > 0).map(([name, qty]) => ({ qty, name })) };
      const d = await meta.describeDeck(list, b.seats === 4 ? null : b.format), prev = latest(b), diff = diffLists(prev.list, d.list);
      if (d.legality && !d.legality.ok) return send(res, 400, { error: meta.legalityError(d.legality) });
      if (!diff.length) return send(res, 400, { error: 'that is the current list already' });
      b.versions.push({ v: prev.v + 1, created: Date.now(), list: d.list, rows: d.rows, style: d.style, diff, from: { run: run.id, option: i } });
      readSoon(b, b.versions[b.versions.length - 1]);
      const nr = { id: crypto.randomBytes(4).toString('hex'), v: prev.v + 1, oppSet: run.oppSet, created: Date.now(), status: 'preparing' };
      o.test = { v: nr.v, run: nr.id };
      b.runs.unshift(nr); saveBrews(); usage.mark(user.name, 'run');
      prepareRun(b, nr, user);
      return send(res, 200, brewView(b));
    }
    // rename a brew and/or change its cover: a card from its newest list, or a new upload
    if ((m = p.match(/^\/api\/brews\/(\w+)$/)) && req.method === 'PATCH') {
      const b = brews.find(x => x.id === m[1] && x.owner === user.name); if (!b) return send(res, 404, { error: 'no such brew' });
      const { name, cover } = await readBody(req);
      if (name != null) { const n = String(name).trim().slice(0, 60); if (!n) return send(res, 400, { error: 'give it a name' }); b.name = n; }
      if (cover?.upload) {
        try { b.coverUrl = saveCover(b.id, cover.upload) + '?v=' + Date.now(); b.coverType = coverTypes[b.id]; } catch (e) { return send(res, 400, { error: e.message }); }
      } else if (cover?.card) {
        if (!(latest(b).rows || []).some(r => r.name === cover.card && !r.land)) return send(res, 400, { error: 'that card isn\'t in the list' });
        b.coverCard = cover.card;
        if (b.coverUrl) { b.coverUrl = null; delete b.coverType; try { fs.unlinkSync(path.join(DATA, 'covers', b.id + '.img')); } catch {} }
      }
      saveBrews();
      return send(res, 200, brewView(b));
    }
    // cancel one run: its job stops (or leaves the queue); a run still reading the field is marked so it never queues
    if ((m = p.match(/^\/api\/brews\/(\w+)\/runs\/(\w+)\/cancel$/)) && req.method === 'POST') {
      const b = brews.find(x => x.id === m[1] && x.owner === user.name); if (!b) return send(res, 404, { error: 'no such brew' });
      const run = b.runs.find(r => r.id === m[2]); if (!run) return send(res, 404, { error: 'no such run' });
      const j = run.jobId && jobs.get(run.jobId);
      if (j) cancelJob(j);
      if (run.status === 'preparing') run.status = 'cancelled';
      run.cancelled = true; saveBrews();
      return send(res, 200, brewView(b));
    }
    // delete a brew: stop its runs, drop its cover, forget it
    if ((m = p.match(/^\/api\/brews\/(\w+)$/)) && req.method === 'DELETE') {
      const b = brews.find(x => x.id === m[1] && x.owner === user.name); if (!b) return send(res, 404, { error: 'no such brew' });
      for (const j of jobs.values()) if (j.brew === b.id) cancelJob(j);
      try { fs.unlinkSync(path.join(DATA, 'covers', b.id + '.img')); } catch {}
      brews = brews.filter(x => x !== b); saveBrews();
      return send(res, 200, { ok: true });
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
        if (j) cancelJob(j);
        return send(res, 200, { ok: true });
      }
      if (j) return send(res, 200, { ...publicJob(j), queuePos: waitPos(j) });
      const h = history.find(x => x.id === m[1]);
      return h ? send(res, 200, { ...h, fromHistory: true }) : send(res, 404, { error: 'no such job' });
    }
    if ((m = p.match(/^\/api\/jobs\/(\w+)\/log$/))) { const j = jobs.get(m[1]); return send(res, 200, (j?.log || []).join('\n')); }
    if (p === '/api/jobs') return send(res, 200, { running: queue.filter(j => j.status === 'running').map(publicJob), queued: queue.filter(j => j.status === 'queued').map(publicJob), players: { local: SLOTS, busy: localBusy, workers: [...workersSeen].map(([name, w]) => ({ name, ...w })) }, history: history.slice(0, 50).map(({ decks, ...h }) => h) });
    return send(res, 404, { error: 'not found' });
  } catch (e) {
    console.error(p, e.message);
    return send(res, 502, { error: e.message });
  }
});
server.listen(PORT, HOST, () => console.log(`sim listening on ${HOST}:${PORT}, engine ${engineKey(engine())}, accounts via ${STARSHARD_API}\n${config.describe('server')}`));
backfill().catch(e => console.error('backfill:', e.message));
// calibration: refit from what is on disk, then queue anything due, then check every six hours
for (const f of new Set(history.filter(h => h.meta).map(h => h.meta))) refit(f).catch(e => console.error('refit:', e.message));
setTimeout(() => calibrateDue(), 60e3); setInterval(() => calibrateDue(), 6 * 3600e3);
