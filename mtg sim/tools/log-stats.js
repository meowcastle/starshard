// The six statistics of RESEARCH-LEARNED-EVAL-13OCT.md ("What to measure from the logs first"),
// from a folder of per-turn game logs (GameLog.java). Read before training anything.
//
//   node tools/log-stats.js <logs dir> [classes.json (tools/deck-classes.js)] [--json out.json]
//
// With a classes file every statistic is also split by pairing class (control, combo, aggro,
// midrange on each side); without one, decks named in CONTROL count as control, the rest "other".
//
// 1 static-score calibration: Forge's score difference at the start of each turn (my score minus
//   theirs, from the seat whose view it is), binned; how often the side ahead went on to win.
// 2 lead changes: how often the side ahead by Forge's score flips during a game.
// 3 loser ahead before the last combat: the eventual loser led at the start of the last turn
//   with attackers.
// 4 unspent mana: mana left at the end of a seat's own turn, split by whether it still held
//   something it could have cast (and at the end of the opponent's turn, instants only).
// 5 passed with an answer, then used it: a seat ended its own turn holding a castable instant;
//   did it cast an instant during the opponent's next turn?
// 6 blocks: trades (both die), chump blocks (only the blocker dies), safe blocks (only the
//   attacker dies) and bounces (neither), from printed power and toughness at the block.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const args = process.argv.slice(2), jsonAt = args.indexOf('--json'), JSON_OUT = jsonAt >= 0 ? args.splice(jsonAt, 2)[1] : null;
const [DIR, CLASSES] = args;
const classes = CLASSES ? Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(CLASSES, 'utf8'))).map(([n, x]) => [n, x.class || x])) : {};
const control = new Set(Object.keys(classes).length ? Object.keys(classes).filter(n => classes[n] === 'control') : (process.env.CONTROL || 'Azorius Control,4c Control,Jeskai Control').split(','));
const classOf = n => classes[n] || (control.has(n) ? 'control' : 'other');
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name.endsWith('.jsonl.gz')) files.push(f); } })(DIR);

const pct = (a, b) => b ? Math.round(100 * a / b) + '%' : '-';
const BINS = [-Infinity, -1000, -500, -250, -100, 100, 250, 500, 1000, Infinity];
const binOf = x => { for (let i = 0; i < BINS.length - 1; i++) if (x >= BINS[i] && x < BINS[i + 1]) return i; return BINS.length - 2; };
const binName = i => `${BINS[i] === -Infinity ? '' : Math.max(0, BINS[i])}..${BINS[i + 1] === Infinity ? '' : BINS[i + 1]}`; // the side ahead: leads are positive

const calib = { all: BINS.slice(1).map(() => [0, 0]), control: BINS.slice(1).map(() => [0, 0]) }, curve = {}; // curve['aggro ahead of control'][bin] = [leader won, n]
let games = 0, decided = 0, flips = 0, loserAhead = [0, 0];
const deck = {}; // per deck: unspent mana, passes with answers
const D = n => deck[n] = deck[n] || { turns: 0, unspent: 0, unspentHolding: 0, holdingTurns: 0, oppTurns: 0, unspentOpp: 0, passWithAnswer: 0, answered: 0 };
const blocks = { trade: 0, chump: 0, safe: 0, bounce: 0 }, blocksBy = {}, games2 = {}; // blocksBy[defender class], games2[pairing class] = [games, flips, loser ahead, of]
const ctrlBlocks = { trade: 0, chump: 0, safe: 0, bounce: 0 };

for (const f of files) {
  // a game still being played (or cut off) has no gzip trailer yet: skipped
  let recs; try { recs = zlib.gunzipSync(fs.readFileSync(f)).toString('utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch { continue; }
  const head = recs.find(r => r.t === 'game'), end = recs.find(r => r.t === 'end');
  if (!head || !end) continue;
  games++;
  if (end.winner == null) continue;
  decided++;
  const names = head.decks, isCtrl = names.some(n => control.has(n)), W = end.winner;
  const turns = recs.filter(r => r.t === 'turn' && r.static && r.static[0] != null && r.static[1] != null);
  // 1, 2: the lead from seat 0's side; a turn counts once per side, as the ahead side
  let prev = 0, myFlips = 0;
  const pc = [classOf(names[0]), classOf(names[1])].sort().join(' v '), g2 = games2[pc] = games2[pc] || [0, 0, 0, 0]; g2[0]++;
  for (const t of turns) {
    const rel = t.static[0] - t.static[1];
    for (const s of [0, 1]) {
      const x = s === 0 ? rel : -rel; if (x <= 0) continue; const b = binOf(x); calib.all[b][1]++; if (W === s) calib.all[b][0]++; if (isCtrl) { calib.control[b][1]++; if (W === s) calib.control[b][0]++; }
      const k = `${classOf(names[s])} ahead of ${classOf(names[1 - s])}`, c = curve[k] = curve[k] || BINS.slice(1).map(() => [0, 0]); c[b][1]++; if (W === s) c[b][0]++;
    }
    const sign = Math.sign(rel); if (sign && prev && sign !== prev) { flips++; myFlips++; } if (sign) prev = sign;
  }
  // 3: the last turn with attackers
  const attackTurns = new Set(recs.filter(r => r.t === 'attack' && r.attackers && r.attackers.length).map(r => r.turn));
  const lastAtk = Math.max(...attackTurns, -1), t3 = turns.find(t => t.turn === lastAtk);
  g2[1] += myFlips;
  if (t3) { loserAhead[1]++; g2[3]++; const rel = t3.static[0] - t3.static[1]; if ((1 - W === 0 && rel > 0) || (1 - W === 1 && rel < 0)) { loserAhead[0]++; g2[2]++; } }
  // 4, 5
  const ends = recs.filter(r => r.t === 'turn_end');
  for (const te of ends) {
    for (const s of [0, 1]) {
      const x = te.seats[s], d = D(names[s]);
      if (te.active === s) {
        d.turns++; d.unspent += x.manaAvailable;
        if (x.castable.length) { d.holdingTurns++; d.unspentHolding += x.manaAvailable; }
        if (x.castable.some(c => c.instant)) {
          d.passWithAnswer++;
          const next = te.turn + 1;
          if (recs.some(r => r.t === 'cast' && r.turn === next && r.seat === s && r.spell)) d.answered++;
        }
      } else { d.oppTurns++; d.unspentOpp += x.manaAvailable; }
    }
  }
  // 6
  for (const b of recs.filter(r => r.t === 'block')) for (const x of b.blocks) {
    const blockerDies = x.ap >= x.bt, attackerDies = x.bp >= x.at;
    const k = blockerDies && attackerDies ? 'trade' : blockerDies ? 'chump' : attackerDies ? 'safe' : 'bounce';
    blocks[k]++; if (isCtrl) ctrlBlocks[k]++;
    const dc = classOf(names[b.seat]), bb = blocksBy[dc] = blocksBy[dc] || { trade: 0, chump: 0, safe: 0, bounce: 0 }; bb[k]++;
  }
}

console.log(`${files.length} logs, ${games} games, ${decided} decided\n`);
console.log('1. Forge\'s static score: how often the side ahead by this much at the start of a turn won');
console.log('   lead          all games          games with a control deck');
for (let i = 4; i < BINS.length - 1; i++) console.log(`   ${binName(i).padEnd(12)}  ${pct(...calib.all[i]).padStart(4)} of ${String(calib.all[i][1]).padEnd(6)}     ${pct(...calib.control[i]).padStart(4)} of ${calib.control[i][1]}`);
console.log(`\n2. Lead changes: ${(flips / Math.max(1, decided)).toFixed(2)} a game`);
console.log(`3. The eventual loser was ahead at the start of the last turn with attackers in ${pct(...loserAhead)} of ${loserAhead[1]} games`);
console.log('\n4-5. Per deck: mana left at the end of its own turn (all turns / turns holding a castable card), at the end of the opponent\'s,');
console.log('     and of its turns ending with a castable instant in hand, how often it cast something on the opponent\'s next turn');
const rows = Object.entries(deck).sort((a, b) => (control.has(b[0]) - control.has(a[0])) || a[0].localeCompare(b[0]));
for (const [n, d] of rows) console.log(`   ${(control.has(n) ? '* ' : '  ') + n.padEnd(24)} ${(d.unspent / Math.max(1, d.turns)).toFixed(1)} / ${(d.unspentHolding / Math.max(1, d.holdingTurns)).toFixed(1)} (${pct(d.holdingTurns, d.turns)} of turns)   opp turn ${(d.unspentOpp / Math.max(1, d.oppTurns)).toFixed(1)}   held an instant ${pct(d.passWithAnswer, d.turns)} of turns, used ${pct(d.answered, d.passWithAnswer)}`);
const bl = o => { const n = o.trade + o.chump + o.safe + o.bounce; return `${n} blocks: ${pct(o.trade, n)} trades, ${pct(o.chump, n)} chumps, ${pct(o.safe, n)} safe, ${pct(o.bounce, n)} neither dies`; };
console.log(`\n6. Blocks, all games: ${bl(blocks)}`);
for (const [c, o] of Object.entries(blocksBy).sort()) console.log(`   ${c} defending: ${bl(o)}`);
console.log(`   games with a control deck: ${bl(ctrlBlocks)}`);
console.log('\nBy pairing class: games, lead changes a game, loser ahead at the last attacking turn');
for (const [k, g] of Object.entries(games2).sort()) console.log(`   ${k.padEnd(22)} ${String(g[0]).padStart(5)} games   ${(g[1] / Math.max(1, g[0])).toFixed(2)} lead changes   loser ahead ${pct(g[2], g[3])} of ${g[3]}`);
console.log('\nThe calibration curve by class: the side ahead by this much at the start of a turn won (share, of n turn-sides)');
console.log('   ' + ''.padEnd(28) + BINS.slice(4, -1).map((_, j) => binName(j + 4).padStart(12)).join(''));
for (const [k, c] of Object.entries(curve).sort()) console.log('   ' + k.padEnd(28) + c.slice(4).map(x => (pct(...x) + ' /' + x[1]).padStart(12)).join(''));
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ games, decided, bins: BINS.slice(4).map((b, j) => binName(j + 4)).slice(0, -1), curve: Object.fromEntries(Object.entries(curve).map(([k, c]) => [k, c.slice(4)])), all: calib.all.slice(4), byPairing: games2, blocksBy, deck, classes }, null, 1));
