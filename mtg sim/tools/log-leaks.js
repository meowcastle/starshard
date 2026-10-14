// A player's leaks with a deck, from their own game logs (Arena's Player.log through arena.js, or any
// sim log): the pilot statistics for one seat, with the moments behind them. Research's app-value item A.
//
//   node tools/log-leaks.js <logs dir> [--seat player] [--json out.json]
//
// Output (also the shape the Results tab reads as brew.real.leaks):
//   { games, wins, turns,
//     stats: { unspentOwn, unspentOpp, heldUsed, threatsAnswered, openBoardAttacked, lethalTaken, earlyInstants, keeps7 },
//     moments: [{ match, game, turn, kind, text }] }
// Each stat: { value, n, unit } where value is per-turn mana or a share (0..1). Targets live on the page
// (SIM-PRINCIPLES / the pilot targets), not here, so they can change without a rerun.
//
// The counting lives in leaks.js (the Mac worker uses it on each Arena match). Reads the same records as log-stats.js / log-attacks.js / log-spells.js. Records the Arena parser does
// not write yet (attack, block, stack size on casts, steps inside a phase) leave their statistic with n = 0,
// which the page shows as "not measured yet" rather than a number.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const args = process.argv.slice(2);
const take = (flag, d) => { const i = args.indexOf(flag); return i >= 0 ? args.splice(i, 2)[1] : d; };
const JSON_OUT = take('--json', null), SEAT = take('--seat', 'player');
const [DIR] = args;
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name.endsWith('.jsonl.gz')) files.push(f); } })(DIR);

const { tally, view } = require('../leaks');
const games = [];
for (const f of files) { try { games.push(zlib.gunzipSync(fs.readFileSync(f)).toString('utf8').split('\n').filter(Boolean).map(l => JSON.parse(l))); } catch { /* a broken log */ } }
const out = view(tally(games, SEAT), SEAT);
const show = (k, label) => { const s = out.stats[k]; console.log('   ' + label.padEnd(52) + (s.n ? (s.unit === 'mana' ? s.value.toFixed(1) + ' mana' : Math.round(s.value * 100) + '%') + ' of ' + s.n : 'not measured yet')); };
console.log(`${files.length} logs, ${out.games} games, ${out.wins} won, ${out.turns} of your turns`);
show('unspentOwn', 'mana unspent at the end of your own turn');
show('unspentOpp', "mana unspent at the end of the opponent's turn");
show('heldUsed', 'held an instant through their turn, and used it');
show('threatsAnswered', 'answered a creature or planeswalker the turn it came');
show('openBoardAttacked', 'attacked with everything into an empty board');
show('lethalTaken', 'took lethal when it was on the board');
show('earlyInstants', 'instants cast in an upkeep or draw step, unprovoked');
show('keeps7', 'kept seven');
console.log('\nmoments'); for (const m of out.moments) console.log(`   ${String(m.match).slice(0, 8)} t${m.turn} ${m.kind.padEnd(7)} ${m.text}`);
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(out, null, 1));
