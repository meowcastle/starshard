// sim.starshard.net — tiny API + static UI around Forge's headless simulator.
// No dependencies: Node's http, fetch and built-in SQLite only.
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
const leaks = require('./leaks');
const weekly = require('./weekly');
const accounts = require('./accounts');
const mail = require('./mail');
const collection = require('./collection');
const shell = require('./shell');
const push = require('./push');
const calib = require('./calib');
const aihints = require('./aihints');
const codex = require('./codex');
const coach = require('./coach');
// What the player tells the coach (COACH-PARAMETERS-13OCT.md part 1): the goal, what is fixed, how much
// explanation. Stored on the brew; every field optional, cleaned here.
const EVENTS = { rcq: { rounds: 7, bo3: true, label: 'competitive Standard tournament' }, store: { rounds: 5, bo3: true, label: 'store championship' }, fnm: { rounds: 4, bo3: true, label: 'Friday Night Magic' }, 'arena-bo3': { rounds: 7, bo3: true, label: 'Arena best-of-three ladder', noTop8: true }, 'arena-bo1': { rounds: 7, bo3: false, label: 'Arena best-of-one ladder', noTop8: true }, none: { rounds: 7, bo3: true, label: 'no particular event' } };
const cardNames = v => (Array.isArray(v) ? v : String(v || '').split(/[,\n]/)).map(x => String(x).trim()).filter(Boolean).slice(0, 40).map(x => x.slice(0, 120));
function cleanSettings(x = {}, prev = {}) {
  const g = { ...(prev.goal || {}), ...(x.goal || {}) };
  const out = {
    goal: {
      event: EVENTS[g.event] ? g.event : 'rcq',
      date: /^\d{4}-\d{2}-\d{2}$/.test(g.date || '') ? g.date : null,
      rounds: Number.isInteger(+g.rounds) && +g.rounds >= 3 && +g.rounds <= 15 ? +g.rounds : null,
      posture: g.posture === 'ceiling' ? 'ceiling' : 'consistent',
    },
    keep: x.keep !== undefined ? cardNames(x.keep) : prev.keep || [],
    never: x.never !== undefined ? cardNames(x.never) : prev.never || [],
    budget: x.budget !== undefined ? (x.budget && typeof x.budget === 'object' ? { paper: x.budget.paper != null ? Math.max(0, +x.budget.paper || 0) : null, // wildcards left the budget (change 26)
      // the Cards dial (change 22): owned only, up to $usd, or anything
      mode: ['owned', 'usd', 'any'].includes(x.budget.mode) ? x.budget.mode : 'any', usd: x.budget.mode === 'usd' ? Math.max(0, +x.budget.usd || 0) : null } : null) : prev.budget || null,
    level: ['learning', 'competitive', 'grinder'].includes(x.level) ? x.level : prev.level || 'competitive',
  };
  return out;
}
const settingsOf = b => cleanSettings({}, b.settings || {});
const roundsOf = b => { const s = settingsOf(b); return s.goal.rounds || EVENTS[s.goal.event].rounds; };

// the formats a brew can be created in (COACH-PARAMETERS-13OCT.md part 2); Standard is the default
// (Commander comes from the list itself: a list with a commander is a Commander brew)
const FORMATS = ['standard', 'pioneer', 'modern', 'legacy', 'vintage'];
const planner = require('./plan');
const cardSearch = require('./cards');
const claude = require('./claude');

const PORT = config.PORT;
const DATA = config.DATA_DIR;
const HOST = config.HOST;
// Logins (14 Oct 2026, Justin: anyone who reaches the site can sign up): a simulator account (a name and a
// password, kept in the sim's own database, accounts.js) on the free plan, or, for the founders on
// SIM_USERS, their Star Shard login, which the sim checks with the Star Shard API (same NAS, loopback only)
// once at sign-in. Either way the sim then keeps its own session; the Star Shard token isn't stored.
const STARSHARD_API = config.STARSHARD_API.replace(/\/$/, '');
const ALLOWED = config.SIM_USERS.map(x => x.toLowerCase());   // the founders: Star Shard usernames that sign in with Star Shard; "*" = any Star Shard account
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
// The sim's own database: accounts, sessions, plans and the credits ledger (accounts.js).
const A = accounts.open(path.join(DATA, 'sim.db'), { runsPerDay: RUNS_PER_DAY, asksPerDay: ASKS_PER_DAY });
const planOfName = name => { const a = A.accountByName(name); return A.planOf(a ? a.plan : 'founder'); };
function limitsFor(user) {
  if (user.isAdmin) return null;
  const f = A.planOf(user.plan).features;
  // a run that never played a game (lost in a restart, or failed before it started) doesn't use up the day's runs:
  // that's our failure, not the player's use (16 Oct 2026)
  const wasted = kind => kind !== 'run' ? 0 : brews.filter(b => b.owner === user.name).reduce((n, b) => n + b.runs.filter(r => !r.weekly && Date.now() - r.created < D24).filter(r => { const rv = runView(b, r); return ['lost', 'failed'].includes(rv.status) && !rv.played; }).length, 0);
  const left = (kind, cap) => { if (cap == null) return null; const t = usage.events(user.name, kind, D24).sort((a, b) => a - b).slice(wasted(kind)); return { cap, left: Math.max(0, cap - t.length), freeIn: t.length >= cap ? t[t.length - cap] + D24 - Date.now() : 0 }; };
  return { plan: user.plan, runs: left('run', f.runsPerDay), asks: left('ask', f.asksPerDay), budget: DAILY_BUDGET > 0 && usage.spent(D24) >= DAILY_BUDGET };
}
// null if allowed, else the sentence to show
function refusal(user, kind) {
  const l = limitsFor(user); if (!l) return null;
  if (l.budget) return 'The sim has spent its model budget for today. Try again tomorrow, or ask Justin.';
  const x = kind === 'run' ? l.runs : l.asks;
  return !x || x.left ? null : `That's your ${x.cap === 1 ? 'one' : x.cap} ${kind === 'run' ? 'run' : 'question'}${x.cap === 1 ? '' : 's'} for today. The next one frees up in ${inTime(x.freeIn)}.`;
}
const forgeUpdate = () => forgeLatest && newer(forgeLatest.version, forgeVersion()) ? forgeLatest : null;
fs.mkdirSync(path.join(DATA, 'jobs'), { recursive: true });
if (!ALLOWED.length) console.warn('SIM_USERS is empty, so nobody can sign in. Add Star Shard usernames to .env.');

const COOKIE = 'sim_session';
const allowed = u => ALLOWED.includes('*') || ALLOWED.includes(u.toLowerCase());
const tokenOf = req => { const c = (req.headers.cookie || '').match(/(?:^|;\s*)sim_session=([^;]+)/); return c && decodeURIComponent(c[1]); };
const clientIp = req => (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;
const isAdminName = n => ADMINS.includes(String(n).toLowerCase());
// a session's person; a founder taken off SIM_USERS loses access, a simulator account keeps it
function userOf(s) {
  if (!s || (s.source === 'starshard' && !allowed(s.name))) return null;
  return { name: s.name, accountId: s.accountId, plan: s.plan, source: s.source, isAdmin: s.source === 'starshard' && isAdminName(s.name) };
}
async function currentUser(req) {
  const token = tokenOf(req); if (!token) return null;
  const s = A.session(token); if (s) return userOf(s);
  // a cookie from before the sim kept its own sessions holds the Star Shard token itself: Star Shard checks
  // it once, then it carries on as a sim session (the founders stay signed in across this change)
  const id = accounts.starshardId(token); if (id == null) return null;
  let me; try { const r = await fetch(STARSHARD_API + '/api/me', { headers: { Cookie: `starshard_session=${token}` } }); if (!r.ok) return null; me = await r.json(); } catch { return null; }
  if (!me.username || !allowed(me.username)) return null;
  let a; try { a = A.accountFor({ id, name: me.username, admin: isAdminName(me.username) }); } catch { return null; }
  A.startSession(a.id, token);
  return userOf(A.session(token));
}
// The Account tab's account (work order §4, changes 13 and 15): plan, balance, the ledger with the balance
// after each row, and the address with its mail settings. No packs until Stripe is connected.
function accountView(user) {
  const a = A.account(user.accountId), plan = A.planOf(a.plan), bal = A.balance(a.id);
  // the page's plan table reads limits.decks/runsPerDay/asksPerDay and features.share (change 13); they ride beside
  // the live counts (runs/asks: cap, left, freeIn) and the plan's own names (brews, sharing). An admin's limits stay null.
  const lim = limitsFor(user);
  return { name: a.name, source: a.source, since: a.created, plan: { code: plan.code, name: plan.name, charges: plan.charges, features: { ...plan.features, share: plan.features.sharing } },
    balance: bal, minutes: bal, packs: [], ledger: A.statement(a.id), limits: lim && { ...lim, decks: plan.features.brews, runsPerDay: plan.features.runsPerDay, asksPerDay: plan.features.asksPerDay },
    email: a.email || null, mailable: !!a.mailable, mail: A.mailOf(a),
    note: plan.code === 'founder' ? "Founders' plan · free while the sim is calibrated · thank you for the logs." : plan.code === 'free' ? `Free plan · ${plan.features.runsPerDay} run and ${plan.features.asksPerDay} coach questions a day, one deck, the top 10.` : null };
}
// Sign-in and sign-up tries per address: 10 failed sign-ins in 15 minutes, 5 sign-ups an hour.
const tries = new Map();
function tooMany(kind, ip, max, ms) { const k = kind + ':' + ip, t = (tries.get(k) || []).filter(x => Date.now() - x < ms); tries.set(k, t); return t.length >= max; }
const tried = (kind, ip) => { const k = kind + ':' + ip; tries.set(k, [...(tries.get(k) || []), Date.now()]); };
setInterval(() => { for (const [k, t] of tries) if (!t.some(x => Date.now() - x < 3600e3)) tries.delete(k); }, 600e3);
const sessionCookie = token => ({ 'Set-Cookie': `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 86400}` });

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
  // a person's run goes ahead of benchmark and calibration jobs, which nobody is waiting on (16 Oct 2026: a
  // benchmark gauntlet held the worker's slots for an hour while a user run sat behind it)
  const people = from.filter(j => j.brew); if (people.length) from = people;
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
  if (job.brew) try { settleRuns(); } catch (e) { console.error('settle:', e.message); }
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
// a person's run waits only behind other people's runs (claim() serves them before benchmark and calibration jobs)
const waitPos = j => !(j && jobs.has(j.id) && j.status === 'queued') ? -1 : queue.filter(x => x.status === 'queued' && (!j.brew || x.brew && !x.low)).indexOf(j);
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
// every founder and every existing deck owner holds their name, so no sign-up can take it, or their decks
for (const n of new Set([...ALLOWED.filter(x => x !== '*'), ...ADMINS, ...brews.map(b => b.owner)])) A.reserveName(n);
const saveBrews = () => writeJson(BREWS, brews);
// ---------- live runs survive a restart (16 Oct 2026) ----------
// Jobs live in memory, so a restart (every NAS rebuild) used to turn every queued or running run into "lost"
// ("Stopped at game 0") and fail any Optimize waiting on one. The jobs people wait on (a brew's runs) are now
// written to jobs-live.json every few seconds and on SIGTERM, and go back in the queue at start. A pairing that
// was mid-game starts over; finished pairings keep their games. Calibration and benchmark jobs aren't kept:
// their own schedulers queue them again. A run still reading decklists is read again instead of failed.
const LIVE = path.join(DATA, 'jobs-live.json');
const keepLive = j => !!j.brew && !j.finished && j.status !== 'cancelled';
const blankPairing = pr => ({ ...pr, status: 'queued', where: null, wins: pr.names.map(() => 0), draws: 0, games: [], warnings: [], cards: null });
function saveLive() {
  const live = queue.filter(keepLive).map(j => {
    const { children, log, onDone, ...rest } = j;
    const midGame = j.pairings.map((p, i) => p.status === 'running' ? i : -1).filter(i => i >= 0);
    return { ...rest, inflight: 0, pending: [...midGame, ...j.pending], pairings: j.pairings.map(p => p.status === 'running' ? blankPairing(p) : p) };
  });
  try { writeJson(LIVE, live, { keep: 0 }); } catch (e) { console.error('jobs-live:', e.message); }
}
function restoreLive() {
  let n = 0;
  for (const j of readJson(LIVE, [], { keep: 0 })) {
    if (jobs.has(j.id) || history.some(h => h.id === j.id)) continue;
    const b = brews.find(x => x.id === j.brew), run = b && b.runs.find(r => r.jobId === j.id);
    if (!run || run.cancelled) continue;
    Object.assign(j, { children: new Set(), log: [], inflight: 0, status: j.started ? 'running' : 'queued' }, j.low ? { onDone: () => weeklyFinish() } : {});
    jobs.set(j.id, j); queue.push(j); n++;
    (b.thread = b.thread || []).push({ role: 'coach', kind: 'note', text: `The sim restarted; v${run.v}'s run is back in the queue and picks up where it was.`, at: Date.now() });
  }
  if (n) saveBrews();
  for (const b of brews) for (const r of b.runs) if (r.status === 'preparing' && !r.jobId && !r.cancelled) { n++; prepareRun(b, r, { name: b.owner }, { low: !!r.weekly }); }
  if (n) console.log(`restored ${n} run${n === 1 ? '' : 's'} from before the restart`);
  pump();
}
setInterval(saveLive, 5000).unref();
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => { saveLive(); for (const j of jobs.values()) for (const c of j.children || []) try { c.kill('SIGKILL'); } catch {} process.exit(0); });
// an answer that was being written when the process stopped will not arrive
brews.forEach(b => { if (b.thinking) { b.thinking = false; (b.thread = b.thread || []).push({ role: 'coach', text: 'I lost that question when the simulator restarted. Ask again?', at: Date.now(), kind: 'error' }); } });
const GAMES = 20;            // per pairing; the UI says "20 games each"
const LOAD_SECONDS = 30;     // Forge reads its card database once per pairing
const latest = b => b.versions[b.versions.length - 1];
// The deck is the version the player chose, not the newest one (16 Oct 2026, NOTE-TO-CODE-16OCT-STATE.md A).
// b.current: a version the player saves (pasted, edited) becomes current; Optimize, a coach swap test and the
// owned version are proposals and never change it. Runs, the plan, the guide and the coach default to current.
// Every version says where it came from (origin), and numbers never repeat, even after a discard (b.maxV).
const current = b => b.versions.find(x => x.v === b.current) || latest(b);
const PROPOSALS = new Set(['optimize', 'coach', 'owned']);
const originOf = v => v.origin || (v.v === 1 ? 'pasted' : /^Optimize/.test(v.note || '') ? 'optimize' : v.from && v.from.run ? 'coach' : /^owned version/.test(v.note || '') ? 'owned' : 'edited');
function pushVersion(b, origin, fields) {
  const v = Math.max(b.maxV || 0, ...b.versions.map(x => x.v)) + 1; b.maxV = v;
  const ver = { v, created: Date.now(), origin, ...fields }; b.versions.push(ver);
  if (!PROPOSALS.has(origin)) b.current = v;
  return ver;
}
{ let moved = 0;
  for (const b of brews) { for (const v of b.versions) if (!v.origin) { v.origin = originOf(v); moved++; }
    if (b.maxV == null) { b.maxV = Math.max(...b.versions.map(v => v.v)); moved++; }
    if (b.current == null) { const mine = b.versions.filter(v => !PROPOSALS.has(v.origin)); b.current = (mine[mine.length - 1] || latest(b)).v; moved++; } }
  if (moved) saveBrews(); }

function secondsPerGame(pod) {
  const ms = history.filter(h => (h.format === 'Commander') === pod).flatMap(h => h.pairings || []).filter(p => p.avgMs).slice(0, 50).map(p => p.avgMs);
  return ms.length ? ms.reduce((a, b) => a + b, 0) / ms.length / 1000 : pod ? 41 : 14;
}
const fmtTime = s => s < 3600 ? `~${Math.max(1, Math.round(s / 60))} min` : `~${(s / 3600).toFixed(1)} h`;
// Whose decks a person may see: the founders see each other's (the team); anyone on another plan sees only
// their own. Strangers who signed up never see each other's lists.
const founderName = n => planOfName(n).code === 'founder';
const canSee = (viewer, owner) => viewer === owner || (founderName(viewer) && founderName(owner));
const teamFor = b => brews.filter(o => o.owner !== b.owner && o.format === b.format && canSee(b.owner, o.owner)).slice(0, b.seats === 4 ? 3 : 12);
const ASK_CREDITS = 5;   // a coach question's Opus call, in credits (work order §3)

// The opponent sets the run picker offers for this brew.
function oppSets(b) {
  // a best-of-three run plays game 1 and the boarded games as separate pairings
  const pod = b.seats === 4, per = (LOAD_SECONDS + GAMES * secondsPerGame(pod)) * (!pod && sideboard.available() ? 2 : 1), team = teamFor(b);
  const teamSet = { id: 'team', title: `My pod · ${team.length} team deck${team.length === 1 ? '' : 's'}`, detail: team.length ? team.map(o => `${o.owner}'s ${o.name}`).join(', ') + '.' : `No other member has a ${b.format} brew yet.`, time: team.length ? fmtTime(per) : '', available: team.length > 0, n: team.length };
  // credits: about a minute of simulator time each (work order §3); the plan decides which sets are open
  const f = planOfName(b.owner).features;
  const priced = sets => sets.map(x => ({ ...x, credits: Math.ceil(x.n * per / 60) })).map(x => f.fields.includes(x.id) || !x.available ? x
    : { ...x, available: false, detail: x.id === 'team' ? "Team decks aren't on the free plan." : "The top 20 isn't on the free plan; the top 10 is." });
  if (pod) return priced([{ id: 'meta20', title: 'The field · top 3 commanders', detail: 'EDHREC, this week. Average decks, one pod.', time: fmtTime(per), available: true, n: 3 }, teamSet]);
  if (!meta.GOLDFISH_FORMATS.includes(b.format)) return priced([{ id: 'meta20', title: 'The field', detail: `No metagame source for ${b.format}.`, time: '', available: false, n: 0 }, teamSet]);
  return priced([
    { id: 'meta20', title: 'The field · top 20', detail: `MTGGoldfish ${b.format}, read when you queue. Weighted by meta share.`, time: fmtTime(20 * per), available: true, n: 20 },
    { id: 'meta10', title: 'The field · top 10', detail: 'Same source, the decks you will actually face.', time: fmtTime(10 * per), available: true, n: 10 },
    teamSet,
  ]);
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
async function prepareRun(b, run, user, { low = false, onDone = null } = {}) {
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
    // a craft test (change 20) carries its own list: the version with one card swapped, never saved as a version
    const v = run.list ? { list: run.list, style: (b.versions.find(x => x.v === run.v) || {}).style } : b.versions.find(x => x.v === run.v);
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
    // a weekly rerun waits behind people's runs, like calibration, and is compared with the last run when it finishes
    const job = enqueue({ mode: b.seats === 4 ? 'matchup' : 'gauntlet', decks, post, games: GAMES, format: b.seats === 4 ? 'Commander' : 'Constructed', clock: CLOCK_S, owner: user.name, brew: b.id, ...(low ? { low: true, onDone: onDone || (() => weeklyFinish()) } : {}) });
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
  return { brews: brews.filter(b => b.format === format && canSee(user.name, b.owner)), field: field.map(d => ({ name: d.name, main: d.main, side: d.side || [] })), shares, me: user.name,
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
  const out = { id: run.id, v: run.v, oppSet: run.oppSet, created: run.created, started: j?.started || null, finished: j?.finished || null, status: status2, error: run.error || null, queuePos: waitPos(j), games: GAMES, field: run.field || null, skipped: run.skipped || [], bo3: run.bo3 || null, planErrors: run.planErrors || 0, planError: run.planError || null, ...(run.weekly ? { weekly: true } : {}) };
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
  let sig = run.id + '|' + (cal ? cal.at : 0) + '|' + roundsOf(b);
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
      bt = score.tournament(t, { rounds: roundsOf(b) });
    }
  }
  // the tournament: the whole field (decks not played counted as even), top-8 odds, and
  // what bringing each losing matchup to even is worth. The #1 deck on the same footing:
  // its shared opponents as played, everything else even (its own mirror is even exactly).
  const ev = sc && score.tournament(sc, { rounds: roundsOf(b) });
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
  const ver = b.versions.find(x => x.v === run.v) || current(b), land = new Map((ver.rows || []).map(r => [r.name, !!r.land]));
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
// the coach's ledger: each tested suggestion, the version it became, and what the headline did
function ledgerOf(b) {
  const out = [];
  for (const r of b.runs) for (const o of (r.coach && r.coach.options) || []) {
    if (!o.test) continue;
    const before = runView(b, r).score, tr = b.runs.find(x => x.id === o.test.run), after = tr ? runView(b, tr).score : null;
    out.push({ title: o.title, change: [...(o.out || []).map(c => '-' + c.qty + ' ' + c.name), ...(o.in || []).map(c => '+' + c.qty + ' ' + c.name)].join(', '), v: o.test.v, from: r.v,
      before: before ? { p: before.p, lo: before.lo, hi: before.hi } : null, after: after ? { p: after.p, lo: after.lo, hi: after.hi } : null,
      verdict: !before || !after ? 'not finished' : after.lo > before.hi ? 'better, outside the noise' : after.hi < before.lo ? 'worse, outside the noise' : 'inside the noise' });
  }
  return out;
}
// what the coach reads beside the run: the player's settings, the event they mean, and the ledger
const coachRun = (b, rv) => { const st = settingsOf(b); return { ...rv, settings: st, eventInfo: { ...EVENTS[st.goal.event], rounds: roundsOf(b) }, ledger: ledgerOf(b), collection: coachCollection(b, rv), check: (b.versions.find(x => x.v === rv.v) || latest(b)).check || null }; };
// what the coach is told about the paper collection: what's held, and what this version's list is short of, priced
function coachCollection(b, rv) {
  const paper = collection.get(b.owner).paper; if (!paper) return null;
  const ver = b.versions.find(x => x.v === rv.v) || current(b), BASICS = /^(plains|island|swamp|mountain|forest|wastes)$/i;
  const missing = ver.list.main.filter(c => !BASICS.test(c.name) && (paper.cards[c.name] || 0) < c.qty).map(c => ({ qty: c.qty - (paper.cards[c.name] || 0), name: c.name, price: meta.cardFacts(c.name).price }));
  return { owned: paper.cards, size: paper.size, missing };
}
// The player's own games with a brew (Design's change 8), from Arena logs the Mac worker sends:
// b.realMatches keeps one row per match; the page reads this summary.
const BASIC = /^(Plains|Island|Swamp|Mountain|Forest|Wastes)$/;
// the version a real match was played with: the one holding most of the cards the player showed (main or
// sideboard); on a tie the current version, then the newest. It used to be the newest, which filed Justin's
// v3 games (17 Oct) on v5, an Optimize proposal he never played.
function playedV(b, cards) {
  const share = v => { const s = new Set([...v.list.main, ...(v.list.side || [])].map(c => c.name)); return cards.filter(n => s.has(n)).length; };
  let best = current(b), bs = share(best);
  for (const v of [...b.versions].reverse()) { const n = share(v); if (n > bs) { best = v; bs = n; } }
  return best.v;
}
function realOf(b) {
  const ms = b.realMatches || []; if (!ms.length) return null;
  const by = new Map();
  for (const m of ms) { const k = m.opponent || 'Unknown', o = by.get(k) || { name: k, wins: 0, losses: 0 }; m.won ? o.wins++ : o.losses++; by.set(k, o); }
  // where each match was played: a hand-logged one says so, a parsed one by its Arena event
  const where = m => m.source === 'manual' ? m.event : /bo3|best_of_three|traditional/i.test(m.event || '') ? 'Arena Bo3' : 'Arena Bo1';
  const places = [...new Set(ms.map(where))];
  return { wins: ms.filter(m => m.won).length, losses: ms.filter(m => !m.won).length, matches: ms.length,
    source: places.length === 1 ? places[0] : places.includes('Paper') ? 'Arena and paper' : 'Arena Bo1 and Bo3', since: ms.map(m => m.at).filter(Boolean).sort()[0]?.slice(0, 10) || null, byOpponent: [...by.values()],
    leaks: ms.some(m => m.leaks) ? leaks.view(leaks.merge(ms.map(m => m.leaks))) : null };
}
// The relative headline (research's method review, point C; approved 15 Oct 2026). Forge spreads the decks far
// wider than real play does, so a brew's raw sim rate overstates how good or bad it is. Its headline is the
// nearest meta deck's REAL match rate plus the sim's difference between the brew and that deck against the
// same opponents: Forge pilots both, so most of its bias cancels in the difference. Per opponent the two
// game rates become best-of-three rates; opponents weigh by meta share where known. Null without a nearest
// deck that has real results and sim games against at least three of the run's opponents.
let fpCache = { at: 0, by: {} };
const forgePairsSoon = f => { if (Date.now() - fpCache.at > 60e3) fpCache = { at: Date.now(), by: {} }; return fpCache.by[f] = fpCache.by[f] || forgePairs(f); };
function relativeOf(b, rv) {
  const c = calibs[b.format], ver = b.versions.find(x => x.v === rv.v), near = ver && ver.reading && ver.reading.nearest && ver.reading.nearest.name;
  // the real rate: against the whole field where published, else head-to-head against the field decks, whichever has more matches
  let real = near && c && c.realField && c.realField[near];
  if (near && c && c.inputs && c.inputs.real) { let w = 0, l = 0; for (const [key, r] of Object.entries(c.inputs.real)) { const [a, x] = key.split('\u0000'); if (a === x) continue; if (a === near) { w += r[0]; l += r[1]; } else if (x === near) { w += r[1]; l += r[0]; } } if (w + l > (real ? real.w + real.l : 0)) real = { w, l, vs: 'field decks' }; }
  if (!real || !rv.opponents || real.w + real.l < 20) return null;
  const fp = forgePairsSoon(b.format), sm = (w, n) => (w + 0.5) / (n + 1), m3 = p => p * p * (3 - 2 * p), slope = p => 6 * p * (1 - p);
  let W = 0, D = 0, V = 0, k = 0, games = 0;
  for (const o of rv.opponents) {
    const w = o.wins[0] + (o.post ? o.post.wins[0] : 0), n = w + o.wins[1] + (o.post ? o.post.wins[1] : 0);
    let nw, nn;
    if (o.name === near) { nw = 1; nn = 2; }   // the nearest deck's own mirror is even
    else { const x = fp[calib.pairKey(near, o.name)]; if (!x) continue; nw = near < o.name ? x[0] : x[1]; nn = x[0] + x[1]; }
    if (n < 6 || nn < 6) continue;
    const pb = sm(w, n), pn = sm(nw, nn), wt = o.metaPct != null && o.metaPct > 0 ? o.metaPct : 1;
    W += wt; D += wt * (m3(pb) - m3(pn)); V += wt * wt * (slope(pb) ** 2 * pb * (1 - pb) / n + (o.name === near ? 0 : slope(pn) ** 2 * pn * (1 - pn) / nn)); k++; games += n;
  }
  if (k < 3) return null;
  const rp = real.w / (real.w + real.l), rv2 = rp * (1 - rp) / (real.w + real.l), d = D / W, dv = V / (W * W);
  const clip = x => Math.max(0.01, Math.min(0.99, x)), p = clip(rp + d), half = 1.96 * Math.sqrt(rv2 + dv);
  return { near, real: { p: rp, matches: real.w + real.l, vs: real.vs },
    difference: { p: d, lo: d - 1.96 * Math.sqrt(dv), hi: d + 1.96 * Math.sqrt(dv), opponents: k, games },
    p, lo: clip(p - half), hi: clip(p + half), raw: rv.score ? rv.score.p : null };
}
// a match's leak counts as the worker sends them (leaks.tally), kept to numbers and short moments: match ids
// are 8 characters and no opponent name is in them
function leaksIn(t) {
  if (!t || typeof t !== 'object' || !t.acc) return null;
  const n = x => Math.max(0, Math.min(1e5, +x || 0));
  return { grade: n(t.grade), games: n(t.games), wins: n(t.wins), turns: n(t.turns), acc: Object.fromEntries(leaks.KEYS.map(k => [k, Array.isArray(t.acc[k]) ? [n(t.acc[k][0]), n(t.acc[k][1])] : [0, 0]])),
    moments: (Array.isArray(t.moments) ? t.moments : []).slice(0, 30).map(x => ({ match: String(x.match || '').slice(0, 8), game: n(x.game), turn: n(x.turn), kind: String(x.kind || '').slice(0, 12), text: String(x.text || '').slice(0, 240) })) };
}
// the meta deck an opponent was most likely on: the field list sharing the most of the cards they showed
// (2+); else their colours ("Green, not a meta list"), else Unknown. A ladder opponent is often on no meta list.
const COLOR_WORD = { W: 'White', U: 'Blue', B: 'Black', R: 'Red', G: 'Green' };
async function archetypeOf(cards, format = 'standard') {
  const lists = calibs[format]?.lists || [], seen = new Set(cards.filter(n => !BASIC.test(n)));
  let best = null, bn = 1;
  for (const l of lists) { const n = new Set([...l.main, ...(l.side || [])].map(c => c.name).filter(x => seen.has(x))).size; if (n > bn) { best = l.name; bn = n; } }
  if (best) return best;
  try {
    const find = await meta.cards([...seen]), cols = new Set();
    for (const n of seen) { const k = find(n); for (const c of (k && (k.colors || k.card_faces?.[0]?.colors)) || []) cols.add(c); }
    const order = ['W', 'U', 'B', 'R', 'G'].filter(c => cols.has(c));
    if (order.length) return order.map(c => COLOR_WORD[c]).join('-') + ', not a meta list';
  } catch { /* the label falls back */ }
  return 'Unknown';
}
// A new brew from a list: { b } or { error, status }. The paste box and "Start this brew" (change 22) come here.
async function createBrew(user, { list, name, note, cover, format, settings } = {}) {
  const cap = A.planOf(user.plan).features.brews;
  if (!user.isAdmin && cap != null && brews.filter(x => x.owner === user.name).length >= cap) return { status: 403, error: `The free plan keeps ${cap === 1 ? 'one deck' : cap + ' decks'}. Paste a new version of it, or delete it to start another.` };
  const deck = { main: list?.main || [], side: list?.side || [], commander: list?.commander || [] };
  if (!validDeck(deck.main.length ? deck : { ...deck, main: deck.commander })) return { status: 400, error: 'that list has no cards' };
  const fmt = FORMATS.includes(String(format || '').toLowerCase()) ? String(format).toLowerCase() : 'standard';
  const d = await meta.describeDeck(deck, fmt);
  if (d.legality && !d.legality.ok) return { status: 400, error: meta.legalityError(d.legality), legality: d.legality };
  const now = Date.now(), id = crypto.randomBytes(5).toString('hex');
  // the cover: a card from the list (by name), or an uploaded image kept beside the data
  const pickCard = cover?.card && d.rows.some(r => r.name === cover.card && !r.land) ? cover.card : d.coverCard;
  let coverUrl = null;
  if (cover?.upload) { try { coverUrl = saveCover(id, cover.upload); } catch (e) { return { status: 400, error: e.message }; } }
  const b = { id, owner: user.name, name: String(name || d.coverCard.split(',')[0] || 'Untitled').trim().slice(0, 60) || 'Untitled', format: d.format, seats: d.format === 'commander' ? 4 : 2, created: now,
    coverCard: pickCard, coverUrl, colors: d.colors, notes: note && String(note).trim() ? [{ k: crypto.randomBytes(3).toString('hex'), t: String(note).trim().slice(0, 500) }] : [],
    versions: [{ v: 1, created: now, origin: 'pasted', list: d.list, rows: d.rows, style: d.style }], current: 1, maxV: 1, runs: [], ...(settings ? { settings: cleanSettings({}, settings) } : {}) };
  setImmediate(() => readSoon(b, b.versions[0]));
  if (coverTypes[id]) b.coverType = coverTypes[id];
  brews.unshift(b); saveBrews(); await checkSoon(b);
  return { b };
}

// Start a run of version v against an opponent set: { run } or { error, status }. The Run button, a new version
// saved with run: true (change 20) and Optimize (change 24) all come through here.
function startRun(b, user, vIn, oppSet) {
  const set = oppSets(b).find(s => s.id === oppSet);
  if (!set || !set.available) return { status: 400, error: set ? set.detail : 'pick who it should play' };
  const v = b.versions.some(x => x.v === vIn) ? vIn : current(b).v;
  const vl = (b.versions.find(x => x.v === v) || {}).legal;
  if (vl && !vl.ok) return { status: 400, error: `v${v} is no longer ${b.format}-legal (${[...vl.illegal.map(x => x.name), ...vl.unknown].join(', ')}). Paste a new version without ${vl.illegal.length + vl.unknown.length === 1 ? 'it' : 'them'}; v${v}'s results stay.` };
  // a run is quiet while it reads the field, so a second click would start an identical one
  const dup = b.runs.find(r => r.v === v && r.oppSet === set.id && ['preparing', 'queued', 'running'].includes(runView(b, r).status));
  if (dup) return { status: 409, error: `v${v} is already running against that field. Cancel it first if you want to start over.` };
  const no = refusal(user, 'run'); if (no) return { status: 429, error: no };
  const run = { id: crypto.randomBytes(4).toString('hex'), v, oppSet: set.id, created: Date.now(), status: 'preparing' };
  const paid = A.reserve(user.accountId, { ref: run.id, credits: set.credits || 0, note: `${b.name} v${v} · ${set.title}` });
  if (!paid.ok) return { status: 402, error: `This run needs ${paid.need} credits; you have ${paid.have}.` };
  b.runs.unshift(run); saveBrews(); usage.mark(user.name, 'run');
  prepareRun(b, run, user);
  return { run };
}

// The coach acts when the player tells it to (Justin, 16 Oct 2026: "if I tell coach I want an updated deck with x
// cards, it will update the version and it will go live"). Three tools, each the same path a button takes (a saved
// version, the current switch, startRun), each leaving an `action` line in the thread that the page shows with Undo.
// What may change: the deck only on an instruction (coach.js ACT); runs only when asked, and they pay like the button.
const BASIC_LAND = /^(snow-covered )?(plains|island|swamp|mountain|forest|wastes)$/i;
const swapText = diff => diff.map(c => (c.qty > 0 ? '+' : '−') + Math.abs(c.qty) + ' ' + c.name + (c.section === 'side' ? ' (side)' : '')).join(', ');
function coachTools(b, user) {
  const CARDS = { type: 'array', items: { type: 'object', properties: { qty: { type: 'integer', minimum: 1, maximum: 60 }, name: { type: 'string' } }, required: ['qty', 'name'] } };
  const fields = oppSets(b).filter(x => x.available).map(x => x.id);
  const tools = [
    { name: 'edit_deck', description: 'Save a new version of the deck from swaps against a base version (default: the current deck). With make_current true (the default) it becomes the player\'s deck right away.',
      schema: { type: 'object', properties: { from: { type: 'integer', description: 'version number to start from; omit for the current deck' }, main_out: CARDS, main_in: CARDS, side_out: CARDS, side_in: CARDS,
        make_current: { type: 'boolean' }, note: { type: 'string', description: 'one line on why, shown in the version history' } } } },
    { name: 'make_current', description: 'Make an existing version the player\'s deck.', schema: { type: 'object', properties: { v: { type: 'integer' } }, required: ['v'] } },
    ...(fields.length ? [{ name: 'run_version', description: 'Queue a sim run of a version (default: the current deck). Uses one of the player\'s runs. Only when they ask for a run.',
      schema: { type: 'object', properties: { v: { type: 'integer' }, field: { type: 'string', enum: fields, description: 'meta10 = this week\'s top 10 (default), meta20 = top 20, team = the pod' } } } }] : []),
  ];
  let done = 0;
  const note = (text, action) => { (b.thread = b.thread || []).push({ role: 'coach', kind: 'action', text, action: { ...action, at: Date.now() }, at: Date.now() }); saveBrews(); };
  async function run(name, x) {
    if (++done > 4) return 'Error: that is enough changes for one message. Tell the player what you did.';
    if (name === 'edit_deck') {
      const base = b.versions.find(v => v.v === x.from) || current(b);
      const zones = { main: base.list.main.map(c => ({ ...c })), side: (base.list.side || []).map(c => ({ ...c })) };
      const find = (z, n) => zones[z].find(c => c.name.toLowerCase() === String(n).trim().toLowerCase());
      for (const [z, outs] of [['main', x.main_out], ['side', x.side_out]]) for (const c of outs || []) {
        const have = find(z, c.name); if (!have) return `Error: ${c.name} isn't in v${base.v}'s ${z === 'main' ? 'main deck' : 'sideboard'}.`;
        if (have.qty < c.qty) return `Error: v${base.v} has only ${have.qty} ${have.name} in the ${z === 'main' ? 'main deck' : 'sideboard'}.`;
        have.qty -= c.qty;
      }
      for (const [z, ins] of [['main', x.main_in], ['side', x.side_in]]) for (const c of ins || []) {
        const have = find(z, c.name); if (have) have.qty += c.qty; else zones[z].push({ qty: c.qty, name: String(c.name).trim().slice(0, 80) });
      }
      const list = { ...base.list, main: zones.main.filter(c => c.qty > 0), side: zones.side.filter(c => c.qty > 0) };
      const count = l => l.reduce((a, c) => a + c.qty, 0);
      if (b.seats !== 4) {
        if (count(list.main) < 60) return `Error: the main deck would be ${count(list.main)} cards; it needs at least 60.`;
        if (count(list.side) > 15) return `Error: the sideboard would be ${count(list.side)} cards; at most 15.`;
        const tot = new Map(); for (const c of [...list.main, ...list.side]) tot.set(c.name.toLowerCase(), (tot.get(c.name.toLowerCase()) || 0) + c.qty);
        const over = [...tot].filter(([n, q]) => q > 4 && !BASIC_LAND.test(n)); if (over.length) return `Error: more than 4 of ${over.map(([n]) => n).join(', ')} across main and side.`;
      }
      const d = await meta.describeDeck(list, b.seats === 4 ? null : b.format);
      if (d.legality && !d.legality.ok) return 'Error: ' + meta.legalityError(d.legality);
      const diff = diffLists(base.list, d.list); if (!diff.length) return `Error: that's the same list as v${base.v}.`;
      const live = x.make_current !== false, prev = current(b).v;
      const nv = pushVersion(b, live ? 'asked' : 'coach', { list: d.list, rows: d.rows, style: d.style, diff, base: base.v, note: ('Coach: ' + (x.note ? String(x.note).trim() : swapText(diff))).slice(0, 500) });
      readSoon(b, nv); saveBrews(); checkSoon(b).catch(() => {});
      note(`Saved v${nv.v} from v${base.v} · ${swapText(diff)}${live ? ` · it's your deck now (was v${prev})` : ` · v${prev} is still your deck`}`, { type: 'save', v: nv.v, prev, live });
      return `Saved as v${nv.v} (${swapText(diff)}). ${live ? `v${nv.v} is now the player's deck.` : `v${prev} is still the player's deck.`}`;
    }
    if (name === 'make_current') {
      const v = x.v | 0; if (!b.versions.some(y => y.v === v)) return `Error: there's no v${v}. Versions: ${b.versions.map(y => 'v' + y.v).join(', ')}.`;
      const prev = current(b).v; if (prev === v) return `v${v} is already the player's deck.`;
      b.current = v;
      if (b.optimize && b.optimize.guide && b.optimize.guide.v === v) { const { v: _v, ...g } = b.optimize.guide; b.guide = g; delete b.optimize.guide; }
      note(`Made v${v} your deck (was v${prev})`, { type: 'current', v, prev });
      return `v${v} is now the player's deck.`;
    }
    if (name === 'run_version') {
      const v = b.versions.some(y => y.v === x.v) ? x.v : current(b).v, set = fields.includes(x.field) ? x.field : fields.includes('meta10') ? 'meta10' : fields[0];
      const r = startRun(b, user, v, set); if (r.error) return 'Error: ' + r.error;
      const title = (oppSets(b).find(y => y.id === set) || {}).title || set;
      note(`Queued a run of v${v} · ${title}`, { type: 'run', v, run: r.run.id });
      return `Queued: v${v} against ${title}. It shows on the Sim tab.`;
    }
    return 'Error: no such tool.';
  }
  const cur = current(b), list = l => l.map(c => c.qty + ' ' + c.name).join('\n') || '(none)';
  const deckText = `The player's deck right now (the current version) is v${cur.v}. Versions: ${b.versions.map(y => `v${y.v} (${y.origin || originOf(y)})`).join(', ')}.\nMain deck (v${cur.v}):\n${list(cur.list.main)}\nSideboard (v${cur.v}):\n${list(cur.list.side || [])}`;
  return { tools, run, deckText };
}

// Optimize (change 24, NOTE-TO-CODE-16OCT-CHECK.md §2): structure -> run -> a matchup swap -> the write-up, one line
// each in the Coach thread. b.optimize = { status, from, v, run, test, steps, who }; status is preparing, structure,
// running, matchups, writing, done or failed. The structure step and the first run start on the request; a tick
// moves the rest along as runs finish. The matchup step tests the coach's first swap that fits the Cards dial (the
// coach reads the run's matchups and names what costs the most), as a version of its own against the same field.
function optLine(b, status, text) {
  const o = b.optimize; o.status = status; o.steps.push({ at: Date.now(), status, text });
  (b.thread = b.thread || []).push({ role: 'coach', text, at: Date.now(), kind: 'optimize' }); saveBrews();
}
const optBusy = new Set();
async function optimizeTick(b) {
  const o = b.optimize; if (!o || !['running', 'matchups'].includes(o.status) || optBusy.has(b.id)) return;
  const user = o.who, runOf = id => b.runs.find(r => r.id === id), rvOf = id => { const r = runOf(id); return r ? runView(b, r) : null; };
  if (o.status === 'running') {
    const rv = rvOf(o.run); if (!rv) return optLine(b, 'failed', 'The run is gone, so Optimize stopped.');
    if (['failed', 'cancelled', 'lost'].includes(rv.status)) return optLine(b, 'failed', `The run of v${o.v} ${rv.status === 'cancelled' ? 'was cancelled' : 'failed'}, so Optimize stopped.`);
    if (rv.status !== 'done') return;
    const run = runOf(o.run);
    if (!run.coach) { coachWriteups(b); if (claude.available()) return; } // wait for the readout: it names the matchup swaps
    const s = rv.score;
    if (s) optLine(b, 'matchups', `v${o.v} wins ${pct(s.p)}% against the top 10 (${pct(s.lo)}–${pct(s.hi)}).`);
    const budget = settingsOf(b).budget, mode = (budget && budget.mode) || 'any', owned = (collection.get(b.owner).paper || {}).cards || {};
    const fits = opt => opt.in.every(c => mode === 'any' || (owned[c.name] || 0) >= c.qty || (mode === 'usd' && (meta.cardFacts(c.name).price || Infinity) * c.qty <= (budget.usd || 0)));
    const i = ((run.coach && run.coach.options) || []).findIndex(x => x && x.kind === 'swap' && !x.test && fits(x));
    if (i < 0) { o.status = 'writing'; return optimizeWrite(b, o.v, `No swap the coach suggested fits ${mode === 'owned' ? 'your collection' : mode === 'usd' ? 'the budget' : 'the list'}, so v${o.v} stands.`); }
    const opt = run.coach.options[i], base = b.versions.find(x => x.v === run.v), main = new Map(base.list.main.map(c => [c.name, c.qty]));
    opt.out.forEach(c => main.set(c.name, (main.get(c.name) || 0) - c.qty)); opt.in.forEach(c => main.set(c.name, (main.get(c.name) || 0) + c.qty));
    optBusy.add(b.id);
    try {
      const d = await meta.describeDeck({ ...base.list, main: [...main].filter(([, q]) => q > 0).map(([name, qty]) => ({ qty, name })) }, b.format), diff = diffLists(base.list, d.list);
      if (!diff.length || (d.legality && !d.legality.ok)) { o.status = 'writing'; return optimizeWrite(b, o.v, `The coach's swap didn't make a legal new list, so v${o.v} stands.`); }
      const swapText = `−${opt.out.map(c => c.qty + ' ' + c.name).join(', ')} · +${opt.in.map(c => c.qty + ' ' + c.name).join(', ')}`;
      const nv = pushVersion(b, 'optimize', { list: d.list, rows: d.rows, style: d.style, diff, base: base.v, from: { run: run.id, option: i }, note: 'Optimize, matchup swap: ' + swapText });
      readSoon(b, nv);
      const r = startRun(b, user, nv.v, run.oppSet);
      if (r.error) { o.status = 'writing'; return optimizeWrite(b, o.v, `I couldn't test the swap (${r.error}), so v${o.v} stands.`); }
      opt.test = { v: nv.v, run: r.run.id }; o.test = { v: nv.v, run: r.run.id, swap: swapText };
      optLine(b, 'matchups', `Testing the coach's swap for ${run.coach.weakness || 'the worst matchups'} as v${nv.v}: ${swapText}.`);
    } finally { optBusy.delete(b.id); }
    return;
  }
  // matchups: the swap's run against the structured version's
  const tv = rvOf(o.test && o.test.run); if (!tv) return;
  if (['failed', 'cancelled', 'lost'].includes(tv.status)) { o.status = 'writing'; return optimizeWrite(b, o.v, `The swap's run ${tv.status === 'cancelled' ? 'was cancelled' : 'failed'}, so v${o.v} stands.`); }
  if (tv.status !== 'done') return;
  const a = rvOf(o.run).score, t = tv.score;
  // kept only when it is ahead and its range clears the other's middle: inside the noise, the simpler list stays
  const kept = a && t && t.p > a.p && t.lo > a.p;
  o.status = 'writing';
  return optimizeWrite(b, kept ? o.test.v : o.v, a && t ? (kept ? `The swap beat the noise: ${pct(a.p)}% → ${pct(t.p)}% (${pct(t.lo)}–${pct(t.hi)}). Keeping v${o.test.v}.` : `The swap scored ${pct(t.p)}% against ${pct(a.p)}%, inside the noise, so v${o.v} stays.`) : `v${o.v} stays.`);
}
// the last step: say which version won, then the sideboard guide for it (the coach's sideboard mode)
function optimizeWrite(b, v, line) {
  const o = b.optimize; o.final = v; optLine(b, 'writing', line);
  // the end hands the choice back: nothing becomes the deck, and the deck's plan isn't replaced, until the player says
  const cur = current(b).v, ready = v === cur ? `Done. v${v} is still your deck; nothing needed changing.` : `Done. v${v} is ready; v${cur} is still your deck. Make v${v} current, run v${o.from} to compare, or discard v${v}.`;
  const run = b.runs.find(r => r.v === v && runView(b, r).status === 'done');
  if (!claude.available() || !run) { optLine(b, 'done', ready); return; }
  const keep = g => { if (v === current(b).v) b.guide = g; else o.guide = { ...g, v }; };
  usage.as({ who: b.owner, kind: 'coach-sideboard', brew: b.id }, () => coach.mode(b, coachRun(b, runView(b, run)), 'sideboard', {}))
    .then(out => { keep({ rows: (out.rows || []).slice(0, 20), run: run.id, at: Date.now() }); optLine(b, 'done', ready + ` v${v}'s sideboard plan is written and comes with it.`); })
    .catch(e => optLine(b, 'done', ready + ` Its sideboard plan didn't write (${e.message}); ask the coach for one.`));
}
setInterval(() => { for (const b of brews) if (b.optimize && ['running', 'matchups'].includes(b.optimize.status)) optimizeTick(b).catch(e => console.error('optimize:', b.id, e.message)); }, 30e3);

// Craft (change 20, NOTE-TO-CODE-16OCT-CRAFT.md §3): what each card you don't own is worth against the best one you
// do. After a brew's newest field run finishes, for the three dearest cards the paper shelf is short of, the owned
// substitute (same card type, a shared colour, mana value within one, legal; the one its shell plays most) is
// tested in the full list against the same field, at low priority behind people's runs. A test is a run that is
// never saved as a version (b.craftRuns); delta is the paired difference in field win rate, in points, with the
// two runs' ranges combined. The Arena shelf has no cards to substitute from (collection.js), so paper only.
const CRAFT_MAX = 3;
async function craftStart(b) {
  const paper = collection.get(b.owner).paper; if (!paper || b.seats !== 2) return;
  const base = b.runs.find(r => ['meta10', 'meta20'].includes(r.oppSet) && runView(b, r).status === 'done');
  if (!base || (b.craft && b.craft.run === base.id)) return;
  const ver = b.versions.find(x => x.v === base.v); if (!ver) return;
  const field = fieldLists(b.format); const N = field ? await shell.norms(field, b.format).catch(() => null) : null;
  const names = ver.list.main.map(c => c.name), owned = paper.cards;
  const find = await meta.cards([...new Set([...names, ...Object.keys(owned)])]);
  const BASICS = /^(plains|island|swamp|mountain|forest|wastes)$/i, kind = k => (String((k?.card_faces?.[0] || k || {}).type_line || '').match(/Creature|Planeswalker|Battle|Instant|Sorcery|Enchantment|Artifact|Land/) || [''])[0];
  const colors = k => new Set(k?.colors || k?.card_faces?.[0]?.colors || []);
  const rateOf = n => { const A = ver.check && ver.check.archetype && N ? N[ver.check.archetype] : null; if (A) return A.rate[n] || 0; return N ? Math.max(0, ...Object.values(N).map(a => a.rate[n] || 0)) : 0; };
  const inList = n => ver.list.main.filter(c => c.name === n).reduce((t, c) => t + c.qty, 0);
  const missing = ver.list.main.filter(c => !BASICS.test(c.name) && (owned[c.name] || 0) < c.qty).map(c => ({ name: c.name, need: c.qty - (owned[c.name] || 0), price: meta.cardFacts(c.name).price || 0 }))
    .sort((a, b) => b.price - a.price).slice(0, CRAFT_MAX);
  const tests = [];
  for (const m of missing) {
    const km = find(m.name); if (!km) continue;
    const cands = Object.keys(owned).map(n => [n, find(n)]).filter(([n, k]) => k && n !== m.name && !BASICS.test(n) && kind(k) === kind(km) && (owned[n] - inList(n)) >= m.need
      && Math.abs((k.cmc || 0) - (km.cmc || 0)) <= 1 && (!colors(km).size || [...colors(k)].some(c => colors(km).has(c)) || !colors(k).size) && ['legal', 'restricted'].includes(k.legalities?.[b.format]))
      .sort((x, y) => rateOf(y[0]) - rateOf(x[0]));
    if (!cands.length) continue;
    const sub = cands[0][0], main = ver.list.main.map(c => ({ ...c }));
    main.find(c => c.name === m.name).qty -= m.need; const i = main.find(c => c.name === sub); if (i) i.qty += m.need; else main.push({ qty: m.need, name: sub });
    tests.push({ id: crypto.randomBytes(4).toString('hex'), v: base.v, oppSet: base.oppSet, created: Date.now(), status: 'preparing', kind: 'craft', list: { ...ver.list, main: main.filter(c => c.qty > 0) },
      swap: { shelf: 'paper', out: [{ qty: m.need, name: m.name }], in: [{ qty: m.need, name: sub }], savesUsd: +(m.need * m.price).toFixed(2), rarity: km.rarity || null } });
  }
  b.craft = { at: Date.now(), run: base.id, rows: [], pending: tests.length };
  b.craftRuns = tests; saveBrews();
  for (const t of tests) prepareRun(b, t, { name: b.owner }, { low: true, onDone: () => {} });
}
function craftCollect(b) {
  if (!b.craft || !b.craft.pending || !b.craftRuns) return;
  const base = b.runs.find(r => r.id === b.craft.run), a = base && runView(b, base).score;
  let pending = 0; const rows = [];
  for (const t of b.craftRuns) {
    const tv = runView(b, t);
    if (['queued', 'running', 'preparing'].includes(tv.status)) { pending++; continue; }
    if (tv.status !== 'done' || !a || !tv.score) continue;
    const se = x => (x.hi - x.lo) / 3.92, d = (tv.score.p - a.p) * 100, w = 1.96 * Math.hypot(se(a), se(tv.score)) * 100;
    rows.push({ ...t.swap, saves: t.swap.rarity ? { [t.swap.rarity]: t.swap.out[0].qty } : {}, delta: +d.toFixed(1), lo: +(d - w).toFixed(1), hi: +(d + w).toFixed(1), games: tv.score.n || null });
  }
  if (pending !== b.craft.pending || rows.length !== b.craft.rows.length) { b.craft.pending = pending; b.craft.rows = rows; saveBrews(); }
}
setInterval(() => { for (const b of brews) { craftStart(b).catch(e => console.error('craft:', b.id, e.message)); craftCollect(b); } }, 60e3);

const colBrews = new Map(); // owner -> { key, data }
async function collectionBrews(owner, format = 'standard') {
  const paper = collection.get(owner).paper, field = fieldLists(format); if (!paper || !field) return null;
  const key = paper.at + ':' + field.map(d => d.name).sort().join('|'), c = colBrews.get(owner);
  if (c && c.key === key) return c.data;
  const r = await shell.fromCollection(paper, field, format);
  const data = { field: `${format[0].toUpperCase() + format.slice(1)} field · ${field.length} decks`, at: Date.now(), note: r.note, rows: r.rows };
  colBrews.set(owner, { key, data }); return data;
}

// The field, by what the paper collection can build (change 20 §5): each field deck's share owned and the price of
// the rest, with the missing cards for a buy link (change 23).
async function fieldCraft(owner, format = 'standard') {
  const paper = collection.get(owner).paper, field = fieldLists(format); if (!paper || !field) return null;
  const shares = {}; try { (await meta.goldfishMeta(format)).forEach(d => { shares[d.name] = d.pct; }); } catch {}
  await meta.cards([...new Set(field.flatMap(d => d.main.map(c => c.name)))]);
  const BASICS = /^(plains|island|swamp|mountain|forest|wastes)$/i;
  const rows = field.map(d => {
    let owned = 0, size = 0, usd = 0; const missing = [];
    for (const c of d.main) { size += c.qty; const have = BASICS.test(c.name) ? c.qty : Math.min(c.qty, paper.cards[c.name] || 0); owned += have; if (have < c.qty) { missing.push({ qty: c.qty - have, name: c.name }); usd += (c.qty - have) * (meta.cardFacts(c.name).price || 0); } }
    return { name: d.name, metaPct: shares[d.name] ?? null, owned, size, usd: +usd.toFixed(2), missing };
  });
  return { paper: { field: `${format[0].toUpperCase() + format.slice(1)} field · ${field.length} decks`, at: Date.now(), rows } };
}

// The brew check (change 24, shell.js) on each of a brew's last three versions: worked out in the background and
// kept on the version, keyed by the field, the paper collection and the Cards dial, so it is redone when any moves.
// Constructed brews in a format with a field only.
const checking = new Set();
function ensureChecks(b) {
  const started = [];
  if (b.seats !== 2) return Promise.resolve();
  const field = fieldLists(b.format); if (!field) return Promise.resolve();
  const paper = collection.get(b.owner).paper || null, budget = settingsOf(b).budget;
  const key = crypto.createHash('sha1').update(JSON.stringify([field.map(d => d.name).sort(), paper ? paper.at : 0, budget ? [budget.mode, budget.usd] : null])).digest('hex').slice(0, 12);
  for (const ver of b.versions.slice(-3)) {
    const id = b.id + ':' + ver.v;
    if ((ver.check && ver.check.key === key) || checking.has(id)) continue;
    checking.add(id);
    const illegal = (ver.rows || []).filter(r => r.legal === false && r.section === 'main').map(r => ({ name: r.name }));
    started.push(shell.check(ver.list, { field, format: b.format, legality: { ok: !illegal.length, illegal }, paper, budget })
      .then(c => { if (c) { ver.check = { ...c, key }; saveBrews(); } })
      .catch(e => console.error('check:', b.id, ver.v, e.message))
      .finally(() => checking.delete(id)));
  }
  return Promise.all(started);
}
// a new list's check is the first thing the page shows: wait for it briefly (the norms are kept warm)
const checkSoon = b => Promise.race([ensureChecks(b), new Promise(ok => setTimeout(ok, 1500))]);
// keep the Standard norms warm: at boot and every six hours (realdata's files are cached on disk)
const warmNorms = () => { const f = fieldLists('standard'); if (f) shell.norms(f, 'standard', REAL_DAYS).catch(e => console.error('norms:', e.message)); };
setTimeout(warmNorms, 20e3); setInterval(warmNorms, 6 * 36e5);

// every version's rows carry today's card facts (type, rarity, price, buy link) from the card cache, so a version
// saved before they existed shows them and prices stay current
// each version's state, for the header line and the Versions ledger: a run in progress first, else its newest
// finished result (a later stopped run doesn't hide it), else "stopped", else "not run yet". Weekly reruns don't count.
const shortDay = t => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
function stateOf(rvs, v) {
  const mine = rvs.filter(x => x.v === v && !x.weekly);
  const live = mine.find(r => ['preparing', 'queued', 'running'].includes(r.status)), done = mine.find(r => r.status === 'done' && r.score);
  if (live && live.status === 'running') { const pct = live.total ? Math.round(100 * live.played / live.total) : 0; return { kind: 'running', run: live.id, pct, line: `running ${pct}%` }; }
  if (live) return { kind: 'queued', run: live.id, line: live.queuePos > 0 ? `queued · ${live.queuePos} ahead` : 'queued' };
  if (done) return { kind: 'done', run: done.id, p: done.score.p, line: `${Math.round(100 * done.score.p)}% on ${done.field && done.field.date ? shortDay(done.field.date) : shortDay(done.created)} field` };
  if (mine.length) return { kind: 'stopped', run: mine[0].id, cause: mine[0].status, line: 'stopped' };
  return { kind: 'none', line: 'not run yet' };
}
const versionsView = (b, rvs = []) => (b.versions || []).map(v => { const o = b.optimize, mine = o && [o.from, o.v, o.test && o.test.v].includes(v.v);
  return { ...v, origin: v.origin || originOf(v), current: v.v === current(b).v, state: stateOf(rvs, v.v), rows: (v.rows || []).map(r => ({ ...r, ...meta.cardFacts(r.name) })), ...(mine ? { optimize: { status: o.status, steps: o.steps, final: o.final || null } } : {}) }; });
const brewView = b => { ensureChecks(b); const rvs = b.runs.map(r => { const v = runView(b, r); if (v.status === 'done' && b.seats === 2) v.relative = relativeOf(b, v); return v; }); return { ...b, current: current(b).v, craftRuns: undefined, craft: b.craft && b.craft.rows.length ? { at: b.craft.at, run: b.craft.run, pending: b.craft.pending, rows: b.craft.rows } : null, optimize: b.optimize ? { status: b.optimize.status, from: b.optimize.from, v: b.optimize.v, test: b.optimize.test || null, final: b.optimize.final || null, steps: b.optimize.steps } : null, versions: versionsView(b, rvs), real: realOf(b), realMatches: undefined, settings: settingsOf(b), events: Object.fromEntries(Object.entries(EVENTS).map(([k, x]) => [k, x.label])), runs: rvs, oppSets: oppSets(b), coachOn: claude.available() }; };

// ---------- the coach ----------
// A finished field run gets its readout written once (lazily, when its brew is
// next read). Swaps the model suggests are checked: cards out must be in the main
// deck, cards in must exist and be legal in the format, and the counts must match;
// a swap that fails the check becomes advice instead of a test button.
const coachBusy = new Set();
async function cleanSwap(b, ver, o) {
  // the evidence grade the coach gave it (strong / weak / untested) and the one-line basis
  const ev = { evidence: ['strong', 'weak', 'untested'].includes(o.evidence) ? o.evidence : 'untested', basis: String(o.basis || '').slice(0, 200) };
  if (o.kind !== 'swap') return { title: o.title, detail: o.detail, kind: 'note', ...ev };
  const main = new Map(ver.list.main.map(c => [c.name.toLowerCase(), c]));
  const st = settingsOf(b), keep = new Set(st.keep.map(x => x.toLowerCase())), never = new Set(st.never.map(x => x.toLowerCase()));
  const outs = (o.out || []).map(c => { const m2 = main.get(String(c.name).toLowerCase()); return m2 && c.qty > 0 && !keep.has(m2.name.toLowerCase()) ? { qty: Math.min(c.qty, m2.qty), name: m2.name } : null; }).filter(Boolean);
  const find = await meta.cards((o.in || []).map(c => c.name));
  const ins = (o.in || []).map(c => { const k = find(c.name); return k && c.qty > 0 && k.legalities?.[b.format] === 'legal' && !never.has(meta.forgeName(k).toLowerCase()) ? { qty: Math.min(4, c.qty), name: meta.forgeName(k) } : null; }).filter(Boolean);
  const n = Math.min(ins.reduce((t, c) => t + c.qty, 0), outs.reduce((t, c) => t + c.qty, 0));
  const trim = l => { let k = n; return l.map(c => { const q = Math.min(c.qty, k); k -= q; return q ? { qty: q, name: c.name } : null; }).filter(Boolean); };
  return n ? { title: o.title, detail: o.detail, kind: 'swap', in: trim(ins), out: trim(outs), ...ev } : { title: o.title, detail: o.detail, kind: 'note', ...ev };
}
function coachWriteups(b) {
  if (!claude.available() || b.seats !== 2) return;
  // the newest finished run only; a failed writeup is tried again after ten minutes
  const run = b.runs.find(r => runView(b, r).status === 'done');
  if (!run || !run.field?.source || coachBusy.has(run.id) || (run.coach && !(run.coach.error && Date.now() - run.coach.at > 600e3))) return;
  coachBusy.add(run.id);
  (async () => {
    const rv = runView(b, run), ver = b.versions.find(x => x.v === run.v);
    const w = await usage.as({ who: b.owner, kind: 'readout', brew: b.id }, () => coach.writeup(b, coachRun(b, rv)));
    const options = await Promise.all((w.options || []).slice(0, 3).map(o => cleanSwap(b, ver, o)));
    run.coach = { weakness: String(w.weakness || '').slice(0, 120), weaknessNote: String(w.weaknessNote || '').slice(0, 600), options, at: Date.now() };
    (b.thread = b.thread || []).push({ role: 'coach', text: String(w.summary || '').slice(0, 2000), at: Date.now(), run: run.id, kind: 'writeup' });
    saveBrews();
  })().catch(e => { run.coach = { error: e.message, at: Date.now() }; saveBrews(); console.error('coach writeup:', e.message); }).finally(() => coachBusy.delete(run.id));
}
// The run the coach talks about: the newest one with games, else a stand-in with none.
function talkRun(b) {
  const r = b.runs.find(x => runView(b, x).played > 0);
  return r ? runView(b, r) : { v: current(b).v, opponents: [], status: 'not run yet', played: 0, total: 0, field: null };
}

// The deck guide (Design's change 11): one read-only document per brew version, assembled from what the
// coach modes and the run already wrote. A section nobody has asked for yet comes back null with the mode
// that writes it in `missing`, so the page doubles as the prep checklist.
function guideOf(b, vn, { since = null } = {}) {
  const ver = b.versions.find(x => x.v === vn) || current(b);
  const pick = b.runs.filter(r => r.v === ver.v).map(r => runView(b, r)).filter(r => r.played > 0);
  const rv = pick.find(r => r.score && r.field) || pick.find(r => r.score) || pick[0] || null;
  const said = (kind, opp) => [...(b.thread || [])].reverse().find(t => t.role === 'coach' && t.kind === kind && (opp === undefined || t.opponent === opp)) || null;
  const pct = s => s ? { p: s.p, lo: s.lo, hi: s.hi } : { p: null, lo: null, hi: null };
  const rows = (b.guide && b.guide.rows) || [];
  const matchups = rv && rv.opponents ? rv.opponents.map(o => {
    const sb = rows.find(r => r.opponent === o.name), t = said('pilot', o.name);
    return { opponent: o.name, metaPct: o.metaPct ?? null, ...pct(o.score), role: sb ? sb.role : null, text: t ? t.text : null, at: t ? t.at : null,
      evidence: o.score ? o.score.n + ' games' : null, basis: o.score ? (o.score.cal ? 'calibrated against real results' : 'Forge games') : null,
      // the weekly rerun moved this row since the owner last opened the guide (only on the owner's own view)
      moved: since != null && b.weekly && b.weekly.at > since && b.weekly.run === rv.id ? (b.weekly.movers.find(x => x.opponent === o.name) || null) : null };
  }) : [];
  const mull = said('mulligan'), prevOf = v => b.versions.filter(x => x.v < v).pop() || null;
  const scoreOfV = v => { const r = b.runs.filter(x => x.v === v).map(x => runView(b, x)).find(x => x.score); return r ? r.score : null; };
  const qtyIn = (l, n) => (l ? l.main || [] : []).filter(c => c.name === n).reduce((a, c) => a + c.qty, 0);
  const pv = prevOf(ver.v);
  const cards = rv && rv.cards ? (rv.cards.rows || []).filter(c => !c.side).map(c => ({ name: c.name, qty: c.qty, was: pv ? qtyIn(pv.list, c.name) : null, text: null,
    whenCast: { p: c.castPct, n: c.cast, turn: c.turn }, lift: c.lift, arena: null })) : [];
  const changes = b.versions.filter(x => x.v <= ver.v && x.v > 1).map(x => { const now = scoreOfV(x.v), was = scoreOfV(x.v - 1);
    return { v: x.v, at: x.created, diff: x.diff || [], note: x.note || null, result: now ? { p: now.p, delta: was ? now.p - was.p : null } : null }; }).reverse();
  const plan = rv && rv.coach && !rv.coach.error ? { title: rv.coach.weakness || null, text: rv.coach.weaknessNote || null, evidence: rv.score ? rv.score.n + ' games' : null, basis: 'the run readout' } : null;
  const reading = ver.reading || null;
  const out = { title: b.name, owner: b.owner, format: b.format, version: ver.v,
    writtenAt: Math.max(0, ...[b.guide && b.guide.at, rv && rv.coach && rv.coach.at, ...(b.thread || []).filter(t => t.role === 'coach').map(t => t.at)].filter(Boolean)) || null,
    run: rv ? { id: rv.id, v: rv.v, oppSet: rv.oppSet, n: rv.score ? rv.score.n : rv.played } : null,
    field: rv && rv.field ? { date: rv.field.date || null, label: rv.field.label || null, n: (rv.opponents || []).length } : null,
    summary: { text: reading ? [reading.plan, reading.strategy].filter(Boolean).join(' ') || null : null, nearest: reading ? reading.nearest || null : null, ...pct(rv && rv.score), relative: rv && rv.status === 'done' && b.seats === 2 ? relativeOf(b, rv) : null, top8: rv && rv.event && rv.event.top8 ? rv.event.top8 : null, rounds: rv && rv.event ? rv.event.rounds : null },
    plan, matchups,
    // the mulligan mode writes prose; per-hand win rates need the batch per hand class that doesn't exist yet
    hands: [], mulligan: mull ? { text: mull.text, at: mull.at, graded: 'untested' } : null,
    sideboard: rows.length ? rows : null, sideboardAt: b.guide ? b.guide.at : null,
    cards, changes, real: realOf(b), method: rv ? rv.method : null };
  out.missing = [!plan && 'readout', !matchups.some(m => m.text) && 'pilot', !mull && 'mulligan', !rows.length && 'sideboard', !rv && 'run'].filter(Boolean);
  out.missingPilot = matchups.filter(m => !m.text).map(m => m.opponent);
  return out;
}

// ---------- the weekly rerun (Design's change 12) ----------
// When a format's weekly field changes (MTGGoldfish's top 20, names and shares), each brew with a field run
// in the last 60 days reruns its newest version against the same opponent set, at background priority, once
// a week, and only while its owner has opened the site in the last 30 days. When the rerun finishes it is
// compared with the brew's previous field run and the result goes on `brew.weekly`; `notify` is set when the
// headline moved 3+ points or a matchup 8+. No mail: the sim sends none, so it is a badge on the deck row.
const WEEKLY = path.join(DATA, 'weekly.json');
const weeklyState = readJson(WEEKLY, { fields: {}, seen: {} });   // fields: format -> { sig, at }; seen: user -> last visit
const saveWeekly = () => writeJson(WEEKLY, weeklyState);
const WEEK = 7 * 864e5, RUN_DAYS = 60, IDLE_DAYS = 30;
let seenDirty = false;
function markSeen(name) { const was = weeklyState.seen[name] || 0; if (Date.now() - was > 3600e3) { weeklyState.seen[name] = Date.now(); seenDirty = true; } }
setInterval(() => { if (seenDirty) { seenDirty = false; saveWeekly(); } }, 60e3);

const isFieldRun = r => r.field && r.field.source === 'goldfish';
async function weeklyDue() {
  const formats = [...new Set(brews.filter(b => b.seats === 2 && meta.GOLDFISH_FORMATS.includes(b.format)).map(b => b.format))];
  for (const format of formats) {
    let top; try { top = (await meta.goldfishMeta(format)).slice(0, 20); } catch (e) { console.warn('weekly', format, e.message); continue; }
    if (!top.length) continue;
    const sig = crypto.createHash('md5').update(top.map(d => d.name + ':' + Math.round(d.pct || 0)).join('|')).digest('hex').slice(0, 12);
    const f = weeklyState.fields[format];
    if (!f) { weeklyState.fields[format] = { sig, at: Date.now(), changed: false }; saveWeekly(); continue; }   // the first look is a baseline, not a change
    if (f.sig !== sig) { weeklyState.fields[format] = { sig, at: Date.now(), changed: true }; saveWeekly(); }
    if (!weeklyState.fields[format].changed) continue;
    const changedAt = weeklyState.fields[format].at;
    for (const b of brews.filter(x => x.format === format && x.seats === 2)) {
      const last = b.runs.find(r => isFieldRun(r) && r.oppSet !== 'team');
      if (!last || last.created >= changedAt) continue;                        // already played this field
      if (Date.now() - last.created > RUN_DAYS * 864e5) continue;              // no field run in 60 days
      if (Date.now() - (weeklyState.seen[b.owner] || 0) > IDLE_DAYS * 864e5) continue;
      if (!planOfName(b.owner).features.weekly) continue;
      if (b.runs.some(r => r.weekly && Date.now() - r.created < WEEK)) continue; // one a week
      if (b.runs.some(r => ['preparing', 'queued', 'running'].includes(runView(b, r).status))) continue;
      const v = current(b);
      if (v.legal && !v.legal.ok) continue;                                    // rotated out: nothing to rerun
      const run = { id: crypto.randomBytes(4).toString('hex'), v: v.v, oppSet: last.oppSet, created: Date.now(), status: 'preparing', weekly: true };
      b.runs.unshift(run); saveBrews();
      const set = oppSets(b).find(x => x.id === run.oppSet), acct = A.accountByName(b.owner);
      if (acct) A.reserve(acct.id, { kind: 'weekly', ref: run.id, credits: set ? set.credits : 0, note: `${b.name} v${v.v} · weekly rerun`, free: true });
      console.log(`weekly: ${b.owner}'s ${b.name} v${v.v} against the new ${format} field`);
      await prepareRun(b, run, { name: b.owner }, { low: true });
    }
  }
  weeklyFinish();
}
// Compare each finished weekly rerun with the brew's previous field run (the same version where there is one).
function weeklyFinish() {
  let dirty = false;
  for (const b of brews) for (const run of b.runs) {
    if (!run.weekly || run.compared) continue;
    const now = runView(b, run);
    if (['failed', 'cancelled', 'lost'].includes(now.status)) { run.compared = true; dirty = true; continue; }
    if (now.status !== 'done' || !now.score) continue;
    const before = b.runs.filter(r => r !== run && r.created < run.created && isFieldRun(r) && r.oppSet === run.oppSet).map(r => runView(b, r)).filter(r => r.status === 'done' && r.score);
    const prev = before.find(r => r.v === run.v) || before[0] || null;
    run.compared = true; dirty = true;
    if (!prev) continue;
    const w = weekly.compare(b.name, now, prev);
    b.weekly = { at: Date.now(), run: run.id, prevRun: prev.id, v: run.v, prevV: prev.v, field: run.field ? { date: run.field.date, label: run.field.label } : null,
      ...w, guideUpdated: false, seen: false };
  }
  if (dirty) saveBrews();
}
// ---- mail after runs (change 15): the weekly digest and "run finished" ----
// Both go only to an account with an address that takes mail and the toggle on. The digest is one message a
// week at most, a paragraph per deck that moved (weekly.compare's notify); run-finished is opt-in.
const pct = x => Math.round(x * 100);
const deckLink = b => config.SITE_URL + '/?deck=' + encodeURIComponent(b.id);
// the unsubscribe link works without signing in: an HMAC of the account id under a key kept in the database
function mailKey() { let k = A.db.prepare("SELECT value FROM meta WHERE key = 'mailKey'").get(); if (!k) { A.db.prepare("INSERT INTO meta (key, value) VALUES ('mailKey', ?)").run(crypto.randomBytes(32).toString('hex')); k = A.db.prepare("SELECT value FROM meta WHERE key = 'mailKey'").get(); } return k.value; }
const offToken = id => crypto.createHmac('sha256', mailKey()).update('digest-off:' + id).digest('hex').slice(0, 32);
const mailTo = name => { const a = A.accountByName(name); return a && a.email && a.mailable && a.status === 'active' ? a : null; };
const flagsOf = a => { try { return JSON.parse(a.flags || '{}'); } catch { return {}; } };
const setFlag = (a, k, v) => A.db.prepare('UPDATE accounts SET flags = ? WHERE id = ?').run(JSON.stringify({ ...flagsOf(a), [k]: v }), a.id);
// a push to the owner's phones when that switch is on (account.mail.push); the link opens the deck on the tab
function pushTo(owner, kind, msg) {
  if (!push.has(owner)) return;
  const a = A.accountByName(owner); if (!a || a.status !== 'active' || !A.mailOf(a).push[kind]) return;
  push.send(owner, msg).catch(e => console.warn('push: ' + e.message));
}
const deckPath = (b, tab) => '/?deck=' + encodeURIComponent(b.id) + (tab ? '&tab=' + tab : '');
async function mailDigests() {
  const due = new Map();
  for (const b of brews) if (b.weekly && b.weekly.notify && !b.weekly.mailed && Date.now() - b.weekly.at < 3 * 864e5) (due.get(b.owner) || due.set(b.owner, []).get(b.owner)).push(b);
  let dirty = false;
  for (const [owner, bs] of due) {
    for (const b of bs) { b.weekly.mailed = true; dirty = true; }
    pushTo(owner, 'digest', { title: bs.length === 1 ? `${bs[0].name} moved this week` : `${bs.length} of your decks moved this week`, body: String(bs[0].weekly.text || '').split('. ')[0], url: bs.length === 1 ? deckPath(bs[0], 'results') : '/' });
    const a = mailTo(owner); if (!a || !A.mailOf(a).digest) continue;
    if (Date.now() - (flagsOf(a).lastDigest || 0) < 6 * 864e5) continue;
    const paragraphs = bs.map(b => b.weekly.text + (b.weekly.guideUpdated ? ' The sideboard guide is updated.' : '')).join('\n\n');
    const r = await mail.send({ to: a.email, kind: 'digest', tag: 'digest', vals: { paragraphs, link: bs.length === 1 ? deckLink(bs[0]) : config.SITE_URL, unsubscribe: `${config.SITE_URL}/api/mail/off?a=${a.id}&t=${offToken(a.id)}` } });
    if (r.ok) setFlag(a, 'lastDigest', Date.now());
  }
  if (dirty) saveBrews();
}
async function mailRunsDone() {
  let dirty = false;
  for (const b of brews) for (const run of b.runs) {
    if (run.mailed || run.weekly || Date.now() - run.created > 2 * 864e5) continue;
    const rv = runView(b, run); if (!['done', 'failed', 'cancelled', 'lost'].includes(rv.status)) continue;
    run.mailed = true; dirty = true;
    if (rv.status !== 'done' || !rv.score) continue;
    const field = rv.field && rv.field.label ? rv.field.label : 'the field';
    pushTo(b.owner, 'runDone', { title: `${b.name} v${run.v}`, body: `${pct(rv.score.p)}% (${pct(rv.score.lo)}–${pct(rv.score.hi)}) vs ${field}`, url: deckPath(b, 'results') });
    const a = mailTo(b.owner); if (!a || !A.mailOf(a).runDone) continue;
    await mail.send({ to: a.email, kind: 'run-done', tag: 'run-done', vals: { deck: `${b.name} v${run.v}`, score: `${pct(rv.score.p)}% (${pct(rv.score.lo)}–${pct(rv.score.hi)})`, field, link: deckLink(b) } });
  }
  if (dirty) saveBrews();
}
// mail and push both: mail.send does nothing without a key, so this runs either way
setInterval(() => { mailRunsDone().then(mailDigests).catch(e => console.warn('notify: ' + e.message)); }, 120e3);

// Settle each reserved run once it has stopped: what it played, in credits (a minute of play and loading
// each), never more than its quote. A run the server lost on a restart, or one that failed, uses nothing.
function settleRuns() {
  for (const r of A.openRuns()) {
    let b = null, run = null; for (const x of brews) { const y = x.runs.find(z => z.id === r.ref); if (y) { b = x; run = y; break; } }
    if (!run) { A.settle(r.ref, 0, 'the deck was deleted'); continue; }
    const st = runView(b, run).status; if (!['done', 'failed', 'cancelled', 'lost'].includes(st)) continue;
    const h = run.jobId && history.find(x => x.id === run.jobId);
    const min = Math.ceil((h ? h.pairings.filter(x => x.played).reduce((t, x) => t + x.played * (x.avgMs || 0) / 1000 + LOAD_SECONDS, 0) : 0) / 60);
    A.settle(r.ref, min, `${st}: about ${min} min of play`);
  }
}
setTimeout(settleRuns, 30e3); setInterval(settleRuns, 600e3);
// the database's nightly copy (seven kept) and expired sessions
const dbChores = () => { try { A.backup(path.join(DATA, 'backups')); A.sweepSessions(); } catch (e) { console.error('database backup:', e.message); } };
setTimeout(dbChores, 120e3); setInterval(dbChores, 24 * 3600e3);
setTimeout(() => weeklyDue().catch(e => console.error('weekly:', e.message)), 90e3);
setInterval(() => weeklyDue().catch(e => console.error('weekly:', e.message)), 6 * 3600e3);

// ---------- http ----------
const send =(res, code, body, headers = {}) => {
  const isStr = typeof body === 'string' || Buffer.isBuffer(body);
  res.writeHead(code, { 'Content-Type': isStr ? 'text/plain; charset=utf-8' : 'application/json', 'Cache-Control': 'no-store', ...headers });
  res.end(isStr ? body : JSON.stringify(body));
};
const readRaw = req => new Promise((ok, bad) => {
  let b = ''; req.on('data', d => { b += d; if (b.length > 10e6) { bad(new Error('too large')); req.destroy(); } });
  req.on('end', () => ok(b));
});
const readBody = req => new Promise((ok, bad) => {
  let b = ''; req.on('data', d => { b += d; if (b.length > 10e6) { bad(new Error('too large')); req.destroy(); } });
  req.on('end', () => { try { ok(b ? JSON.parse(b) : {}); } catch (e) { bad(e); } });
});
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
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
      const id = username.trim(), ip = clientIp(req);
      if (tooMany('login', ip, 10, 15 * 60e3)) return send(res, 429, { error: 'too many tries, wait 15 minutes' });
      // a simulator account signs in here; a name that is one never goes to Star Shard
      const local = A.signIn(id, password);
      if (local) return send(res, 200, { ok: true, user: local.name }, sessionCookie(A.startSession(local.id)));
      const held = A.accountByName(id);
      if (held && held.source === 'sim') { tried('login', ip); return send(res, 401, { error: 'wrong username or password' }); }
      const r = await fetch(STARSHARD_API + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': clientIp(req) },
        body: JSON.stringify(id.includes('@') ? { email: id, password } : { username: id, password }),
      });
      if (r.status === 429) return send(res, 429, { error: 'too many tries, wait 15 minutes' });
      if (!r.ok) { tried('login', ip); return send(res, 401, { error: 'wrong username or password' }); }
      const me = await r.json();
      const token = (r.headers.getSetCookie?.() || []).map(c => c.match(/^starshard_session=([^;]+)/)).find(Boolean)?.[1];
      if (!token) return send(res, 502, { error: 'Star Shard login did not return a session' });
      if (!allowed(me.username)) return send(res, 403, { error: config.SIM_SIGNUP === 'open' ? 'Star Shard sign-in is for the founders. Create a simulator account instead: it takes a name and a password.' : 'The sim is open to its founders for now.' });
      let acct; try { acct = A.accountFor({ id: accounts.starshardId(token), name: me.username, admin: isAdminName(me.username) }); } catch (e) { return send(res, 409, { error: e.message }); }
      return send(res, 200, { ok: true, user: acct.name }, sessionCookie(A.startSession(acct.id)));
    }
    // a simulator account: a name and a password, the free plan; only while SIM_SIGNUP is open
    if (p === '/api/signup' && req.method === 'POST') {
      if (config.SIM_SIGNUP !== 'open') return send(res, 403, { error: 'Sign-up is closed for now: the sim is open to its founders while it is calibrated.' });
      const ip = clientIp(req);
      if (tooMany('signup', ip, 5, 3600e3)) return send(res, 429, { error: 'too many new accounts from here; try again in an hour' });
      const { username, password } = await readBody(req);
      let a; try { a = A.signUp(username, password); } catch (e) { return send(res, 400, { error: e.message }); }
      tried('signup', ip);
      console.log(`signup: ${a.name}`);
      return send(res, 200, { ok: true, user: a.name }, sessionCookie(A.startSession(a.id)));
    }
    // Sign in with an email code (change 15, NOTE-TO-CODE-14OCT-EMAIL.md): a six-digit code to the address, then
    // verify for a session. An address with no account gets one only while sign-up is open. purpose 'change' is a
    // signed-in account proving a new address (then POST /api/account/email).
    if (p === '/api/auth/code' && req.method === 'POST') {
      const { email, purpose = 'signin' } = await readBody(req);
      const ip = clientIp(req), e = A.normEmail(email);
      if (!A.validEmail(e)) return send(res, 400, { error: 'Enter an email address.' });
      if (!['signin', 'change'].includes(purpose)) return send(res, 400, { error: 'unknown purpose' });
      if (tooMany('code-ip', ip, 20, 3600e3) || tooMany('code:' + e, 'addr', 3, 3600e3)) return send(res, 429, { error: 'Too many codes for now. Try again in an hour.' });
      let acct = A.accountByEmail(e), accountId = acct ? acct.id : null;
      if (purpose === 'change') {
        const me = await currentUser(req); if (!me) return send(res, 401, { error: 'login required' });
        if (acct && acct.id !== me.accountId) return send(res, 409, { error: 'That address is on another account.' });
        accountId = me.accountId;
      } else if (!acct && config.SIM_SIGNUP !== 'open') {
        return send(res, 404, { error: 'No account uses that address. Sign in with your password, then add it under Account.' });
      } else if (acct && acct.status !== 'active') return send(res, 403, { error: 'That account is closed.' });
      tried('code-ip', ip); tried('code:' + e, 'addr');
      const code = A.issueCode(e, purpose, accountId);
      const r = await mail.send({ to: e, kind: 'code', vals: { code: code.slice(0, 3) + ' ' + code.slice(3) }, tag: 'code' });
      if (!r.ok) return send(res, 503, { error: "Couldn't send the code. Try again in a minute." });
      return send(res, 200, { ok: true, note: acct && !acct.mailable ? "We couldn't deliver to that address before; check it." : null });
    }
    if (p === '/api/auth/verify' && req.method === 'POST') {
      const { email, code } = await readBody(req);
      const ip = clientIp(req);
      if (tooMany('verify', ip, 20, 15 * 60e3)) return send(res, 429, { error: 'too many tries, wait 15 minutes' });
      const c = A.checkCode(email, 'signin', code);
      if (!c.ok) { tried('verify', ip); return send(res, 401, { error: c.error }); }
      let a = c.accountId ? A.account(c.accountId) : A.accountByEmail(c.email);
      if (!a) { if (config.SIM_SIGNUP !== 'open') return send(res, 403, { error: 'Sign-up is closed for now.' }); a = A.signUpByEmail(c.email); console.log(`signup by email: ${a.name}`); }
      if (a.status !== 'active') return send(res, 403, { error: 'That account is closed.' });
      if (a.source === 'starshard' && !allowed(a.name)) return send(res, 403, { error: 'The sim is open to its founders for now.' });
      A.setMailable(c.email, true);   // the code arrived, so the address takes mail
      return send(res, 200, { ok: true, user: a.name }, sessionCookie(A.startSession(a.id)));
    }
    // Resend's bounce and complaint events (signed): the address stops getting the digest and run mail
    if (p === '/api/resend/webhook' && req.method === 'POST') {
      const raw = await readRaw(req);
      if (!mail.verifyWebhook(req.headers, raw)) return send(res, 401, { error: 'bad signature' });
      let ev; try { ev = JSON.parse(raw); } catch { return send(res, 400, { error: 'bad body' }); }
      if (ev.type === 'email.bounced' || ev.type === 'email.complained') for (const to of [].concat(ev.data && ev.data.to || [])) { A.setMailable(to, false); console.log(`mail: ${ev.type} for an address, mail off`); }
      return send(res, 200, { ok: true });
    }
    // the digest's unsubscribe link: no sign-in, a signed link per account
    if (p === '/api/mail/off' && req.method === 'GET') {
      const id = Number(u.searchParams.get('a')), t = String(u.searchParams.get('t') || '');
      const a = Number.isInteger(id) && A.account(id), want = a ? offToken(id) : '';
      if (!a || t.length !== want.length || !crypto.timingSafeEqual(Buffer.from(t), Buffer.from(want))) return send(res, 400, 'That link is not valid.', { 'Content-Type': 'text/plain; charset=utf-8' });
      A.setMail(a.id, { digest: false });
      return send(res, 200, '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Weekly digest off</title><body style="font-family:system-ui;max-width:520px;margin:48px auto;padding:0 16px;line-height:1.5"><p>The weekly digest is off. Turn it back on under Account any time.</p><p><a href="/">Back to Forge Sim</a></p><p style="color:#777;font-size:13px">' + mail.FAN + '</p>', { 'Content-Type': 'text/html; charset=utf-8' });
    }
    if (p === '/api/logout') { A.endSession(tokenOf(req)); return send(res, 200, { ok: true }, { 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0` }); }
    if (p === '/api/health') return send(res, 200, { ok: true, forge: forgeVersion(), signup: config.SIM_SIGNUP === 'open' });
    if (p === '/api/public') return send(res, 200, { signup: config.SIM_SIGNUP === 'open', forge: forgeVersion() }); // change 19: no auth
    // the plan page (Design's Guide.dc.html): /g/<brew>/v<n> for the owner, /g/<token> shared
    if (/^\/g\/[\w-]+(\/v\d+)?\/?$/.test(p)) return serveStatic(req, res, '/guide.html');
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
      // the player's own Arena matches (arena.js on the Mac): each one is filed once on the owner's brew
      // whose latest list holds most of the cards the player showed (half or more of the nonbasic ones)
      // the owner's Arena wildcards, from the StartHook inventory in the Mac's Player.log (collection.js)
      if (p === '/api/worker/collection' && req.method === 'POST') {
        const owner = String(body.owner || ''); if (!owner) return send(res, 400, { error: 'no owner' });
        return send(res, 200, { arena: collection.setArena(owner, body.wildcards) });
      }
      if (p === '/api/worker/real' && req.method === 'POST') {
        const owner = String(body.owner || '').toLowerCase(), out = { added: 0, known: 0, unmatched: [] };
        const mine = brews.filter(b => b.owner.toLowerCase() === owner && b.seats === 2);
        for (const m of (Array.isArray(body.matches) ? body.matches : []).slice(0, 200)) {
          if (!m || !m.matchId || !m.result) continue;
          const cards = (m.playerCards || []).map(String).filter(n => !BASIC.test(n));
          const hb = mine.find(b => (b.realMatches || []).some(x => x.matchId === m.matchId)), had = hb && hb.realMatches.find(x => x.matchId === m.matchId);
          if (had) {
            const nl = leaksIn(m.leaks); if (nl && (!had.leaks || nl.grade > (had.leaks.grade || 0))) { had.leaks = nl; out.leaks = (out.leaks || 0) + 1; } // a newer grading replaces the old
            const pv = playedV(hb, cards); if (pv !== had.v) { had.v = pv; out.retagged = (out.retagged || 0) + 1; }
            out.known++; continue;
          }
          let best = null, bs = 0;
          for (const b of mine) { const names = new Set(current(b).list.main.map(c => c.name)), share = cards.length ? cards.filter(n => names.has(n)).length / cards.length : 0; if (share > bs) { best = b; bs = share; } }
          if (!best || bs < 0.5) { out.unmatched.push(m.matchId); continue; }
          (best.realMatches = best.realMatches || []).push({ matchId: String(m.matchId).slice(0, 60), at: m.at || null, event: String(m.event || '').slice(0, 60), won: !!m.result.won,
            onThePlay: m.games && m.games[0] ? m.games[0].onThePlay : null, opponent: await archetypeOf((m.opponentCards || []).map(String), best.format), v: playedV(best, cards), games: (m.games || []).length, leaks: leaksIn(m.leaks) });
          out.added++;
        }
        if (out.added || out.leaks || out.retagged) saveBrews();
        return send(res, 200, out);
      }
      return send(res, 404, { error: 'not found' });
    }
    // a shared deck guide: no login, read-only, the owner's name only
    const gm = req.method === 'GET' && p.match(/^\/api\/guide\/([a-f0-9]{16})$/);
    if (gm) {
      const b = brews.find(x => x.share && x.share.token === gm[1]); if (!b) return send(res, 404, { error: 'no such guide' });
      const g = guideOf(b, b.share.v || current(b).v); delete g.real; g.shared = true;
      return send(res, 200, g);
    }
    const user = await currentUser(req);
    if (!user) return send(res, 401, { error: 'login required' });
    markSeen(user.name);

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

    if (p === '/api/account' && req.method === 'GET') return send(res, 200, accountView(user));
    // the mail toggles: { mail: { digest, runDone } }
    if (p === '/api/account' && req.method === 'PATCH') {
      const { mail: m } = await readBody(req);
      if (m && typeof m === 'object') A.setMail(user.accountId, m);
      return send(res, 200, accountView(user));
    }
    // a new address, proved by the code sent to it (POST /api/auth/code {email, purpose: 'change'})
    if (p === '/api/account/email' && req.method === 'POST') {
      const { email, code } = await readBody(req);
      const ip = clientIp(req);
      if (tooMany('verify', ip, 20, 15 * 60e3)) return send(res, 429, { error: 'too many tries, wait 15 minutes' });
      const c = A.checkCode(email, 'change', code);
      if (!c.ok) { tried('verify', ip); return send(res, 401, { error: c.error }); }
      if (c.accountId !== user.accountId) return send(res, 403, { error: 'That code was for another account.' });
      try { A.setEmail(user.accountId, c.email); } catch (e) { return send(res, 409, { error: e.message }); }
      return send(res, 200, accountView(user));
    }
    // a simulator account can delete itself and its decks; a founder's account goes through Justin
    if (p === '/api/account' && req.method === 'DELETE') {
      if (user.source !== 'sim') return send(res, 400, { error: 'a founder account is removed by Justin' });
      for (const b of brews.filter(x => x.owner === user.name)) { for (const r of [...b.runs, ...(b.craftRuns || [])]) { const j = r.jobId && jobs.get(r.jobId); if (j) cancelJob(j); } try { fs.unlinkSync(path.join(DATA, 'covers', b.id + '.img')); } catch {} }
      brews = brews.filter(x => x.owner !== user.name); saveBrews(); collection.remove(user.name); push.remove(user.name);
      A.db.prepare('DELETE FROM accounts WHERE id = ?').run(user.accountId);
      console.log(`account deleted: ${user.name}`);
      return send(res, 200, { ok: true }, { 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0` });
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
      const b = brews.find(x => x.id === m[1] && canSee(user.name, x.owner)); const f = b && b.coverUrl && path.join(DATA, 'covers', b.id + '.img');
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
      // refresh stale prices in the background (the card cache asks Scryfall again after a week); this answer uses what's cached
      meta.cards([...new Set(mine.flatMap(b => latest(b).list.main.concat(latest(b).list.side || []).map(c => c.name)))]).catch(() => {});
      return send(res, 200, { brews: mine.map(brewView), queueLength: queue.length, bo3: sideboard.available(), limits: limitsFor(user) });
    }
    if (p === '/api/brews' && req.method === 'POST') {
      const r = await createBrew(user, await readBody(req));
      return r.error ? send(res, r.status, { error: r.error, ...(r.legality ? { legality: r.legality } : {}) }) : send(res, 200, brewView(r.b));
    }
    if ((m = p.match(/^\/api\/brews\/(\w+)\/versions$/)) && req.method === 'POST') {
      const b = brews.find(x => x.id === m[1] && x.owner === user.name); if (!b) return send(res, 404, { error: 'no such brew' });
      const { list: given, note, from, swaps, run: runIt, origin: asked } = await readBody(req);
      // change 20: { from, swaps: [{out, in}] } makes the list from version `from` (one copy out, one in, per swap)
      let list = given;
      if (!list && Array.isArray(swaps) && swaps.length) {
        const base = b.versions.find(x => x.v === from) || current(b), main = base.list.main.map(c => ({ ...c }));
        for (const sw of swaps.slice(0, 15)) {
          const o = main.find(c => c.name === sw.out); if (!o || !sw.in) return send(res, 400, { error: `${sw.out || 'a card'} isn't in v${base.v}.` });
          o.qty--; const i = main.find(c => c.name === sw.in); if (i) i.qty++; else main.push({ qty: 1, name: String(sw.in).slice(0, 80) });
        }
        list = { ...base.list, main: main.filter(c => c.qty > 0) };
      }
      const deck = { main: list?.main || [], side: list?.side || [], commander: list?.commander || [] };
      if (!validDeck(deck.main.length ? deck : { ...deck, main: deck.commander })) return send(res, 400, { error: 'that list has no cards' });
      const d = await meta.describeDeck(deck, b.seats === 4 ? null : b.format);
      if (d.legality && !d.legality.ok) return send(res, 400, { error: meta.legalityError(d.legality), legality: d.legality });
      if ((d.format === 'commander') !== (b.seats === 4)) return send(res, 400, { error: b.seats === 4 ? 'This brew is a Commander deck; that list has no commander.' : "That's a Commander list. Paste it as a new deck instead." });
      const prev = b.versions.find(x => x.v === from) || current(b), diff = diffLists(prev.list, d.list);
      if (!diff.length) return send(res, 400, { error: `That's the same list as v${prev.v}.` });
      const origin = ['pasted', 'edited', 'owned'].includes(asked) ? asked : /^owned version/.test(String(note || '')) ? 'owned' : given ? 'pasted' : 'edited';
      const nv = pushVersion(b, origin, { list: d.list, rows: d.rows, style: d.style, diff, base: prev.v, ...(note && String(note).trim() ? { note: String(note).trim().slice(0, 500) } : {}) });
      readSoon(b, nv);
      if (note && String(note).trim()) b.notes.push({ k: crypto.randomBytes(3).toString('hex'), t: String(note).trim().slice(0, 500) });
      saveBrews();
      await checkSoon(b);
      if (runIt) { const r = startRun(b, user, nv.v, 'meta10'); if (r.error) return send(res, 200, { ...brewView(b), runError: r.error }); }
      return send(res, 200, brewView(b));
    }
    // ---- the deck is the player's choice (NOTE-TO-CODE-16OCT-STATE.md A-C, 16 Oct 2026) ----
    // make a version the deck: runs, the plan, the guide and the coach read it from now on
    if ((m = p.match(/^\/api\/brews\/(\w+)\/current$/)) && req.method === 'POST') {
      const b = brews.find(x => x.id === m[1] && x.owner === user.name); if (!b) return send(res, 404, { error: 'no such brew' });
      const { v } = await readBody(req); if (!b.versions.some(x => x.v === v)) return send(res, 404, { error: `There's no v${v}.` });
      b.current = v;
      if (b.optimize && b.optimize.guide && b.optimize.guide.v === v) { const { v: _v, ...g } = b.optimize.guide; b.guide = g; delete b.optimize.guide; }   // Optimize's plan for v comes with it
      saveBrews(); return send(res, 200, brewView(b));
    }
    // discard a version nobody chose (an Optimize or coach proposal, or any version but the current one): its runs go with it
    if ((m = p.match(/^\/api\/brews\/(\w+)\/versions\/(\d+)$/)) && req.method === 'DELETE') {
      const b = brews.find(x => x.id === m[1] && x.owner === user.name); if (!b) return send(res, 404, { error: 'no such brew' });
      const v = +m[2], ver = b.versions.find(x => x.v === v); if (!ver) return send(res, 404, { error: `There's no v${v}.` });
      if (v === current(b).v) return send(res, 400, { error: `v${v} is your deck. Make another version current first.` });
      if (b.optimize && [b.optimize.v, b.optimize.test && b.optimize.test.v].includes(v) && !['done', 'failed', 'cancelled'].includes(b.optimize.status)) return send(res, 409, { error: `Optimize is still working on v${v}. Cancel it first.` });
      for (const r of b.runs.filter(r => r.v === v)) { const j = r.jobId && jobs.get(r.jobId); if (j) cancelJob(j); }
      b.maxV = Math.max(b.maxV || 0, ...b.versions.map(x => x.v));   // a discarded number is never reused
      b.runs = b.runs.filter(r => r.v !== v); b.versions = b.versions.filter(x => x.v !== v); saveBrews();
      return send(res, 200, brewView(b));
    }
    // what a run will do before it's queued: "Run v3 · 200 games · ~30 min · Oct 16 field · 1 run ahead"
    if ((m = p.match(/^\/api\/brews\/(\w+)\/estimate$/)) && req.method === 'GET') {
      const b = brews.find(x => x.id === m[1] && x.owner === user.name); if (!b) return send(res, 404, { error: 'no such brew' });
      const vq = +u.searchParams.get('v'), v = b.versions.some(x => x.v === vq) ? vq : current(b).v;
      const set = oppSets(b).find(x => x.id === (u.searchParams.get('oppSet') || 'meta10')) || oppSets(b)[0];
      const ahead = queue.filter(j => j.brew && !j.low && ['queued', 'running'].includes(j.status)).length;
      return send(res, 200, { v, current: v === current(b).v, oppSet: set.id, field: set.title, games: set.n * GAMES * (b.seats === 2 && sideboard.available() ? 2 : 1), time: set.time, credits: set.credits, ahead,
        line: `Run v${v} · ${set.n * GAMES * (b.seats === 2 && sideboard.available() ? 2 : 1)} games · ${set.time} · ${set.title.replace(/^The field · /, '')}${ahead ? ` · ${ahead} run${ahead === 1 ? '' : 's'} ahead` : ''}` });
    }
    // Suggestions (Justin, 16 Oct: "Optimize should provide ideas and suggestions, but clicking it shouldn't change a
    // bunch of shit"): everything the sim and the collection know that could improve this version, each with the
    // exact swap, nothing saved and nothing run. Applying one is a separate POST /versions the player confirms.
    if ((m = p.match(/^\/api\/brews\/(\w+)\/suggestions$/)) && req.method === 'GET') {
      const b = brews.find(x => x.id === m[1] && x.owner === user.name); if (!b) return send(res, 404, { error: 'no such brew' });
      const vq = +u.searchParams.get('v'), ver = b.versions.find(x => x.v === vq) || current(b);
      const paper = collection.get(b.owner).paper || null, budget = settingsOf(b).budget, mode = (budget && budget.mode) || 'any';
      const owned = (paper && paper.cards) || {}, items = [];
      const pairs = (outs, ins) => { const o = outs.flatMap(c => Array(c.qty).fill(c.name)), i = ins.flatMap(c => Array(c.qty).fill(c.name)); return o.length === i.length && o.length ? o.map((x, k) => ({ out: x, in: i[k] })) : null; };
      const own = n => paper ? Math.min(1, (owned[n] || 0)) : null;
      // 1. structure: the deck check's fixes, as swaps (within the Cards dial)
      const field = fieldLists(b.format);
      const st = field && b.seats === 2 ? await shell.structure(ver.list, { field, format: b.format, paper, budget }) : null;
      if (st && st.swaps.length) {
        const groups = new Map(); for (const sw of st.swaps) { const k = sw.out + '>' + sw.in; groups.set(k, (groups.get(k) || 0) + 1); }
        [...groups].forEach(([k, n], i) => { const [o, inn] = k.split('>');
          items.push({ id: 's' + i, kind: 'structure', title: st.lines[i] || `−${n} ${o}, +${n} ${inn}`, why: 'From the deck check: mana and curve against the numbers that make a list cast its spells on time.',
            out: [{ qty: n, name: o }], in: [{ qty: n, name: inn }], swaps: Array(n).fill({ out: o, in: inn }), owned: own(inn) }); });
      }
      // 2-3. the sim's own tests of owned substitutes (change 20): free swaps, and buys worth points
      const cr = b.craft && b.craft.rows && b.runs.find(r => r.id === b.craft.run && r.v === ver.v) ? b.craft.rows : [];
      cr.forEach((r, i) => {
        const outS = r.out.map(c => c.qty + ' ' + c.name).join(', '), inS = r.in.map(c => c.qty + ' ' + c.name).join(', ');
        if (r.hi >= 0) items.push({ id: 'o' + i, kind: 'owned', title: `Play ${inS} instead of buying ${outS}`, why: `Tested in the sim: ${r.delta >= 0 ? '+' : '−'}${Math.abs(r.delta)} points, inside the noise${r.savesUsd != null ? `, and it saves $${r.savesUsd.toFixed(2)}` : ''}.`,
          out: r.out, in: r.in, swaps: pairs(r.out, r.in), evidence: r.games ? 'tested' : null });
        else items.push({ id: 'b' + i, kind: 'buy', title: `Buy ${outS}`, why: `Tested in the sim: playing ${inS} instead costs ${Math.abs(r.delta)} points (${Math.abs(r.hi)} to ${Math.abs(r.lo)}).${r.savesUsd != null ? ` About $${r.savesUsd.toFixed(2)}.` : ''}`,
          out: [], in: r.out, swaps: null, usd: r.savesUsd ?? null });
      });
      // 4. the coach's matchup swaps from this version's newest finished run
      const done = b.runs.find(r => r.v === ver.v && runView(b, r).status === 'done' && r.coach && r.coach.options);
      ((done && done.coach.options) || []).forEach((o, i) => { if (o.kind !== 'swap' || !o.out || !o.in) return;
        items.push({ id: 'c' + i, kind: 'coach', title: o.title, why: o.detail, evidence: o.evidence || null, basis: o.basis || '', out: o.out, in: o.in, swaps: pairs(o.out, o.in),
          missing: paper ? o.in.filter(c => (owned[c.name] || 0) < c.qty).map(c => ({ qty: c.qty - (owned[c.name] || 0), name: c.name, price: meta.cardFacts(c.name).price ?? null })) : null }); });
      // what the list is missing from the collection, priced
      const missing = paper ? [...ver.list.main, ...(ver.list.side || [])].filter(c => !/^(Plains|Island|Swamp|Mountain|Forest|Wastes)$/.test(c.name) && (owned[c.name] || 0) < c.qty)
        .map(c => ({ qty: c.qty - (owned[c.name] || 0), name: c.name, price: meta.cardFacts(c.name).price ?? null })) : null;
      return send(res, 200, { v: ver.v, current: ver.v === current(b).v, cards: mode, collection: paper ? { size: paper.size, at: paper.at, source: paper.source } : null,
        items, missing, missingUsd: missing ? +missing.reduce((t, c) => t + (c.price || 0) * c.qty, 0).toFixed(2) : null,
        note: !paper ? 'Paste your ManaBox export to get suggestions from the cards you own.' : !done ? `Run v${ver.v} for the coach's matchup swaps; the fixes below need no games.` : '' });
    }
    // Optimize, before it starts: what it will change and how long it takes. Nothing is saved.
    if ((m = p.match(/^\/api\/brews\/(\w+)\/optimize\/preview$/)) && req.method === 'GET') {
      const b = brews.find(x => x.id === m[1] && x.owner === user.name); if (!b) return send(res, 404, { error: 'no such brew' });
      if (b.seats !== 2) return send(res, 400, { error: 'Optimize is for 60-card decks.' });
      const field = fieldLists(b.format); if (!field) return send(res, 400, { error: `No ${b.format} field yet to optimize against.` });
      const fq = +u.searchParams.get('from'), ver = b.versions.find(x => x.v === fq) || current(b);
      const budget = settingsOf(b).budget, st = await shell.structure(ver.list, { field, format: b.format, paper: collection.get(b.owner).paper || null, budget });
      const set = oppSets(b).find(x => x.id === 'meta10'), next = Math.max(b.maxV || 0, ...b.versions.map(x => x.v)) + 1, changes = !!(st && st.swaps.length);
      return send(res, 200, { from: ver.v, saves: changes ? next : null, structure: st ? st.lines : [], usd: st ? st.usd || 0 : 0, cards: (budget && budget.mode) || 'any', time: set ? set.time : '',
        steps: [changes ? `Structure: save the fixes as v${next}; v${ver.v} stays your deck` : `Structure: v${ver.v} needs no structural change`, `Run v${changes ? next : ver.v} against this week's top 10${set ? ' (' + set.time + ')' : ''}`, 'Test the coach\'s best swap for the worst matchup', 'Write it up'],
        after: changes ? `Then you choose: make v${next} your deck, run v${ver.v} to compare, or discard v${next}.` : '' });
    }
    if ((m = p.match(/^\/api\/brews\/(\w+)\/optimize\/cancel$/)) && req.method === 'POST') {
      const b = brews.find(x => x.id === m[1] && x.owner === user.name); if (!b) return send(res, 404, { error: 'no such brew' });
      const o = b.optimize; if (!o || ['done', 'failed', 'cancelled'].includes(o.status)) return send(res, 400, { error: 'Optimize isn\'t working on this deck.' });
      for (const id of [o.run, o.test && o.test.run].filter(Boolean)) { const r = b.runs.find(x => x.id === id); const j = r && r.jobId && jobs.get(r.jobId); if (j) cancelJob(j); if (r) r.cancelled = true; }
      optLine(b, 'cancelled', 'Cancelled. Your deck is unchanged.'); saveBrews();
      return send(res, 200, brewView(b));
    }
    if ((m = p.match(/^\/api\/brews\/(\w+)\/optimize$/)) && req.method === 'POST') {
      const b = brews.find(x => x.id === m[1] && x.owner === user.name); if (!b) return send(res, 404, { error: 'no such brew' });
      if (b.seats !== 2) return send(res, 400, { error: 'Optimize is for 60-card decks.' });
      if (b.optimize && !['done', 'failed', 'cancelled'].includes(b.optimize.status)) return send(res, 409, { error: 'Optimize is already working on this deck.' });
      const field = fieldLists(b.format); if (!field) return send(res, 400, { error: `No ${b.format} field yet to optimize against.` });
      const { from } = await readBody(req), ver = b.versions.find(x => x.v === from) || current(b);
      const paper = collection.get(b.owner).paper || null, budget = settingsOf(b).budget;
      const st = await shell.structure(ver.list, { field, format: b.format, paper, budget });
      if (!st) return send(res, 400, { error: 'That list has nothing to check against yet.' });
      b.optimize = { status: 'structure', from: ver.v, v: ver.v, steps: [], at: Date.now(), who: { name: user.name, accountId: user.accountId, plan: user.plan, source: user.source, isAdmin: user.isAdmin } };
      if (st.swaps.length) {
        const d = await meta.describeDeck(st.list, b.format), diff = diffLists(ver.list, d.list);
        if (diff.length && !(d.legality && !d.legality.ok)) {
          const note = 'Optimize, structure: ' + st.lines.join('; ');
          const nv = pushVersion(b, 'optimize', { list: d.list, rows: d.rows, style: d.style, diff, base: ver.v, note });
          readSoon(b, nv); b.optimize.v = nv.v;
          optLine(b, 'structure', `Structure: ${st.lines.join('; ')}${st.usd ? ` (about $${st.usd.toFixed(2)} of cards you don't own)` : ''}. Saved as v${nv.v}; v${ver.v} stays your deck until you choose.`);
        } else optLine(b, 'structure', `Structure: v${ver.v} already matches its shell, nothing to change.`);
      } else optLine(b, 'structure', `Structure: ${st.check.archetype ? `v${ver.v} already matches ${st.check.archetype}` : `v${ver.v} has no meta shell to match, so only its mana was checked, and it holds`}. Nothing to change.`);
      const r = startRun(b, user, b.optimize.v, 'meta10');
      if (r.error) { optLine(b, 'failed', `I couldn't start the run: ${r.error}`); return send(res, 200, brewView(b)); }
      b.optimize.run = r.run.id; optLine(b, 'running', `Running v${b.optimize.v} against this week's top 10.`);
      return send(res, 200, brewView(b));
    }
    if ((m = p.match(/^\/api\/brews\/(\w+)\/run$/)) && req.method === 'POST') {
      const b = brews.find(x => x.id === m[1] && x.owner === user.name); if (!b) return send(res, 404, { error: 'no such brew' });
      const body = await readBody(req);
      const r = startRun(b, user, body.v, body.oppSet);
      return r.error ? send(res, r.status, { error: r.error }) : send(res, 200, brewView(b));
    }
    // ask the coach: the question goes in the thread now, the answer when it is written
    // card search for editing a list (Design's change 7): ?q=<text>&format=<f>, 8 results
    // push (change 18): the VAPID public key, and a device's subscription
    if (p === '/api/push/key' && req.method === 'GET') return send(res, 200, { key: push.key() });
    if (p === '/api/push/subscribe' && req.method === 'POST') {
      try { return send(res, 200, push.subscribe(user.name, await readBody(req))); } catch (e) { if (e.status) return send(res, e.status, { error: e.message }); throw e; }
    }
    // the collection (changes 20 and 22): both shelves; 404 while neither has anything
    if (p === '/api/collection' && req.method === 'GET') {
      const c = collection.get(user.name);
      return c.paper || c.arena ? send(res, 200, c) : send(res, 404, { error: 'no collection yet' });
    }
    // brew from your collection (change 22 §C): suggestions, cached per collection and field; a started one links to its brew
    if (p === '/api/collection/brews' && req.method === 'GET') {
      const r = await collectionBrews(user.name); if (!r) return send(res, 404, { error: 'no paper collection or no field yet' });
      const mine = brews.filter(b => b.owner === user.name && b.fromRow);
      return send(res, 200, { ...r, rows: r.rows.map(x => { const b = mine.find(y => y.fromRow === x.id), run = b && b.runs.find(q => runView(b, q).status === 'done'), sc = run && runView(b, run).score;
        return { ...x, list: undefined, brew: b ? b.id : null, p: sc ? sc.p : null, lo: sc ? sc.lo : null, hi: sc ? sc.hi : null }; }) });
    }
    if ((m = p.match(/^\/api\/collection\/brews\/([\w-]+)\/start$/)) && req.method === 'POST') {
      const r = await collectionBrews(user.name), row = r && r.rows.find(x => x.id === m[1]);
      if (!row) return send(res, 404, { error: 'That suggestion is gone; the field or your collection changed.' });
      const made = await createBrew(user, { list: row.list, name: row.name, format: 'standard', note: 'Brewed from your collection: ' + row.why, settings: { budget: { mode: 'owned' } } });
      if (made.error) return send(res, made.status, { error: made.error });
      made.b.fromRow = row.id; saveBrews();
      const run = startRun(made.b, user, 1, 'meta10');
      return send(res, 200, { ...brewView(made.b), ...(run.error ? { runError: run.error } : {}) });
    }
    if (p === '/api/field/craft' && req.method === 'GET') {
      const fc = await fieldCraft(user.name, FORMATS.includes(u.searchParams.get('format')) ? u.searchParams.get('format') : 'standard');
      return fc ? send(res, 200, fc) : send(res, 404, { error: 'no paper collection or no field yet' });
    }
    if (p === '/api/collection/paper' && req.method === 'POST') {
      const { text } = await readBody(req);
      try { const shelf = await collection.setPaper(user.name, text); brews.filter(b => b.owner === user.name).forEach(ensureChecks); return send(res, 200, shelf); } catch (e) { if (e.status) return send(res, e.status, { error: e.message }); throw e; }
    }
    // change 26: the paste is reversible, one step back
    if (p === '/api/collection/paper/undo' && req.method === 'POST') {
      const shelf = collection.undoPaper(user.name); if (!shelf) return send(res, 404, { error: 'Nothing to undo.' });
      brews.filter(b => b.owner === user.name).forEach(ensureChecks); return send(res, 200, shelf);
    }
    if (p === '/api/cards' && req.method === 'GET') {
      const q = String(u.searchParams.get('q') || '').slice(0, 60), f = String(u.searchParams.get('format') || 'standard').toLowerCase();
      if (!FORMATS.includes(f) && f !== 'commander') return send(res, 400, { error: 'unknown format' });
      return send(res, 200, { cards: await cardSearch.search(q, f, { version: forgeVersion() }) });
    }
    // an edited list against the brew's current version, before it's saved (Design's change 7): what
    // changed, whether it's legal, what Forge makes of each card, and the version it would become
    if ((m = p.match(/^\/api\/brews\/(\w+)\/check$/)) && req.method === 'POST') {
      const b = brews.find(x => x.id === m[1] && x.owner === user.name); if (!b) return send(res, 404, { error: 'no such brew' });
      const { list, text } = await readBody(req);
      const parsed = text ? meta.parseList(String(text)) : list;
      const deck = { main: parsed?.main || [], side: parsed?.side || [], commander: parsed?.commander || [] };
      if (!validDeck(deck.main.length ? deck : { ...deck, main: deck.commander })) return send(res, 400, { error: 'that list has no cards' });
      const d = await meta.describeDeck(deck, b.seats === 4 ? null : b.format), cur = current(b), diff = diffLists(cur.list, d.list);
      const count = l => (l || []).reduce((t, c) => t + c.qty, 0), size = count(d.list.main);
      const tally = l => { const t = new Map(); for (const c of l || []) t.set(c.name, (t.get(c.name) || 0) + c.qty); return t; }, curMain = tally(cur.list.main), newMain = tally(d.list.main);
      const shared = [...newMain].reduce((t, [n, q]) => t + Math.min(q, curMain.get(n) || 0), 0);
      const ai = aihints.scan(d.list, { version: forgeVersion(), commander: b.seats === 4 });
      const problems = [];
      if (b.seats === 2 && size < 60) problems.push(`${size} cards in the main deck; a constructed deck needs 60`);
      if (b.seats === 2 && count(d.list.side) > 15) problems.push(`${count(d.list.side)} sideboard cards; the limit is 15`);
      if (d.legality && !d.legality.ok) problems.push(meta.legalityError(d.legality));
      return send(res, 200, { diff, shared, size, sideSize: count(d.list.side), currentSize: count(cur.list.main), becomes: diff.length ? Math.max(b.maxV || 0, ...b.versions.map(x => x.v)) + 1 : null, unchanged: !diff.length,
        legality: d.legality, forge: { unplayable: ai.unplayable, limited: ai.limited, missing: ai.missing }, problems, saveable: !!diff.length && !problems.length, list: d.list, rows: d.rows });
    }
    // the coach's answer so far, while it is being written: small, so the page can ask often
    if ((m = p.match(/^\/api\/brews\/(\w+)\/draft$/)) && req.method === 'GET') {
      const b = brews.find(x => x.id === m[1] && x.owner === user.name); if (!b) return send(res, 404, { error: 'no such brew' });
      return send(res, 200, { thinking: !!b.thinking, draft: b.thinking ? b.draft || '' : '' });
    }
    // a coach mode on request (sideboard, pilot, mulligan, mana, review): the answer lands in the thread
    if ((m = p.match(/^\/api\/brews\/(\w+)\/coach$/)) && req.method === 'POST') {
      const b = brews.find(x => x.id === m[1] && x.owner === user.name); if (!b) return send(res, 404, { error: 'no such brew' });
      if (!claude.available()) return send(res, 400, { error: 'the coach needs an API key on the server' });
      if (b.thinking) return send(res, 409, { error: 'the coach is still answering' });
      const { mode, opponent } = await readBody(req);
      if (!coach.MODES.includes(mode)) return send(res, 400, { error: 'modes: ' + coach.MODES.join(', ') });
      if (mode === 'review' && b.versions.length < 2) return send(res, 400, { error: 'a review needs two versions' });
      const no = refusal(user, 'ask'); if (no) return send(res, 429, { error: no });
      const paid = A.reserve(user.accountId, { kind: 'ask', credits: ASK_CREDITS, note: `${b.name} · a coach question` });
      if (!paid.ok) return send(res, 402, { error: `A question needs ${paid.need} credits; you have ${paid.have}.` });
      usage.mark(user.name, 'ask');
      b.thinking = true; saveBrews();
      const rv = coachRun(b, talkRun(b)), opp = mode === 'pilot' ? String(opponent || '').slice(0, 80) || null : null;
      b.thread = b.thread || [];
      usage.as({ who: user.name, kind: 'coach-' + mode, brew: b.id }, () => coach.mode(b, rv, mode, { opp, onText: t => { b.draft = t; } }))
        .then(out => {
          if (mode === 'sideboard') { b.guide = { rows: (out.rows || []).slice(0, 20), run: rv.id || null, at: Date.now() }; b.thread.push({ role: 'coach', text: 'Sideboard guide: ' + b.guide.rows.map(r => `${r.opponent} (${r.role}): in ${r.in.map(c => c.qty + ' ' + c.name).join(', ') || 'nothing'}, out ${r.out.map(c => c.qty + ' ' + c.name).join(', ') || 'nothing'}. ${r.why}`).join('\n'), at: Date.now(), kind: 'sideboard' }); }
          else b.thread.push({ role: 'coach', text: String(out).slice(0, 6000), at: Date.now(), kind: mode, ...(opp ? { opponent: opp } : {}) });
        })
        .catch(e => b.thread.push({ role: 'coach', text: 'I couldn\'t do that: ' + e.message, at: Date.now(), kind: 'error' }))
        .finally(() => { b.thinking = false; delete b.draft; saveBrews(); });
      return send(res, 200, { ok: true });
    }
    if ((m = p.match(/^\/api\/brews\/(\w+)\/ask$/)) && req.method === 'POST') {
      const b = brews.find(x => x.id === m[1] && x.owner === user.name); if (!b) return send(res, 404, { error: 'no such brew' });
      if (!claude.available()) return send(res, 400, { error: 'the coach needs an API key on the server' });
      if (b.thinking) return send(res, 409, { error: 'the coach is still answering' });
      const text = String((await readBody(req)).text || '').trim().slice(0, 2000); if (!text) return send(res, 400, { error: 'ask something' });
      const no = refusal(user, 'ask'); if (no) return send(res, 429, { error: no });
      const paid = A.reserve(user.accountId, { kind: 'ask', credits: ASK_CREDITS, note: `${b.name} · a coach question` });
      if (!paid.ok) return send(res, 402, { error: `A question needs ${paid.need} credits; you have ${paid.have}.` });
      usage.mark(user.name, 'ask');
      (b.thread = b.thread || []).push({ role: 'user', text, at: Date.now() }); b.thinking = true; saveBrews(); const asked = b.thread.length;
      usage.as({ who: user.name, kind: 'chat', brew: b.id }, () => coach.act(b, coachRun(b, talkRun(b)), b.thread.slice(), { ...coachTools(b, user), onText: t => { b.draft = t; } }))
        .then(t => { b.thread.push({ role: 'coach', text: t.slice(0, 6000), at: Date.now() }); pushTo(b.owner, 'coach', { title: `The coach on ${b.name}`, body: (t.match(/^[^.!?]*[.!?]/) || [t.slice(0, 140)])[0].slice(0, 200), url: deckPath(b, 'coach') }); })
        .catch(e => { const acted = b.thread.slice(asked).some(t => t.kind === 'action');   // the change stands; only the words are missing
          b.thread.push({ role: 'coach', text: acted ? 'The change above is done, but I couldn\'t finish my answer: ' + e.message : 'I couldn\'t answer that: ' + e.message, at: Date.now(), kind: 'error' }); })
        .finally(() => { b.thinking = false; delete b.draft; saveBrews(); });
      return send(res, 200, brewView(b));
    }
    // Undo one of the coach's actions (its `at`): a save goes back to the version that was the deck and the new one is
    // discarded if nothing ran on it; a switch goes back; a run is cancelled. Only while nothing has moved on since.
    if ((m = p.match(/^\/api\/brews\/(\w+)\/undo$/)) && req.method === 'POST') {
      const b = brews.find(x => x.id === m[1] && x.owner === user.name); if (!b) return send(res, 404, { error: 'no such brew' });
      const at = +(await readBody(req)).at, line = (b.thread || []).find(t => t.kind === 'action' && t.action && t.action.at === at), a = line && line.action;
      if (!a) return send(res, 404, { error: 'nothing to undo' });
      if (a.undone) return send(res, 400, { error: 'already undone' });
      let said;
      if (a.type === 'save' || a.type === 'current') {
        if (a.type === 'current' || a.live) {
          if (current(b).v !== a.v) return send(res, 409, { error: `v${current(b).v} is your deck now, not v${a.v}. Switch decks from Versions instead.` });
          if (b.versions.some(x => x.v === a.prev)) b.current = a.prev;
        }
        const busy = b.runs.some(r => r.v === a.v);
        if (a.type === 'save' && !busy && current(b).v !== a.v) { b.maxV = Math.max(b.maxV || 0, ...b.versions.map(x => x.v)); b.versions = b.versions.filter(x => x.v !== a.v); }
        said = a.type === 'save' ? `Undone: ${b.versions.some(x => x.v === a.v) ? `v${a.v} kept (it has runs)` : `v${a.v} discarded`}${a.live ? `, v${a.prev} is your deck again` : ''}.` : `Undone: v${a.prev} is your deck again.`;
      } else if (a.type === 'run') {
        const r = b.runs.find(x => x.id === a.run), j = r && r.jobId && jobs.get(r.jobId);
        if (!r || ['done', 'failed', 'cancelled', 'lost'].includes(runView(b, r).status)) return send(res, 409, { error: 'that run has already finished' });
        if (j) cancelJob(j); if (r.status === 'preparing') r.status = 'cancelled'; r.cancelled = true;   // as the run's own Cancel does
        said = `Undone: the run of v${a.v} is cancelled.`;
      } else return send(res, 400, { error: 'nothing to undo' });
      a.undone = Date.now(); b.thread.push({ role: 'coach', kind: 'undo', text: said, at: Date.now() }); saveBrews();
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
      const d = await meta.describeDeck(list, b.seats === 4 ? null : b.format), diff = diffLists(base.list, d.list);
      if (d.legality && !d.legality.ok) return send(res, 400, { error: meta.legalityError(d.legality) });
      if (!diff.length) return send(res, 400, { error: 'that is the current list already' });
      const nr = { id: crypto.randomBytes(4).toString('hex'), v: Math.max(b.maxV || 0, ...b.versions.map(x => x.v)) + 1, oppSet: run.oppSet, created: Date.now(), status: 'preparing' };
      const set = oppSets(b).find(x => x.id === run.oppSet);
      const paid = A.reserve(user.accountId, { ref: nr.id, credits: set ? set.credits : 0, note: `${b.name} v${nr.v} · testing a swap` });
      if (!paid.ok) return send(res, 402, { error: `This run needs ${paid.need} credits; you have ${paid.have}.` });
      const nv = pushVersion(b, 'coach', { list: d.list, rows: d.rows, style: d.style, diff, base: base.v, from: { run: run.id, option: i } });
      readSoon(b, nv);
      o.test = { v: nv.v, run: nr.id };
      b.runs.unshift(nr); saveBrews(); usage.mark(user.name, 'run');
      prepareRun(b, nr, user);
      return send(res, 200, brewView(b));
    }
    // rename a brew and/or change its cover: a card from its newest list, or a new upload
    if ((m = p.match(/^\/api\/brews\/(\w+)$/)) && req.method === 'PATCH') {
      const b = brews.find(x => x.id === m[1] && x.owner === user.name); if (!b) return send(res, 404, { error: 'no such brew' });
      const { name, cover, settings, share, weeklySeen } = await readBody(req);
      // the weekly badge: the page clears it once the owner has opened the brew
      if (weeklySeen === true && b.weekly) b.weekly.seen = true;
      // the guide's share link: true mints one (always the newest version), false revokes it
      if (share === true && !user.isAdmin && !A.planOf(user.plan).features.sharing) return send(res, 403, { error: "Sharing the guide isn't on the free plan." });
      if (share === true) b.share = { token: b.share ? b.share.token : crypto.randomBytes(8).toString('hex'), at: Date.now() };
      else if (share === false) delete b.share;
      if (settings && typeof settings === 'object') b.settings = cleanSettings(settings, b.settings || {});
      if (name != null) { const n = String(name).trim().slice(0, 60); if (!n) return send(res, 400, { error: 'give it a name' }); b.name = n; }
      if (cover?.upload) {
        try { b.coverUrl = saveCover(b.id, cover.upload) + '?v=' + Date.now(); b.coverType = coverTypes[b.id]; } catch (e) { return send(res, 400, { error: e.message }); }
      } else if (cover?.card) {
        if (!(current(b).rows || []).some(r => r.name === cover.card && !r.land)) return send(res, 400, { error: 'that card isn\'t in the list' });
        b.coverCard = cover.card;
        if (b.coverUrl) { b.coverUrl = null; delete b.coverType; try { fs.unlinkSync(path.join(DATA, 'covers', b.id + '.img')); } catch {} }
      }
      saveBrews();
      return send(res, 200, brewView(b));
    }
    if ((m = p.match(/^\/api\/brews\/(\w+)\/guide$/)) && req.method === 'GET') {
      const b = brews.find(x => x.id === m[1] && x.owner === user.name); if (!b) return send(res, 404, { error: 'no such brew' });
      const v = parseInt(u.searchParams.get('v'), 10);
      const g = guideOf(b, Number.isFinite(v) ? v : current(b).v, { since: b.guideSeenAt || 0 });
      if (!Number.isFinite(v) || v === current(b).v) { b.guideSeenAt = Date.now(); saveBrews(); }
      return send(res, 200, { ...g, share: b.share ? { token: b.share.token, v: b.share.v || null } : null });
    }
    // a match logged by hand (Design's change 9: iPad and paper games the Arena log can't see), pooled with the
    // parsed ones in b.realMatches
    if ((m = p.match(/^\/api\/brews\/(\w+)\/real$/)) && req.method === 'POST') {
      const b = brews.find(x => x.id === m[1] && x.owner === user.name); if (!b) return send(res, 404, { error: 'no such brew' });
      const { opponent, won, onPlay, source, at, games, mulls, id } = await readBody(req);
      const opp = String(opponent || '').trim().slice(0, 60);
      if (!opp || typeof won !== 'boolean') return send(res, 400, { error: 'pick the opponent and the result' });
      const src = ['Arena Bo1', 'Arena Bo3', 'Paper'].includes(source) ? source : 'Paper'; // the sim is a paper tool (change 21)
      const when = at && !isNaN(Date.parse(at)) ? new Date(at).toISOString() : new Date().toISOString();
      // the phone's counter (change 18) sends each game and the mulligans, and its own id, so a match it queued
      // offline and sends twice is filed once
      const matchId = 'manual-' + (/^[\w-]{6,40}$/.test(String(id || '')) ? String(id) : crypto.randomBytes(5).toString('hex'));
      if ((b.realMatches || []).some(x => x.matchId === matchId)) return send(res, 200, brewView(b));
      const gs = Array.isArray(games) ? games.slice(0, 3).filter(g => g && typeof g.won === 'boolean').map(g => ({ won: g.won, onPlay: g.onPlay === true ? true : g.onPlay === false ? false : null, ...([5, 6, 7].includes(+g.mull) ? { mull: +g.mull } : {}) })) : null;
      const ms = Array.isArray(mulls) ? mulls.slice(0, 3).map(Number).filter(x => x >= 0 && x <= 7) : null;
      (b.realMatches = b.realMatches || []).push({ matchId, at: when, event: src, won, onThePlay: onPlay === true ? 'player' : onPlay === false ? 'opponent' : null,
        opponent: opp, v: current(b).v, games: gs && gs.length ? gs.length : null, ...(gs && gs.length ? { gameList: gs } : {}), ...(ms && ms.length ? { mulls: ms } : {}), source: 'manual' });
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
server.listen(PORT, HOST, () => { console.log(`sim listening on ${HOST}:${PORT}, engine ${engineKey(engine())}, accounts via ${STARSHARD_API}\n${config.describe('server')}`); restoreLive(); });
backfill().catch(e => console.error('backfill:', e.message));
setTimeout(() => { cardSearch.forgeView('Plains', forgeVersion()); cardSearch.standardIndex().catch(e => console.warn('card index:', e.message)); }, 20e3); // warm both, so no one waits on the first search
// calibration: refit from what is on disk, then queue anything due, then check every six hours
for (const f of new Set(history.filter(h => h.meta).map(h => h.meta))) refit(f).catch(e => console.error('refit:', e.message));
setTimeout(() => calibrateDue(), 60e3); setInterval(() => calibrateDue(), 6 * 3600e3);
