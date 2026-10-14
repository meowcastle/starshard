// A combo deck's pieces, read from the games it won (research, NOTE-TO-CODE-13OCT-ENGINE-REVIEW.md
// "Bant Airbending, re-curated"): on each won game, the cards the deck cast on the winning turn and on
// the turns just before it, counted across wins. Cast on the winning turn in 80%+ of wins: a piece.
// Cast in the setup turns in 60%+: an enabler. Also, the deck's own permanents on the board when it won
// (a piece cast early sits there rather than being cast on the turn).
//
//   node tools/combo-pieces.js <logs dir> "Bant Airbending Combo" [--json out.json]
//
// The winning turn is the game's last turn. The setup turns are the two before it (the opponent's turn
// and the deck's own turn before that), so an instant cast in the opponent's end step counts.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const args = process.argv.slice(2);
const take = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args.splice(i, 2)[1] : null; };
const JSON_OUT = take('--json');
const [DIR, DECK] = args;
if (!DIR || !DECK) { console.error('usage: node tools/combo-pieces.js <logs dir> "<deck>" [--json out.json]'); process.exit(1); }
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name.endsWith('.jsonl.gz')) files.push(f); } })(DIR);

const PIECE = 0.8, ENABLER = 0.6;
let games = 0, wins = 0, comboWins = 0;
const onWin = {}, onSetup = {}, onBoard = {}, anyCast = {}, winTurns = [];
const bump = (o, k) => { o[k] = (o[k] || 0) + 1; };

for (const f of files) {
  let recs; try { recs = zlib.gunzipSync(fs.readFileSync(f)).toString('utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch { continue; }
  const head = recs.find(r => r.t === 'game'), end = recs.find(r => r.t === 'end');
  if (!head || !end) continue;
  const seat = head.decks.indexOf(DECK); if (seat < 0) continue;
  games++;
  for (const n of new Set(recs.filter(r => r.t === 'cast' && r.seat === seat).map(r => r.name))) bump(anyCast, n);
  if (end.winner !== seat) continue;
  wins++;
  const last = Math.max(...recs.filter(r => r.t === 'turn').map(r => r.turn));
  winTurns.push(Math.ceil(last / 2));
  const casts = recs.filter(r => r.t === 'cast' && r.seat === seat);
  for (const n of new Set(casts.filter(r => r.turn === last).map(r => r.name))) bump(onWin, n);
  for (const n of new Set(casts.filter(r => r.turn < last && r.turn >= last - 2).map(r => r.name))) bump(onSetup, n);
  const board = recs.filter(r => r.t === 'turn' && r.turn === last).pop();
  for (const n of new Set(((board && board.board) || []).filter(p => p.seat === seat && p.kind !== 'land').map(p => p.name))) bump(onBoard, n);
  // three or more spells on the winning turn reads as a combo turn rather than a beatdown win
  if (casts.filter(r => r.turn === last).length >= 3) comboWins++;
}

const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const names = [...new Set([...Object.keys(onWin), ...Object.keys(onSetup), ...Object.keys(onBoard)])];
const rows = names.map(n => ({ card: n, winTurn: pct(onWin[n] || 0, wins), setup: pct(onSetup[n] || 0, wins), board: pct(onBoard[n] || 0, wins), castInGames: pct(anyCast[n] || 0, games) }))
  .sort((a, b) => (b.winTurn + b.setup + b.board) - (a.winTurn + a.setup + a.board));
const pieces = rows.filter(r => r.winTurn >= PIECE * 100 || r.board >= PIECE * 100).map(r => r.card);
const enablers = rows.filter(r => !pieces.includes(r.card) && r.setup >= ENABLER * 100).map(r => r.card);
const med = winTurns.sort((a, b) => a - b)[Math.floor(winTurns.length / 2)] || null;

console.log(`${DECK}: ${games} games, ${wins} won (${pct(wins, games)}%), median winning turn ${med}; ${comboWins} wins (${pct(comboWins, wins)}%) cast 3+ spells on the winning turn`);
console.log('card'.padEnd(36) + 'win turn  setup  on board  cast in games');
for (const r of rows.slice(0, 25)) console.log(r.card.padEnd(36) + `${r.winTurn}%`.padStart(8) + `${r.setup}%`.padStart(7) + `${r.board}%`.padStart(10) + `${r.castInGames}%`.padStart(15));
console.log(`\npieces (win turn or board ${PIECE * 100}%+): ${pieces.join(', ') || 'none'}`);
console.log(`enablers (setup ${ENABLER * 100}%+): ${enablers.join(', ') || 'none'}`);
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ deck: DECK, games, wins, medianWinTurn: med, comboWins, pieces, enablers, rows }, null, 1));
