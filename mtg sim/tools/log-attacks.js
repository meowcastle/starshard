// Attacks, from the per-turn game logs (GameLog.java): does the engine attack when it should, and
// hold back when it should? Research's follow-up to the chump-block result (NOTE-TO-RESEARCH-13OCT-
// PILOT-BATCH.md, step 3): blocks were forced, so the Dimir and Bant rows are looked for in attacks.
//
//   node tools/log-attacks.js <logs dir> [classes.json] [--json out.json]
//
// A turn's "available attackers" are the active seat's creatures on the turn-start board without
// defender. The board is logged before the untap step, so the active seat's tapped and sick flags
// are last turn's and are ignored (its creatures untap and shake off summoning sickness as the turn
// starts); the opponent's untapped creatures come from the attack record (untappedDefenders). Haste
// creatures cast that turn are not on the turn-start board, so they are missed, evenly for every deck.
//
// Per deck as the attacker (and by class with a classes file):
// 1 open board: turns with attackers available and no untapped defender — how often it attacked
//   with everything, with some, or not at all; and of those where the available power was at least
//   the opponent's life, how often it did not swing with everything (lethal left on the table —
//   an indicator, not a proof: lifelink, fog effects and instant-speed blockers are not known here).
// 2 into blockers: turns with attackers available and untapped defenders — attack rate and size.
// 3 bad attacks: attacks after which the attacker lost more creatures than the defender and dealt
//   no damage (combat record: creaturesLost, lifeChange).
// 4 free damage missed: open-board turns with no attack, and the power that would have connected.
// 5 the attack size table: attackers declared against untapped defenders, with the outcome.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const args = process.argv.slice(2), jsonAt = args.indexOf('--json'), JSON_OUT = jsonAt >= 0 ? args.splice(jsonAt, 2)[1] : null;
const [DIR, CLASSES] = args;
const classes = CLASSES ? Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(CLASSES, 'utf8'))).map(([n, x]) => [n, x.class || x])) : {};
const classOf = n => classes[n] || 'other';
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name.endsWith('.jsonl.gz')) files.push(f); } })(DIR);

const pct = (a, b) => b ? Math.round(100 * a / b) + '%' : '-';
const blank = () => ({ games: 0, wins: 0,
  openTurns: 0, openAll: 0, openSome: 0, openNone: 0, openPowerMissed: 0, lethalTurns: 0, lethalMissed: 0,
  blkTurns: 0, blkAttacked: 0, blkAttackers: 0, blkAvailable: 0,
  attacks: 0, bad: 0, badLost: 0, tradeUp: 0, dealt: 0, lostAtk: 0, lostDef: 0,
  table: {} });
const deck = {}, klass = {};
const D = n => deck[n] = deck[n] || blank();
const K = n => klass[n] = klass[n] || blank();
let games = 0;

for (const f of files) {
  let recs; try { recs = zlib.gunzipSync(fs.readFileSync(f)).toString('utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch { continue; }
  const head = recs.find(r => r.t === 'game'), end = recs.find(r => r.t === 'end');
  if (!head || !end) continue;
  games++;
  const names = head.decks;
  for (const s of [0, 1]) { const d = D(names[s]), k = K(classOf(names[s])); d.games++; k.games++; if (end.winner === s) { d.wins++; k.wins++; } }
  // walk the turns: a turn record, then its attack, (block), combat records
  let turn = null;
  for (let i = 0; i < recs.length; i++) {
    const r = recs[i];
    if (r.t === 'turn') { turn = r; continue; }
    if (r.t !== 'attack' || !turn || r.turn !== turn.turn) continue;
    const s = r.seat, name = names[s], tallies = [D(name), K(classOf(name))];
    const mine = turn.board.filter(b => b.seat === s && b.kind === 'creature' && !(b.kw || []).includes('defender'));
    // manlands, haste creatures and creature-planeswalkers attack without being creatures at turn start: counted as available when they attack
    const avail = Math.max(mine.length, r.attackers.length), availPower = Math.max(mine.reduce((a, b) => a + (b.power || 0), 0), r.attackers.reduce((a, b) => a + (b.power || 0), 0));
    const oppLife = turn.views && turn.views[s] ? turn.views[s].opp.life : null;
    const n = r.attackers.length, def = r.untappedDefenders || 0;
    const combat = recs.slice(i + 1, i + 4).find(x => x.t === 'combat' && x.turn === r.turn);
    const dealt = combat ? -combat.lifeChange[1 - s] : 0, lostA = combat ? combat.creaturesLost[s] : 0, lostD = combat ? combat.creaturesLost[1 - s] : 0;
    for (const t of tallies) {
      if (avail === 0) continue;
      if (def === 0) {
        t.openTurns++;
        if (n >= avail) t.openAll++; else if (n > 0) t.openSome++; else { t.openNone++; t.openPowerMissed += availPower; }
        if (oppLife != null && availPower >= oppLife) { t.lethalTurns++; if (n < avail) t.lethalMissed++; }
      } else {
        t.blkTurns++; t.blkAvailable += avail;
        if (n > 0) { t.blkAttacked++; t.blkAttackers += n; }
      }
      if (n > 0) {
        t.attacks++; t.dealt += Math.max(0, dealt); t.lostAtk += lostA; t.lostDef += lostD;
        if (lostA > lostD && dealt <= 0) { t.bad++; t.badLost += lostA; }
        if (lostD > lostA) t.tradeUp++;
        const key = Math.min(n, 4) + 'v' + Math.min(def, 3), cell = t.table[key] = t.table[key] || { n: 0, dealt: 0, lostAtk: 0, lostDef: 0 };
        cell.n++; cell.dealt += Math.max(0, dealt); cell.lostAtk += lostA; cell.lostDef += lostD;
      }
    }
  }
}

const show = (title, rows) => {
  console.log(`\n${title}`);
  console.log('   ' + 'deck'.padEnd(26) + 'games  win   | open board: all / some / none  lethal missed | into blockers: attacked, avg size/avail | attacks  bad(lost,no dmg)  traded up  dmg/attack');
  for (const [n, d] of rows) {
    const t = d.openTurns || 1;
    console.log('   ' + n.padEnd(26) + String(d.games).padStart(5) + ' ' + pct(d.wins, d.games).padStart(4) + '   | ' +
      (pct(d.openAll, d.openTurns) + ' / ' + pct(d.openSome, d.openTurns) + ' / ' + pct(d.openNone, d.openTurns)).padEnd(20) + ' of ' + String(d.openTurns).padEnd(5) +
      (pct(d.lethalMissed, d.lethalTurns) + ' of ' + d.lethalTurns).padEnd(14) + '| ' +
      pct(d.blkAttacked, d.blkTurns).padStart(4) + ' of ' + String(d.blkTurns).padEnd(5) + ((d.blkAttackers / Math.max(1, d.blkAttacked)).toFixed(1) + '/' + (d.blkAvailable / Math.max(1, d.blkTurns)).toFixed(1)).padEnd(10) + '| ' +
      String(d.attacks).padStart(6) + '  ' + (pct(d.bad, d.attacks) + ' (' + d.badLost + ')').padEnd(16) + pct(d.tradeUp, d.attacks).padStart(8) + '  ' + (d.dealt / Math.max(1, d.attacks)).toFixed(1));
  }
};
console.log(`${files.length} logs, ${games} games`);
show('By deck, as the attacker', Object.entries(deck).sort((a, b) => a[0].localeCompare(b[0])));
if (CLASSES) show('By class', Object.entries(klass).sort());
console.log('\nAttack size table, all decks: attackers v untapped defenders -> attacks, damage per attack, creatures lost (attacker / defender) per attack');
const all = {}; for (const d of Object.values(deck)) for (const [k, c] of Object.entries(d.table)) { const a = all[k] = all[k] || { n: 0, dealt: 0, lostAtk: 0, lostDef: 0 }; a.n += c.n; a.dealt += c.dealt; a.lostAtk += c.lostAtk; a.lostDef += c.lostDef; }
for (const [k, c] of Object.entries(all).sort()) console.log('   ' + k.padEnd(6) + String(c.n).padStart(6) + '   ' + (c.dealt / c.n).toFixed(1).padStart(5) + '   ' + (c.lostAtk / c.n).toFixed(2) + ' / ' + (c.lostDef / c.n).toFixed(2));
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ files: files.length, games, deck, klass, table: all }, null, 1));
