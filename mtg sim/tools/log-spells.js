// When are instants cast? From the per-turn game logs (GameLog.java). Research's "Spellementals cut"
// (NOTE-TO-CODE-13OCT-ENGINE-REVIEW.md Q2), generalised: the window an unprovoked instant is cast in
// says whether the engine waits for information the way a person does.
//
//   node tools/log-spells.js <logs dir> [classes.json] [--deck "Izzet Spellementals"] [--json out.json]
//
// Windows, for every cast with `instant` true:
//   in response       the stack was not empty (an answer, a counter, a trick)
//   own: upkeep/draw  unprovoked, in the caster's own upkeep or draw step (before main phase: no new information yet)
//   own: main         own main phase 1 or 2
//   own: combat       own combat
//   own: end step     own end step
//   opp: upkeep/draw  unprovoked, at the start of the opponent's turn (spends the mana before seeing their turn)
//   opp: main         the opponent's main phases, unprovoked
//   opp: combat       the opponent's combat (ambush blockers, removal on an attacker)
//   opp: end step     the opponent's end step (the latest window: mana held through their turn, then used)
// Per deck (and class): the share in each window, and the "early" share (both upkeep/draw rows), which
// is the number a pilot rule should drive toward zero. With --deck, each of that deck's instants by window,
// and what each response answered (the cast below it on the stack).
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const args = process.argv.slice(2);
const take = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args.splice(i, 2)[1] : null; };
const JSON_OUT = take('--json'), DECK = take('--deck');
const [DIR, CLASSES] = args;
const classes = CLASSES ? Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(CLASSES, 'utf8'))).map(([n, x]) => [n, x.class || x])) : {};
const classOf = n => classes[n] || 'other';
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name.endsWith('.jsonl.gz')) files.push(f); } })(DIR);

const WINDOWS = ['in response', 'own: upkeep/draw', 'own: main', 'own: combat', 'own: end step', 'opp: upkeep/draw', 'opp: main', 'opp: combat', 'opp: end step'];
const windowOf = (r) => {
  if ((r.stack || 1) > 1) return 'in response';
  const own = r.active === r.seat, p = r.phase || '';
  // Forge's phases (UPKEEP, MAIN1, COMBAT_*, END_OF_TURN) and Arena's (Phase_Beginning, Phase_Main1, Phase_Combat, Phase_Ending; Step_* when the parser carries steps)
  const part = /UPKEEP|DRAW|Beginning|Step_Upkeep|Step_Draw/.test(p) ? 'upkeep/draw' : /^MAIN|Main/.test(p) ? 'main' : /COMBAT|Combat/.test(p) ? 'combat' : /END_OF_TURN|CLEANUP|Ending|Step_End/.test(p) ? 'end step' : 'main';
  return (own ? 'own: ' : 'opp: ') + part;
};
const pct = (a, b) => b ? Math.round(100 * a / b) + '%' : '-';
const deck = {}, klass = {}, cards = {}, answered = {};
const T = (o, n) => o[n] = o[n] || Object.fromEntries(WINDOWS.map(w => [w, 0]).concat([['n', 0], ['games', 0]]));
let games = 0;

for (const f of files) {
  let recs; try { recs = zlib.gunzipSync(fs.readFileSync(f)).toString('utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch { continue; }
  const head = recs.find(r => r.t === 'game'); if (!head) continue;
  games++;
  const names = head.decks; for (const n of names) { T(deck, n).games++; T(klass, classOf(n)).games++; }
  let last = null;
  for (const r of recs) {
    if (r.t !== 'cast') continue;
    if (r.instant) {
      const w = windowOf(r), n = names[r.seat];
      for (const t of [T(deck, n), T(klass, classOf(n))]) { t[w]++; t.n++; }
      if (DECK && n === DECK) {
        const c = T(cards, r.name); c[w]++; c.n++;
        if (w === 'in response') { const a = answered[r.name] = answered[r.name] || {}; const k = last && last.seat !== r.seat ? last.name + ' (' + (last.kind || '?') + ')' : '(own spell below it)'; a[k] = (a[k] || 0) + 1; }
      }
    }
    last = r;
  }
}

const show = (title, rows) => {
  console.log(`\n${title}`);
  console.log('   ' + 'deck'.padEnd(26) + 'instants   early ' + WINDOWS.map(w => w.replace('own: ', 'own ').replace('opp: ', 'opp ').padStart(12)).join(''));
  for (const [n, t] of rows) {
    if (!t.n) continue;
    const early = t['own: upkeep/draw'] + t['opp: upkeep/draw'];
    console.log('   ' + n.padEnd(26) + String(t.n).padStart(8) + '   ' + pct(early, t.n).padStart(4) + ' ' + WINDOWS.map(w => pct(t[w], t.n).padStart(12)).join(''));
  }
};
console.log(`${files.length} logs, ${games} games`);
show('By deck: where its instants are cast (early = own or opponent upkeep/draw, unprovoked)', Object.entries(deck).sort((a, b) => a[0].localeCompare(b[0])));
if (CLASSES) show('By class', Object.entries(klass).sort());
if (DECK) {
  show(DECK + ', by card', Object.entries(cards).sort((a, b) => b[1].n - a[1].n));
  console.log('\n' + DECK + ': what each response answered (the cast under it on the stack)');
  for (const [n, a] of Object.entries(answered)) console.log('   ' + n.padEnd(26) + Object.entries(a).sort((x, y) => y[1] - x[1]).slice(0, 6).map(([k, v]) => k + ' ×' + v).join(', '));
}
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ files: files.length, games, windows: WINDOWS, deck, klass, cards, answered }, null, 1));
