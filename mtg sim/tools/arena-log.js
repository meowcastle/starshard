// The command line for arena.js: MTG Arena's Player.log -> the sim's game-log format.
//   DATA_DIR=... node tools/arena-log.js <Player.log> <out dir>
const fs = require('fs');
const { parse } = require('../arena');
const [LOG, OUT] = process.argv.slice(2);
if (!LOG || !OUT) { console.error('usage: node tools/arena-log.js <Player.log> <out dir>'); process.exit(1); }
(async () => {
  const r = await parse(fs.readFileSync(LOG, 'utf8'), OUT);
  console.log(`${r.games} games in ${r.matches.length} matches -> ${OUT}`);
  for (const mm of r.matches) console.log(`  ${mm.event}: ${mm.result ? (mm.result.won ? 'won' : 'lost') + ' (' + mm.result.reason + ')' : '?'}; ` + mm.games.map(x => `game ${x.game}: ${x.winner} won, ${x.onThePlay} on the play, ${x.turns} turns`).join('; ') + `; opponent showed ${mm.opponentCards.length} cards, the player ${mm.playerCards.length}`);
})().catch(e => { console.error(e); process.exit(1); });
