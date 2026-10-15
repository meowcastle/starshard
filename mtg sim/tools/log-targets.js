// Is the removal going to the right creature? From a batch's per-turn game logs (the bridge's "targets" on a
// cast and its "leaves" records, 15 Oct 2026): per deck, what its spells and abilities aimed at among the
// opponent's creatures, beside what else was there; and per deck, which of ITS creatures the opponents answer
// and which they leave alive.
//
//   node tools/log-targets.js <logs dir> [--deck Lifegain] [--json out.json]
//
// Board at a cast: the opposing creatures at the start of the turn, plus creatures the opponent cast earlier in
// the turn, less those that left earlier in the turn (the log has no "enters" record, so a token made mid-turn
// is missed). A target "left" when the same creature left the battlefield before the next turn began.
// "Biggest" is the opposing creature with the highest mana value on the board then (ties count as biggest).
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const args = process.argv.slice(2);
const take = f => { const i = args.indexOf(f); return i >= 0 ? args.splice(i, 2)[1] : null; };
const JSON_OUT = take('--json'), ONLY = take('--deck');
const [DIR] = args;
if (!DIR) { console.error('usage: node tools/log-targets.js <logs dir> [--deck name] [--json out.json]'); process.exit(1); }
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name.endsWith('.jsonl.gz')) files.push(f); } })(DIR);

const by = {};    // by[deck]: what its removal aimed at
const of = {};    // of[deck][creature]: how that deck's creatures fared
let seenTargets = 0;
const B = d => by[d] = by[d] || { aimed: 0, biggest: 0, left: 0, alone: 0, spells: {}, targets: {} };
const O = (d, n) => { const x = of[d] = of[d] || {}; return x[n] = x[n] || { cast: 0, aimedAt: 0, removed: 0, turnsAlive: 0, alive: 0 }; };

for (const f of files) {
  let recs; try { recs = zlib.gunzipSync(fs.readFileSync(f)).toString('utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch { continue; }
  const head = recs.find(r => r.t === 'game'); if (!head) continue;
  let board = null, castThisTurn = [[], []], leftThisTurn = [[], []];
  for (let i = 0; i < recs.length; i++) {
    const r = recs[i];
    if (r.t === 'turn') {
      board = r; castThisTurn = [[], []]; leftThisTurn = [[], []];
      for (const c of r.board || []) if (c.kind === 'creature') { const o = O(head.decks[c.seat], c.name); o.turnsAlive++; }
      continue;
    }
    if (r.t === 'leaves' && r.kind === 'creature') { leftThisTurn[r.seat].push(r.name); if (!r.token) { const o = O(head.decks[r.seat], r.name); if (r.to !== 'Battlefield') o.removed++; } continue; }
    if (r.t !== 'cast') continue;
    if (r.kind === 'creature' && r.spell !== false) { castThisTurn[r.seat].push(r.name); O(head.decks[r.seat], r.name).cast++; }
    if (!r.targets) continue;
    seenTargets++;
    const me = r.seat, opp = 1 - me;
    const aimed = r.targets.filter(t => t.kind === 'creature' && t.seat === opp && !t.zone);
    if (!aimed.length || !board) continue;
    // the opposing creatures there when it was cast
    const there = [...(board.board || []).filter(c => c.seat === opp && c.kind === 'creature'), ...castThisTurn[opp].map(n => ({ name: n }))];
    for (const n of leftThisTurn[opp]) { const j = there.findIndex(c => c.name === n); if (j >= 0) there.splice(j, 1); }
    const mvOf = n => { const t = r.targets.find(x => x.name === n); if (t && t.mv != null) return t.mv; const c = (board.board || []).find(x => x.name === n && x.seat === opp); return c && c.mv != null ? c.mv : -1; };
    const top = Math.max(...there.map(c => mvOf(c.name)), ...aimed.map(t => t.mv ?? -1));
    const b = B(head.decks[me]);
    b.spells[r.name] = (b.spells[r.name] || 0) + 1;
    for (const t of aimed) {
      b.aimed++; if ((t.mv ?? -1) >= top) b.biggest++; if (there.length <= 1) b.alone++;
      // did it leave before the next turn?
      let gone = false; for (let k = i + 1; k < recs.length && recs[k].t !== 'turn'; k++) if (recs[k].t === 'leaves' && recs[k].name === t.name && recs[k].seat === opp) { gone = true; break; }
      if (gone) b.left++;
      b.targets[t.name] = (b.targets[t.name] || 0) + 1;
      O(head.decks[opp], t.name).aimedAt++;
    }
  }
}

const pc = (a, n) => n ? Math.round(100 * a / n) + '%' : '—';
console.log(`${files.length} games, ${seenTargets} casts with targets${seenTargets ? '' : ' (this batch predates the target records: rerun it with the new bridge)'}\n`);
console.log('aimed at the opponent\'s creatures, per deck:');
console.log('deck'.padEnd(24) + 'aimed'.padStart(7) + '  at the biggest  only one there  it left that turn   top targets');
for (const [d, b] of Object.entries(by).sort()) {
  if (ONLY && d !== ONLY) continue;
  console.log(d.padEnd(24) + String(b.aimed).padStart(7) + pc(b.biggest, b.aimed).padStart(16) + pc(b.alone, b.aimed).padStart(16) + pc(b.left, b.aimed).padStart(19) + '   ' + Object.entries(b.targets).sort((x, y) => y[1] - x[1]).slice(0, 4).map(([n, c]) => `${n} ${c}`).join(' · '));
}
console.log('\nhow each deck\'s creatures fare against its opponents (cast at least 30 times):');
for (const [d, cs] of Object.entries(of).sort()) {
  if (ONLY && d !== ONLY) continue;
  const rows = Object.entries(cs).filter(([, o]) => o.cast >= 30).sort((x, y) => y[1].cast - x[1].cast);
  if (!rows.length) continue;
  console.log(`\n${d}`);
  for (const [n, o] of rows) console.log('   ' + n.padEnd(34) + `cast ${o.cast}`.padEnd(10) + `aimed at ${pc(o.aimedAt, o.cast)}`.padEnd(16) + `left play ${pc(o.removed, o.cast)}`.padEnd(18) + `${(o.turnsAlive / o.cast).toFixed(1)} turn starts alive per cast`);
}
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ by, of }, null, 1));
