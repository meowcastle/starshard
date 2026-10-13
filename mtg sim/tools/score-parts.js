// What Forge's static score is made of, from the game logs (NOTE-TO-CODE-13OCT-ORDER.md step 2: how
// much of a control deck's lead is hand cards and open mana, against board).
//
// GameStateEvaluator (Forge source) adds per side: life x2, cards in hand (+5 each for the side,
// -4 for the opponent's), every permanent's value (a land ~100 per mana it makes, a creature by
// Forge's creature evaluator, any other permanent 50 + 30 x mana value) and a mana-base term; it
// has no term for open mana ("TODO evaluate holding mana open for counterspells"). This fits the
// logged score difference (seat 0's score minus seat 1's) against the per-side differences the log
// records, by least squares, then splits the leads in each pairing class into those parts.
//
//   node tools/score-parts.js <logs dir> <classes.json>
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const [DIR, CLASSES] = process.argv.slice(2);
const classes = Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(CLASSES, 'utf8'))).map(([n, x]) => [n, x.class || x]));
const classOf = n => classes[n] || 'other';
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name.endsWith('.jsonl.gz')) files.push(f); } })(DIR);

const FEATURES = ['lands', 'untapped lands', 'life', 'hand cards', 'creatures', 'creature power', 'creature toughness', 'other permanents', 'other permanents mana value'];
// one side's numbers from a turn record
function sideOf(t, s) {
  const v = t.views[s].me, b = t.board.filter(c => c.seat === s);
  const cr = b.filter(c => c.kind === 'creature'), other = b.filter(c => c.kind !== 'creature' && c.kind !== 'land');
  return [v.lands, v.landsUntapped, v.life, v.handSize, cr.length, cr.reduce((a, c) => a + (c.power || 0), 0), cr.reduce((a, c) => a + (c.toughness || 0), 0), other.length, other.reduce((a, c) => a + Math.max(0, c.mv || 0), 0)];
}

const rows = [];
for (const f of files) {
  let recs; try { recs = zlib.gunzipSync(fs.readFileSync(f)).toString('utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch { continue; }
  const head = recs.find(r => r.t === 'game'), end = recs.find(r => r.t === 'end'); if (!head || !end || end.winner == null) continue;
  for (const t of recs) {
    if (t.t !== 'turn' || !t.static || t.static[0] == null || t.static[1] == null) continue;
    if (Math.abs(t.static[0]) > 1e5 || Math.abs(t.static[1]) > 1e5) continue; // Forge scores a decided position as +-2^31
    const a = sideOf(t, 0), b = sideOf(t, 1);
    rows.push({ x: a.map((v, i) => v - b[i]), y: t.static[0] - t.static[1], cls: [classOf(head.decks[0]), classOf(head.decks[1])], winner: end.winner });
  }
}

// least squares with an intercept: (X'X) w = X'y
const k = FEATURES.length + 1, A = Array.from({ length: k }, () => new Array(k).fill(0)), B = new Array(k).fill(0);
for (const r of rows) { const x = [1, ...r.x]; for (let i = 0; i < k; i++) { B[i] += x[i] * r.y; for (let j = 0; j < k; j++) A[i][j] += x[i] * x[j]; } }
for (let i = 1; i < k; i++) A[i][i] += 1; // a little ridge: lands and untapped lands move together
for (let i = 0; i < k; i++) for (let m = i + 1; m < k; m++) { const f = A[m][i] / A[i][i]; for (let j = i; j < k; j++) A[m][j] -= f * A[i][j]; B[m] -= f * B[i]; }
const w = new Array(k); for (let i = k - 1; i >= 0; i--) { let s = B[i]; for (let j = i + 1; j < k; j++) s -= A[i][j] * w[j]; w[i] = s / A[i][i]; }
const pred = r => w[0] + r.x.reduce((s, v, i) => s + v * w[i + 1], 0);
const my = rows.reduce((s, r) => s + r.y, 0) / rows.length, ssT = rows.reduce((s, r) => s + (r.y - my) ** 2, 0), ssR = rows.reduce((s, r) => s + (r.y - pred(r)) ** 2, 0);

console.log(`${rows.length} turn records from ${files.length} games. Forge's score difference fitted on the logged board (R² ${(1 - ssR / ssT).toFixed(2)}):`);
FEATURES.forEach((f, i) => console.log(`   ${f.padEnd(30)} ${w[i + 1].toFixed(1).padStart(7)} points each`));

// where the leads come from: turns where one side leads by 0-500, split by the leader's class against the other's
const parts = {};
for (const r of rows) for (const s of [0, 1]) {
  const lead = s === 0 ? r.y : -r.y; if (lead <= 0 || lead > 500) continue;
  const key = `${r.cls[s]} ahead of ${r.cls[1 - s]}`, p = parts[key] = parts[key] || { n: 0, won: 0, lead: 0, by: new Array(FEATURES.length).fill(0), d: new Array(FEATURES.length).fill(0) };
  p.n++; if (r.winner === s) p.won++; p.lead += lead;
  r.x.forEach((v, i) => { const dv = s === 0 ? v : -v; p.d[i] += dv; p.by[i] += dv * w[i + 1]; });
}
console.log('\nLeads of 0-500 points: the average lead, how often the leader won, and what the lead is made of (points, from the fit)');
const short = ['lands', 'untapped', 'life', 'hand', 'creatures', 'power', 'toughness', 'other', 'other mv'];
console.log('   ' + ''.padEnd(28) + 'won   lead  ' + short.map(s => s.padStart(10)).join(''));
for (const [key, p] of Object.entries(parts).sort()) console.log('   ' + key.padEnd(28) + `${Math.round(100 * p.won / p.n)}%`.padStart(4) + String(Math.round(p.lead / p.n)).padStart(7) + '  ' + p.by.map(v => String(Math.round(v / p.n)).padStart(10)).join(''));
console.log('\nThe same, as the average difference in each count (leader minus the other side)');
for (const [key, p] of Object.entries(parts).sort()) console.log('   ' + key.padEnd(28) + '           ' + p.d.map(v => (v / p.n).toFixed(1).padStart(10)).join(''));
