// A remote player for the sim: runs on another machine (Justin's Mac), checks
// pairings out of the server's queue, plays them with its own Forge, and reports
// results as games finish. Any number can run; each plays WORKER_SLOTS at once.
// Stop it any time: a pairing it was playing goes back in line after two minutes.
//
//   SIM_URL=https://sim.starshard.net SIM_WORKER_TOKEN=... FORGE_DIR=~/forge-worker/forge \
//   WORKER_SLOTS=4 DATA_DIR=~/forge-worker/data node worker.js
//
// Same engine as the server (Forge version, pilot rules and pilot code), or the server turns
// it away: every game in a run is played by the same AI. Needs Java 17 on PATH.
const os = require('os');
const path = require('path');
const fs = require('fs');
const config = require('./config');
config.preset('USE_XVFB', '0');
// forge.js gives Forge this as HOME (its settings live there)
config.preset('DATA_DIR', path.join(os.homedir(), 'forge-worker', 'data'));
config.preset('FORGE_XMX', '1536m');
const { runSim, forgeVersion, engine, engineKey } = require('./forge');

const URL_ = config.SIM_URL.replace(/\/$/, '');
const TOKEN = config.SIM_WORKER_TOKEN;
const SLOTS = Math.max(1, config.WORKER_SLOTS);
const NAME = config.WORKER_NAME;
const DATA = config.DATA_DIR;
const IDLE_MS = 15e3, REPORT_MS = 10e3;
// On a laptop, play only when plugged in (WORKER_AC_ONLY=0 to play on battery too).
const AC_ONLY = process.platform === 'darwin' && config.WORKER_AC_ONLY;
const onAC = () => { if (!AC_ONLY) return true; try { return /AC Power/.test(require('child_process').execFileSync('pmset', ['-g', 'batt'], { encoding: 'utf8' })); } catch { return true; } };
let saidBattery = false;
if (!TOKEN) { console.error('Set SIM_WORKER_TOKEN (the same value as in the sim server\'s .env).'); process.exit(1); }
fs.mkdirSync(DATA, { recursive: true });

const forge = forgeVersion(), eng = engine();
const call = async (p, body) => {
  const r = await fetch(URL_ + p, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN }, body: JSON.stringify({ worker: NAME, forge, engine: eng, ...body }) });
  const text = await r.text();
  return { status: r.status, data: text ? JSON.parse(text) : null };
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toTimeString().slice(0, 8), ...a);

async function slot(n) {
  for (;;) {
    if (!onAC()) { if (!saidBattery) { log('on battery: waiting for power before taking games'); saidBattery = true; } await sleep(60e3); continue; }
    if (saidBattery) { log('plugged in: taking games again'); saidBattery = false; }
    let c;
    try { c = await call('/api/worker/claim'); } catch (e) { log(`slot ${n}: can't reach ${URL_} (${e.message}); retrying`); await sleep(IDLE_MS * 2); continue; }
    if (c.status === 204) { await sleep(IDLE_MS); continue; }
    if (c.status !== 200) { log(`slot ${n}: ${c.data?.error || 'status ' + c.status}`); await sleep(c.status === 409 || c.status === 401 ? 5 * 60e3 : IDLE_MS); continue; }
    const { lease, job, pairing, decks, games, format, clock, seed } = c.data;
    log(`slot ${n}: ${decks.map(d => d.name).join(' vs ')} (${games} games)`);
    const run = runSim({ decks, games, format, clock, seed, workDir: path.join(DATA, 'jobs', job, String(pairing)) });
    let cancelled = false;
    const report = async done => {
      const res = run.results;
      const body = { lease, done, code: done ? done.code : undefined, results: { wins: res.wins, draws: res.draws, games: res.games, warnings: res.warnings, cards: res.cards } };
      for (let tries = 0; tries < (done ? 5 : 1); tries++) {
        try { const r = await call('/api/worker/report', body); if (r.data?.cancel) { cancelled = true; run.child.kill('SIGKILL'); } return; } catch (e) { if (done) await sleep(5e3); }
      }
    };
    const tick = setInterval(() => report(null), REPORT_MS);
    const { code } = await run.done;
    clearInterval(tick);
    if (!cancelled) await report({ code });
    log(`slot ${n}: ${cancelled ? 'cancelled by the server' : 'done ' + run.results.wins.join('-')}`);
    fs.rm(path.join(DATA, 'jobs', job, String(pairing)), { recursive: true, force: true }, () => {});
  }
}

log(`worker ${NAME}: engine ${engineKey(eng)}, ${SLOTS} at once, serving ${URL_}\n${config.describe('worker')}`);
for (let i = 1; i <= SLOTS; i++) slot(i);
