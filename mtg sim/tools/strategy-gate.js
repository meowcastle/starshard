// E4's gate (STRATEGY-FIRST-REBUILD §4): the strategy pilot against stock Forge with the same 60, seats swapped halfway,
// fixed seeds. Passes when the strategy seat wins 55%+ and its champions attack alone on 80%+ of its attacks. Also
// prints the stock seat's attack-alone share, so the change in how the deck is played is visible.
//
//   FORGE_DIR=... DATA_DIR=... node tools/strategy-gate.js <brews.json> <brew id> [version] [matches per half=50] [out dir]
const fs = require('fs'), path = require('path'), os = require('os');
const { runMatches } = require('../pilot');
const meta = require('../meta');
const SP = require('../forge-pilot/strategy-pilot');
const telemetry = require('../telemetry');
const [BREWS, ID, V, N = '50', OUT = path.join(os.tmpdir(), 'strategy-gate')] = process.argv.slice(2);
(async () => {
  const b = JSON.parse(fs.readFileSync(BREWS, 'utf8')).find(x => x.id === ID); if (!b || !b.strategy) throw new Error('no brew with a saved strategy');
  const ver = b.versions.find(x => x.v === (+V || b.current)), list = ver.list;
  const find = await meta.cards(list.main.map(c => c.name));
  const cfg = SP.fromStrategy(b.strategy, list, find);
  console.log('pilot:', JSON.stringify({ champions: cfg.champions, protection: cfg.protection, holdMana: cfg.holdMana, equipment: cfg.equipment, tutor: cfg.tutor && cfg.tutor.card }));
  const deck = name => ({ name, main: list.main, side: [] });
  let wins = 0, games = 0; const tm = { strat: [], stock: [] };
  for (const half of [0, 1]) {
    const seatS = half; // the strategy seat
    const decks = half === 0 ? [deck('Strategy'), deck('Stock')] : [deck('Stock'), deck('Strategy')];
    const policy = half === 0 ? [cfg, null] : [null, cfg];
    const logDir = path.join(OUT, 'h' + half); fs.mkdirSync(logDir, { recursive: true });
    const r = await runMatches({ decks, matches: +N, games: 1, seed: 7700 + half, policy, own: [[], []], workDir: path.join(OUT, 'work' + half), gameLog: logDir, keepLogs: false, clock: 120 });
    for (const g of r.games) { if (g.winner === -1) continue; games++; if (g.winner === seatS) wins++; }
    const spec = s => ({ seat: s, engine: cfg.champions, champions: cfg.champions, equipment: cfg.equipment, protection: cfg.protection });
    for (const f of fs.readdirSync(logDir)) { const L = telemetry.readLog(path.join(logDir, f)); if (!L) continue; tm.strat.push(telemetry.extract(L, spec(seatS))); tm.stock.push(telemetry.extract(L, spec(1 - seatS))); }
    console.log(`half ${half}: strategy seat ${seatS}, ${r.games.length} games, decisions taken by the strategy pilot: ${JSON.stringify(r.strategy || {})}${r.errors.length ? ', errors ' + r.errors.length : ''}`);
  }
  const p = wins / games, se = Math.sqrt(p * (1 - p) / games), A = telemetry.aggregate(tm.strat), B = telemetry.aggregate(tm.stock);
  console.log(`strategy pilot wins ${wins} of ${games}: ${(100 * p).toFixed(1)}% (95% ${(100 * (p - 1.96 * se)).toFixed(1)}-${(100 * (p + 1.96 * se)).toFixed(1)})`);
  console.log(`attacks made alone: strategy ${A && Math.round(100 * A.aloneShare)}% · stock ${B && Math.round(100 * B.aloneShare)}%; first solo attack turn ${A && A.soloAt} vs ${B && B.soloAt}`);
  console.log(`gate: ${p >= 0.55 ? 'win rate PASS' : 'win rate not yet'} · ${A && A.aloneShare >= 0.8 ? 'attack alone PASS' : 'attack alone not yet'}`);
})().catch(e => { console.error(e); process.exit(1); });
