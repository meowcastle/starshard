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
// SIDES=history.json BOARD=1: games 2 and 3 are sideboarded, as live runs are (server.js boardAll). The
// calibration lists carry no sideboards, so each deck takes the 15 of the newest benchmark list of that name
// in a copy of the server's history.json; both sides' plans come from sideboard.js (the coach model, with
// what real pilots carry as the hint, cached in DATA_DIR/plans.json). Without BOARD, games 2-3 are game 1 again.
//
// Writes <out>/logs/<deck A>__<deck B>/m<match>-g<game>.jsonl.gz and <out>/batch.json (results
// per pairing). Rerunning skips pairings already done.
const fs = require('fs');
const path = require('path');
const { runMatches, payoff } = require('../pilot');
const POLICY = process.env.POLICY || null;
// PILOT_ERR=0.1: the pilot-error knob (pilot.js runMatches err), on both seats
const ERR = +(process.env.PILOT_ERR || 0);
// PILOT_ERR_PLAY / PILOT_ERR_COMBAT: the bridge's version (any seat, any timing; attackers and blockers withdrawn)
const ERR_PLAY = +(process.env.PILOT_ERR_PLAY || 0), ERR_COMBAT = +(process.env.PILOT_ERR_COMBAT || 0);
// per seat, by the deck's play style (research's step 3, the per-style knob):
//   PILOT_CLASSES=classes.json (tools/deck-classes.js output) PILOT_ERR_STYLE="aggro=0.2/0.2;control=0/0"
//   PILOT_ERR_DECKS="Lifegain=0.2/0.2" names a deck directly and wins over its style.
// A deck in neither takes PILOT_ERR_PLAY / PILOT_ERR_COMBAT.
const errMap = v => Object.fromEntries((v || '').split(';').map(x => x.trim()).filter(Boolean).map(x => { const [k, r] = x.split('='); const [p, c = p] = r.split('/').map(Number); return [k.trim(), [p, c]]; }));
const ERR_STYLE = errMap(process.env.PILOT_ERR_STYLE), ERR_DECKS = errMap(process.env.PILOT_ERR_DECKS);
const CLASSES = process.env.PILOT_CLASSES ? JSON.parse(fs.readFileSync(process.env.PILOT_CLASSES, 'utf8')) : {};
const errOf = name => ERR_DECKS[name] || ERR_STYLE[(CLASSES[name] || {}).class] || [ERR_PLAY, ERR_COMBAT];
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
const BOARD = process.env.BOARD === '1';
if (BOARD) {
  if (!process.env.SIDES) { console.error('BOARD=1 needs SIDES=<a copy of the server history.json>'); process.exit(1); }
  const H = new Map();
  for (const h of JSON.parse(fs.readFileSync(process.env.SIDES, 'utf8')).filter(x => ['benchmark', 'calibration'].includes(x.owner) && x.status === 'done').sort((a, b) => b.finished - a.finished))
    for (const d of h.decks) if (!H.has(d.name) && d.side && d.side.length) H.set(d.name, d.side);
  for (const d of decks) d.side = d.side && d.side.length ? d.side : H.get(d.name) || [];
}
const realSide = name => { const a = (c.sideboards || {})[name]; return a ? `Real tournament pilots of ${name} (${a.pilots} decks) most often carry in their sideboards: ` + a.cards.slice(0, 12).map(x => `${x.name} (${Math.round(x.share * 100)}% of decks, ${x.copies.toFixed(1)} copies)`).join(', ') + '.' : null; };
const slug = s => s.replace(/[^\w]+/g, '-');
const file = path.join(OUT, 'batch.json');
fs.mkdirSync(OUT, { recursive: true });
// what this batch was played with, beside its results, so a set of batches can be compared later
fs.writeFileSync(path.join(OUT, 'settings.json'), JSON.stringify({ policy: POLICY, profileSpells: process.env.PROFILE_SPELLS || null, profileDecks: process.env.PROFILE_DECKS || null, extraDead: process.env.EXTRA_DEAD || null, err: ERR, errPlay: ERR_PLAY, errCombat: ERR_COMBAT, errStyle: process.env.PILOT_ERR_STYLE || null, errDecks: process.env.PILOT_ERR_DECKS || null, board: BOARD, classes: process.env.PILOT_CLASSES || null, bridge: process.env.PILOT_BRIDGE || null, top: +TOP, matches: +M }, null, 1));
const done = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
const log = (...a) => console.log(new Date().toTimeString().slice(0, 8), ...a);
const seedOf = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return (h >>> 0) % 2147483647; };

const jobs = [];
for (let i = 0; i < decks.length; i++) for (let j = i + 1; j < decks.length; j++) if (!ONLY || decks[i].name === ONLY || decks[j].name === ONLY) jobs.push([decks[i], decks[j]]);
const todo = jobs.filter(([a, b]) => !done[a.name + '|' + b.name]);
if (BOARD) log('sideboards: ' + decks.map(d => `${d.name} ${d.side.reduce((t, x) => t + x.qty, 0)}`).join(', '));
log(`${jobs.length} pairings among the top ${decks.length}, ${todo.length} to play, ${M} best-of-threes each${BOARD ? ', games 2-3 sideboarded' : ''}, ${POLICY ? 'pilot ' + POLICY + ' on both seats' : 'stock Forge'}${ERR ? ', pilot error ' + ERR : ''}${ERR_PLAY || ERR_COMBAT ? `, bridge error play ${ERR_PLAY} combat ${ERR_COMBAT}` : ''}`);
if (Object.keys(ERR_STYLE).length || Object.keys(ERR_DECKS).length) log('errors per deck (play/combat): ' + decks.map(d => `${d.name} ${errOf(d.name).join('/')}`).join(', '));

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
    // PROFILE_DECKS="Dimir Excruciator=combo": a profile by deck name, for a profile on trial (wins over the rest)
    for (const x of (process.env.PROFILE_DECKS || '').split(';').map(x => x.trim()).filter(Boolean)) { const [n, p] = x.split('='); policyOf[n.trim()] = p.trim(); }
    log('profiles: ' + Object.entries(policyOf).filter(([, x]) => x).map(([n, x]) => n + ' ' + x).join(', '));
  }
  let i = 0;
  const t0 = Date.now();
  const slot = async () => {
    for (;;) {
      const p = todo[i++]; if (!p) return;
      const [a, b] = p, key = a.name + '|' + b.name, dir = slug(a.name) + '__' + slug(b.name);
      const pol = POLICY === 'profiles' ? [policyOf[a.name], policyOf[b.name]] : [POLICY, POLICY];
      let plans = [null, null];
      if (BOARD) {
        const sb = require('../sideboard'), pl = await sb.planFor(a, b, 'standard', { a: realSide(a.name), b: realSide(b.name) });
        plans = [pl.a, pl.b]; log(`${key} plan: ${a.name} +${pl.a.in.reduce((t, x) => t + x.qty, 0)}, ${b.name} +${pl.b.in.reduce((t, x) => t + x.qty, 0)}`);
      }
      const r = await runMatches({ decks: [a, b], matches: +M, plans, seed: seedOf(key), own: pol.map(x => [...(x ? ['priority', 'announce_x'] : []), ...(BOARD ? ['sideboard'] : [])]), policy: pol, deadCards: POLICY ? DEAD : [], workDir: path.join(OUT, 'work', dir), gameLog: path.join(OUT, 'logs', dir), err: ERR, errPlay: [errOf(a.name)[0], errOf(b.name)[0]], errCombat: [errOf(a.name)[1], errOf(b.name)[1]] });
      const won = r.games.filter(g => g.winner === 0).length, lost = r.games.filter(g => g.winner === 1).length;
      done[key] = { dir, won, lost, games: r.games.length, missed: r.missed || 0, errors: r.errors.slice(0, 2) };
      fs.writeFileSync(file, JSON.stringify(done));
      const sw = r.warnings.filter(w => /^sideboard/.test(w)); if (sw.length) log(`${key}: ${sw.length} sideboard warnings, e.g. ${sw[0].slice(0, 120)}`);
      log(`${key}: ${won}-${lost}${r.errors.length ? ' ERROR ' + r.errors[0].slice(0, 80) : ''}`);
      fs.rmSync(path.join(OUT, 'work', dir), { recursive: true, force: true });
    }
  };
  await Promise.all(Array.from({ length: +PAR }, slot));
  log(`done in ${Math.round((Date.now() - t0) / 60000)} min`);
})().catch(e => { console.error(e); process.exit(1); });
