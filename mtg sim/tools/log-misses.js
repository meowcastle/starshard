// Why a deck's sim rate misses its real one: per deck, the pilot faults Forge makes WITH it and the faults its
// opponents make AGAINST it, from a batch's per-turn game logs. A deck the sim overrates should show its
// opponents erring against it; one it underrates should show its own pilot erring.
//
//   node tools/log-misses.js <logs dir> [--json out.json]
//
// Per deck, as the seat it played:
//   kept 7          share of games it kept its opening seven
//   land miss       own turns it held a land at the start of the turn and its land count didn't rise by the
//                   start of its next turn (a pure pilot fault; the last turn of a game isn't counted)
//   float           own turns ending with at least 2 mana unspent while a non-land card in hand at the start of
//                   the turn cost no more than the mana left (colours unchecked, X as 0: an overcount)
//   no-block        opponent attacks it faced with an untapped creature able to block, and blocked nothing
//   dmg/attack      life lost per opponent attack faced
//   empty-attack    attacks into an empty board with less than everything (leaks.js's openBoardAttacked, inverted)
//   hand at loss    cards in hand on the last turn of a game it lost (dying with cards)
//   turn won/lost   median last turn
// and the same faults made by its opponents, against it (there, dmg/attack is the life the deck takes off an
// opponent per attack it makes).
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const args = process.argv.slice(2);
const take = f => { const i = args.indexOf(f); return i >= 0 ? args.splice(i, 2)[1] : null; };
const JSON_OUT = take('--json');
const [DIR] = args;
if (!DIR) { console.error('usage: node tools/log-misses.js <logs dir> [--json out.json]'); process.exit(1); }
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name.endsWith('.jsonl.gz')) files.push(f); } })(DIR);

const KEYS = ['kept7', 'landMiss', 'float', 'noBlock', 'emptyAttack'];
const blank = () => ({ games: 0, won: 0, play: [0, 0], draw: [0, 0], ...Object.fromEntries(KEYS.map(k => [k, [0, 0]])), dmg: [0, 0], handAtLoss: [0, 0], turnsWon: [], turnsLost: [], lifeAtLoss: [] });
const own = {}, vs = {};
const D = (m, deck) => m[deck] = m[deck] || blank();

for (const f of files) {
  let recs; try { recs = zlib.gunzipSync(fs.readFileSync(f)).toString('utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch { continue; }
  const head = recs.find(r => r.t === 'game'), end = recs.find(r => r.t === 'end'); if (!head || !end || end.winner < 0) continue;
  const turns = recs.filter(r => r.t === 'turn');
  for (const me of [0, 1]) {
    const opp = 1 - me, A = D(own, head.decks[me]), B = D(vs, head.decks[opp]);   // B: faults made against the opponent's deck
    const both = (k, hit) => { A[k][1]++; B[k][1]++; if (hit) { A[k][0]++; B[k][0]++; } };
    const won = end.winner === me;
    A.games++; if (won) A.won++;
    const onPlay = end.onThePlay === me; (onPlay ? A.play : A.draw)[1]++; if (won) (onPlay ? A.play : A.draw)[0]++;
    if (won) A.turnsWon.push(end.turns); else { A.turnsLost.push(end.turns); A.lifeAtLoss.push((end.life || [])[me]); }
    if (turns[0] && turns[0].views) both('kept7', turns[0].views[me].me.handSize >= 7);
    const mine = turns.filter(t => t.active === me && t.views);
    for (let i = 0; i < mine.length; i++) {
      const t = mine[i], v = t.views[me].me, next = mine[i + 1];
      const hand = v.hand || [];
      // land miss: a land in hand at the start of the turn, and no more lands by the start of the next own turn
      if (next && hand.some(c => c.mv === -1)) both('landMiss', next.views[me].me.lands <= v.lands);
      // float: mana left at the end of the turn with an affordable non-land card that wasn't cast
      const te = recs.find(r => r.t === 'turn_end' && r.turn === t.turn); const s = te && te.seats[me];
      if (s) {
        const cast = recs.filter(r => r.t === 'cast' && r.turn === t.turn && r.seat === me && r.spell !== false).map(r => r.name);
        const left = [...hand]; for (const n of cast) { const j = left.findIndex(c => c.name === n); if (j >= 0) left.splice(j, 1); }
        const cheapest = Math.min(...left.filter(c => c.mv >= 0).map(c => c.mv));
        both('float', (s.manaAvailable || 0) >= 2 && cheapest <= s.manaAvailable);
      }
    }
    // blocks: opponent attacks faced while holding an untapped creature
    for (const r of recs) {
      if (r.t === 'attack' && r.seat === opp && r.attackers.length) {
        const t = turns.filter(x => x.turn === r.turn).pop(); if (!t) continue;
        const blockers = (t.board || []).filter(b => b.seat === me && b.kind === 'creature' && !b.tapped).length;
        const bl = recs.find(x => x.t === 'block' && x.turn === r.turn && x.seat === me);
        const cm = recs.find(x => x.t === 'combat' && x.turn === r.turn);
        if (cm) { const lost = -Math.min(0, (cm.lifeChange || [0, 0])[me]); A.dmg[0] += lost; A.dmg[1]++; B.dmg[0] += lost; B.dmg[1]++; }
        if (blockers) both('noBlock', !(bl && bl.blocks && bl.blocks.length));
      }
      if (r.t === 'attack' && r.seat === me) {
        const t = turns.filter(x => x.turn === r.turn).pop(); if (!t) continue;
        const avail = (t.board || []).filter(b => b.seat === me && b.kind === 'creature' && !(b.kw || []).includes('defender')).length;
        if (avail && !(r.untappedDefenders || 0)) both('emptyAttack', r.attackers.length < avail);
      }
    }
    if (!won) { const last = turns.filter(t => t.views).pop(); if (last) { const h = last.views[me].me.handSize; A.handAtLoss[0] += h; A.handAtLoss[1]++; } }
  }
}

const pc = ([a, n]) => n ? (100 * a / n).toFixed(0).padStart(3) + '%' : '   —';
const med = a => { const s = [...a].filter(x => x != null).sort((x, y) => x - y); return s.length ? s[s.length >> 1] : '—'; };
console.log(`${files.length} games\n`);
console.log('deck                     win  play  draw | kept7 landMiss float noBlock emptyAtk dmg/atk handAtLoss | turn won/lost  life@loss');
const decks = Object.keys(own).sort((a, b) => own[b].won / own[b].games - own[a].won / own[a].games);
for (const d of decks) {
  const o = own[d];
  console.log(d.padEnd(24) + pc([o.won, o.games]) + ' ' + pc(o.play) + '  ' + pc(o.draw) + ' |  ' + KEYS.map(k => pc(o[k]).padStart(k === 'kept7' ? 4 : k.length)).join('  ') + (o.dmg[0] / o.dmg[1]).toFixed(1).padStart(8) + (o.handAtLoss[0] / o.handAtLoss[1]).toFixed(1).padStart(11) + ` | ${med(o.turnsWon)}/${med(o.turnsLost)}`.padStart(16) + String(med(o.lifeAtLoss)).padStart(10));
}
console.log('\nthe same faults, made by the OPPONENTS of each deck (against it):');
console.log('deck                     | kept7 landMiss float noBlock emptyAtk dmg/atk');
for (const d of decks) { const o = vs[d]; console.log(d.padEnd(24) + ' |  ' + KEYS.map(k => pc(o[k]).padStart(k === 'kept7' ? 4 : k.length)).join('  ') + (o.dmg[0] / o.dmg[1]).toFixed(1).padStart(8)); }
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ own, vs }, null, 1));
