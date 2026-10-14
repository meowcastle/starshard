// A batch of logged games for the learned-evaluator work (RESEARCH-LEARNED-EVAL-13OCT.md): every
// pairing among the top N meta decks of a calibration file, stock Forge on both seats, or with
// POLICY=reactive (or answers, tapout) that pilot on both seats (and the dead-card list), or with
// POLICY=profiles each deck's profile by its plan (plan.js: tap-out control -> tapout, draw-go control
// -> answers, the rest stock Forge). Each game's per-turn log is written by the bridge.
//
//   FORGE_DIR=... DATA_DIR=... node tools/log-batch.js <calibration.json> <out dir> [top=12] [matches=10] [at once=4]
//
// ONLY="Bant Airbending Combo" plays just that deck against each of the top N (it need not be in the top N).
//
// Writes <out>/logs/<deck A>__<deck B>/m<match>-g<game>.jsonl.gz and <out>/batch.json (results
// per pairing). Rerunning skips pairings already done.
const fs = require('fs');
const path = require('path');
const { runMatches, payoff } = require('../pilot');
const POLICY = process.env.POLICY || null;
const DEAD = [...(() => { try { const j = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'forge-pilot', 'dead-cards.json'), 'utf8')); return Object.entries(j).filter(([k]) => k !== '_').flatMap(([, v]) => v); } catch { return []; } })(),
  // EXTRA_DEAD="Day of Black Sun;Meltstrider's Resolve": test cards for the dead-card list before they go on it
  ...(process.env.EXTRA_DEAD || '').split(';').map(x => x.trim()).filter(Boolean)];
const deadKey = n => String(n).split(' // ')[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const hasDead = d => { const s = new Set(DEAD.map(deadKey)); return d.main.some(c => s.has(deadKey(c.name))); };

const [CAL, OUT, TOP = '12', M = '10', PAR = '4'] = process.argv.slice(2);
const c = JSON.parse(fs.readFileSync(CAL, 'utf8')).standard;
const ONLY = process.env.ONLY || null;
const decks = c.lists.slice(0, +TOP);
if (ONLY) { const o = c.lists.find(l => l.name === ONLY); if (!o) { console.error(`no deck named ${ONLY} in ${CAL}`); process.exit(1); } if (!decks.includes(o)) decks.unshift(o); }
const slug = s => s.replace(/[^\w]+/g, '-');
const file = path.join(OUT, 'batch.json');
fs.mkdirSync(OUT, { recursive: true });
const done = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
const log = (...a) => console.log(new Date().toTimeString().slice(0, 8), ...a);
const seedOf = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return (h >>> 0) % 2147483647; };

const jobs = [];
for (let i = 0; i < decks.length; i++) for (let j = i + 1; j < decks.length; j++) if (!ONLY || decks[i].name === ONLY || decks[j].name === ONLY) jobs.push([decks[i], decks[j]]);
const todo = jobs.filter(([a, b]) => !done[a.name + '|' + b.name]);
log(`${jobs.length} pairings among the top ${decks.length}, ${todo.length} to play, ${M} best-of-threes each, ${POLICY ? 'pilot ' + POLICY + ' on both seats' : 'stock Forge'}`);

// the profile each plan gets, for POLICY=profiles
const PROFILE = { 'tap-out control': process.env.PROFILE_TAPOUT || 'tapout', 'draw-go control': process.env.PROFILE_DRAWGO || 'answers', 'spells-matter': process.env.PROFILE_SPELLS || null };
const policyOf = {};

(async () => {
  if (POLICY === 'profiles') {
    const { planOf } = require('../plan');
    const find = await require('../meta').cards([...new Set(decks.flatMap(d => d.main.map(c => c.name)))]);
    for (const d of decks) {
      const p = await planOf(d, d.name); policyOf[d.name] = PROFILE[p.plan] || null;
      // the spells profile is for a deck built on payoffs that get cheaper (Spellementals: 12), not one splashing a Crab (Prowess)
      if (p.plan === 'spells-matter' && d.main.filter(c => find(c.name) && payoff(find(c.name))).reduce((a, c) => a + c.qty, 0) < 8) policyOf[d.name] = null;
    }
    // as production does (forge.js pilotFor): a deck with no profile and a dead card plays the deadcards policy
    for (const d of decks) if (!policyOf[d.name] && hasDead(d)) policyOf[d.name] = 'deadcards';
    log('profiles: ' + Object.entries(policyOf).filter(([, x]) => x).map(([n, x]) => n + ' ' + x).join(', '));
  }
  let i = 0;
  const t0 = Date.now();
  const slot = async () => {
    for (;;) {
      const p = todo[i++]; if (!p) return;
      const [a, b] = p, key = a.name + '|' + b.name, dir = slug(a.name) + '__' + slug(b.name);
      const pol = POLICY === 'profiles' ? [policyOf[a.name], policyOf[b.name]] : [POLICY, POLICY];
      const r = await runMatches({ decks: [a, b], matches: +M, seed: seedOf(key), own: pol.map(x => x ? ['priority', 'announce_x'] : []), policy: pol, deadCards: POLICY ? DEAD : [], workDir: path.join(OUT, 'work', dir), gameLog: path.join(OUT, 'logs', dir) });
      const won = r.games.filter(g => g.winner === 0).length, lost = r.games.filter(g => g.winner === 1).length;
      done[key] = { dir, won, lost, games: r.games.length, errors: r.errors.slice(0, 2) };
      fs.writeFileSync(file, JSON.stringify(done));
      log(`${key}: ${won}-${lost}${r.errors.length ? ' ERROR ' + r.errors[0].slice(0, 80) : ''}`);
      fs.rmSync(path.join(OUT, 'work', dir), { recursive: true, force: true });
    }
  };
  await Promise.all(Array.from({ length: +PAR }, slot));
  log(`done in ${Math.round((Date.now() - t0) / 60000)} min`);
})().catch(e => { console.error(e); process.exit(1); });
