// A sequential test for one pilot change on one deck (research's method review, 14 Oct 2026; Stockfish's
// Fishtest): play rounds until the evidence crosses a bound, instead of a fixed batch that may be too small to
// see the effect. Both arms play the same pairings with the same seeds each round (common random numbers).
//
// "Better" is "closer to real", not "wins more": each round's difference (B's game win rate minus A's, against
// each opponent) is signed toward the deck's real match rate in the calibration file. H0: no move; H1: a move
// of DELTA toward real (default 3 points). GSPRT on the paired differences with the variance estimated as it
// goes; alpha = beta = 0.05 gives bounds of -2.94 and +2.94 on the log-likelihood ratio.
//
//   FORGE_DIR=... DATA_DIR=... node tools/sprt.js <calibration.json> <out dir> --deck "Dimir Excruciator"
//     [--b-dead "Day of Black Sun;Meltstrider's Resolve"] [--b-policy "Izzet Spellementals=spells"]
//     [--delta 0.03] [--matches 2] [--max-rounds 120] [--top 12] [--at-once 4]
//
// A deck production already plays inside its real 95% interval has no "toward real"; for it the test is
// two-sided on the unsigned difference: does B move it DELTA either way (out of line), or leave it.
//
// Arm A is production: forge-pilot/policies.json, and the deadcards policy for any other deck holding a card
// on forge-pilot/dead-cards.json (forge.js pilotFor). Arm B is A with the changes given. Resumes from
// <out dir>/sprt.json.
const fs = require('fs');
const path = require('path');
const { runMatches } = require('../pilot');
const calib = require('../calib');

const args = process.argv.slice(2);
const take = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args.splice(i, 2)[1] : d; };
const DECK = take('--deck'), B_DEAD = take('--b-dead', ''), B_POLICY = take('--b-policy', '');
const DELTA = +take('--delta', 0.03), M = +take('--matches', 2), MAX = +take('--max-rounds', 120), TOP = +take('--top', 12), PAR = +take('--at-once', 4);
const [CAL, OUT] = args;
if (!CAL || !OUT || !DECK) { console.error('usage: see the header'); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(new Date().toTimeString().slice(0, 8), ...a);

let c = JSON.parse(fs.readFileSync(CAL, 'utf8')); if (c.standard) c = c.standard;
const decks = c.lists.slice(0, TOP); const me = c.lists.find(l => l.name === DECK);
if (!me) { console.error(`no deck named ${DECK}`); process.exit(1); }
const opps = decks.filter(d => d.name !== DECK);

// where real is, relative to where production's sim is: the sign that "toward real" takes
const realOf = () => { let w = 0, n = 0; for (const o of opps) { const r = c.inputs.real[calib.pairKey(DECK, o.name)]; if (!r) continue; const flip = calib.pairKey(DECK, o.name).startsWith(o.name + '\u0000'); w += flip ? r[1] : r[0]; n += r[0] + r[1]; } return n ? { p: w / n, n } : null; };
const RN = realOf(), REAL = RN ? RN.p : null;
// the real rate's 95% half-width: a deck production already plays inside it has no "toward real"
const HALF = RN ? 1.96 * Math.sqrt(RN.p * (1 - RN.p) / RN.n) : 0;

const readJ = f => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'forge-pilot', f), 'utf8')); } catch { return {}; } };
const nk = n => String(n).split(' // ')[0].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const listOf = j => Object.entries(j).filter(([k]) => k !== '_').flatMap(([, v]) => v);
const POL = Object.assign({}, ...Object.entries(readJ('policies.json')).filter(([k]) => k !== '_').map(([, v]) => v));
const DEAD_A = listOf(readJ('dead-cards.json')), DEAD_B = [...DEAD_A, ...B_DEAD.split(';').map(x => x.trim()).filter(Boolean)];
const POL_B = { ...POL, ...Object.fromEntries(B_POLICY.split(';').filter(Boolean).map(x => x.split('=').map(y => y.trim()))) };
const policyFor = (d, pol, dead) => { if (pol[d.name]) return pol[d.name]; const s = new Set(dead.map(nk)); return d.main.some(x => s.has(nk(x.name))) ? 'deadcards' : null; };
const arms = { A: { pol: POL, dead: DEAD_A }, B: { pol: POL_B, dead: DEAD_B } };

const STATE = path.join(OUT, 'sprt.json');
const st = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : { deck: DECK, delta: DELTA, real: REAL, rounds: [], A: [0, 0], B: [0, 0] };
const LO = Math.log(0.05 / 0.95), HI = Math.log(0.95 / 0.05);

// GSPRT for a normal mean with estimated variance: H0 mean 0, H1 mean DELTA (both signed toward real)
function llr(d, sign = 1) {
  const n = d.length; if (n < 8) return 0;
  const mean = sign * d.reduce((a, x) => a + x, 0) / n, v = d.reduce((a, x) => a + (x - mean * sign) ** 2, 0) / (n - 1);
  return v > 0 ? (DELTA * (2 * mean * n - n * DELTA)) / (2 * v) : 0;
}

(async () => {
  // which way is real from production: decided once, from the first rounds of arm A if it isn't stored yet
  log(`${DECK}: real ${REAL == null ? '?' : (100 * REAL).toFixed(0) + '%'} (match rate), ${opps.length} opponents, ${M} best-of-threes each per arm per round`);
  log(`arm A: ${policyFor(me, POL, DEAD_A) || 'Forge alone'} · arm B: ${policyFor(me, POL_B, DEAD_B) || 'Forge alone'}${B_DEAD ? ' with ' + B_DEAD : ''}`);
  for (let round = st.rounds.length; round < MAX; round++) {
    const jobs = [];
    for (const o of opps) for (const arm of ['A', 'B']) jobs.push({ o, arm });
    const res = {};
    let i = 0;
    const slot = async () => { for (;;) { const j = jobs[i++]; if (!j) return;
      const a = arms[j.arm], pol = [policyFor(me, a.pol, a.dead), policyFor(j.o, a.pol, a.dead)];
      const r = await runMatches({ decks: [me, j.o], matches: M, seed: 1000 + round * 97 + opps.indexOf(j.o) * 7919, own: pol.map(x => x ? ['priority', 'announce_x'] : []), policy: pol, deadCards: a.dead, workDir: path.join(OUT, 'work', j.arm + '-' + opps.indexOf(j.o)) });
      const won = r.games.filter(g => g.winner === 0).length, lost = r.games.filter(g => g.winner === 1).length;
      (res[j.o.name] = res[j.o.name] || {})[j.arm] = [won, lost];
    } };
    await Promise.all(Array.from({ length: PAR }, slot));
    // the direction toward real: from production's running rate (arm A), fixed once there's a first round
    if (st.sign == null) { let w = 0, n = 0; for (const x of Object.values(res)) { w += x.A[0]; n += x.A[0] + x.A[1]; } const sim = calib.match(w / n, w / n); 
      // inside the real interval already (15 Oct 2026: Landfall at 52 against a real 51 got a coin-flip sign):
      // the question becomes "does B move the deck out", tested both ways on the unsigned difference
      if (REAL != null && Math.abs(REAL - sim) <= HALF) { st.sign = 0; log(`production plays ${DECK} at ${(100 * sim).toFixed(0)}% (match rate) in round 1, inside the real ${(100 * REAL).toFixed(0)}% ± ${(100 * HALF).toFixed(0)}: testing whether B moves it ${(100 * DELTA).toFixed(0)} points either way`); }
      else { st.sign = REAL == null ? 1 : (REAL >= sim ? 1 : -1); log(`production plays ${DECK} at ${(100 * sim).toFixed(0)}% (match rate) in round 1, so "toward real" is ${st.sign > 0 ? 'up' : 'down'}`); } }
    const d = [];
    for (const [o, x] of Object.entries(res)) {
      if (!x.A || !x.B) continue; const nA = x.A[0] + x.A[1], nB = x.B[0] + x.B[1]; if (!nA || !nB) continue;
      d.push((st.sign || 1) * (x.B[0] / nB - x.A[0] / nA));
      st.A[0] += x.A[0]; st.A[1] += x.A[1]; st.B[0] += x.B[0]; st.B[1] += x.B[1];
    }
    st.rounds.push({ at: Date.now(), d, res });
    const all = st.rounds.flatMap(r => r.d);
    // two-sided when already inside: the larger of the up and down tests decides a move; both low decide none
    const Lu = llr(all, 1), Ld = st.sign === 0 ? llr(all, -1) : -Infinity, L = Math.max(Lu, Ld);
    st.llr = L;
    const pA = st.A[0] / (st.A[0] + st.A[1]), pB = st.B[0] / (st.B[0] + st.B[1]);
    log(`round ${round + 1}: A ${(100 * pA).toFixed(1)}% · B ${(100 * pB).toFixed(1)}% of ${st.A[0] + st.A[1]} games each · LLR ${L.toFixed(2)} (bounds ${LO.toFixed(2)} / ${HI.toFixed(2)})`);
    fs.writeFileSync(STATE, JSON.stringify(st, null, 1));
    if (st.sign === 0) {
      if (L >= HI) { st.verdict = `H1: B moves an accurate deck ${Lu >= Ld ? 'up' : 'down'}, out of line with real`; break; }
      if (Lu <= LO && Ld <= LO) { st.verdict = 'H0: B leaves an accurate deck where it is (no move of ' + (100 * DELTA).toFixed(0) + ' points either way)'; break; }
      continue;
    }
    if (L >= HI) { st.verdict = 'H1: B moves the deck toward real'; break; }
    if (L <= LO) { st.verdict = 'H0: no move toward real worth ' + (100 * DELTA).toFixed(0) + ' points'; break; }
  }
  st.verdict = st.verdict || 'undecided at the round limit';
  fs.writeFileSync(STATE, JSON.stringify(st, null, 1));
  log(`verdict: ${st.verdict}`);
})();
