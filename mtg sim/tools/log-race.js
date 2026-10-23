// Does the AI race when it's behind against fliers? For one deck (default Boros Dragons), every opponent turn
// that starts with that deck holding an evasive threat the opponent can't block (a flier with power 2+, the
// opponent with no untapped flier or reach), what the opponent's creatures did:
//   free:    could attack with nothing on the deck's side able to kill it in a block (no untapped creature
//            with power >= its toughness, deathtouch counted);
//   useless: and it can't help on defence either: it has no flying or reach and every creature the deck could
//            attack with next turn flies (a creature that stays home only matters as a blocker);
//   held:    a free and useless creature that stayed home anyway, so its damage was simply not dealt.
// Also the same counts for the deck itself against everyone, for comparison, and blocks that only chump.
//
//   node tools/log-race.js <batch logs dir> ["Boros Dragons"]
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const [DIR, DECK = 'Boros Dragons'] = process.argv.slice(2);
const kw = (c, k) => (c.kw || []).includes(k);
const flies = c => kw(c, 'flying'), reaches = c => kw(c, 'flying') || kw(c, 'reach');
const kills = (b, a) => !b.tapped && (b.power || 0) > 0 && ((b.power || 0) >= (a.toughness || 0) || kw(b, 'deathtouch')) && !kw(a, 'indestructible') && (!flies(a) || reaches(b));
const stat = () => ({ turns: 0, eligible: 0, attacked: 0, free: 0, useless: 0, held: 0, heldPower: 0, games: 0 });
const vs = {}, self = stat(), lifeAtStop = [], chumps = { blocks: 0, chump: 0 };
let files = 0;
for (const pd of fs.readdirSync(DIR)) {
  const slugs = pd.split('__'); if (!slugs.some(s => s === DECK.replace(/[^\w]+/g, '-'))) continue;
  for (const f of fs.readdirSync(path.join(DIR, pd))) {
    const L = zlib.gunzipSync(fs.readFileSync(path.join(DIR, pd, f))).toString().split('\n').filter(Boolean).map(JSON.parse);
    const decks = L[0].decks, d = decks.indexOf(DECK); if (d < 0) continue; const o = 1 - d; files++;
    const S = vs[decks[o]] = vs[decks[o]] || stat(); S.games++;
    const turns = L.filter(r => r.t === 'turn'), attacks = L.filter(r => r.t === 'attack'), blocks = L.filter(r => r.t === 'block');
    let lastAttackLife = null;
    for (const t of turns) {
      const me = t.active, them = 1 - me, a = attacks.find(x => x.turn === t.turn && x.seat === me);
      if (!a) continue;
      const mine = t.board.filter(c => c.kind === 'creature' && c.seat === me), theirs = t.board.filter(c => c.kind === 'creature' && c.seat === them);
      // the threat: the other side has an evasive creature this side can't block
      const myBlockers = mine.filter(c => reaches(c));
      const threat = theirs.some(c => flies(c) && (c.power || 0) >= 2) && !myBlockers.length;
      if (!threat) continue;
      const theirAttackersNext = theirs.filter(c => (c.power || 0) > 0);
      const allFly = theirAttackersNext.length > 0 && theirAttackersNext.every(flies);
      const X = me === o ? S : self; X.turns++;
      const sent = new Map(); for (const x of a.attackers) sent.set(x.name, (sent.get(x.name) || 0) + 1);
      for (const c of mine) {
        if (c.sick || (c.power || 0) <= 0 || kw(c, 'defender')) continue;
        X.eligible++;
        const went = (sent.get(c.name) || 0) > 0; if (went) { sent.set(c.name, sent.get(c.name) - 1); X.attacked++; }
        const free = !theirs.some(b => kills(b, c)); if (!free) continue; X.free++;
        const useless = allFly && !reaches(c); if (!useless) continue; X.useless++;
        if (!went) { X.held++; X.heldPower += c.power; }
      }
      if (me === o) { const life = t.views && t.views[o] && t.views[o].me.life; if (a.attackers.length) lastAttackLife = life; }
    }
    for (const b of blocks) if (b.seat === o) for (const x of b.blocks) { chumps.blocks++; if (x.bp < x.at && x.bt <= x.ap) chumps.chump++; }
    if (lastAttackLife != null) lifeAtStop.push(lastAttackLife);
  }
}
const pc = (a, b) => b ? (100 * a / b).toFixed(0).padStart(3) + '%' : '   -';
console.log(`${DECK}: ${files} games. Opponent turns facing an evasive threat they can't block:`);
console.log('  opponent                 turns  creatures  attacked   free  free+useless  held home   power held/turn');
for (const [k, s] of Object.entries(vs).sort((a, b) => b[1].turns - a[1].turns)) if (s.turns)
  console.log('  ' + k.padEnd(24) + String(s.turns).padStart(6) + String(s.eligible).padStart(11) + pc(s.attacked, s.eligible).padStart(10) + String(s.free).padStart(7) + String(s.useless).padStart(14) + (pc(s.held, s.useless)).padStart(11) + (s.heldPower / s.turns).toFixed(2).padStart(17));
const T = Object.values(vs).reduce((a, s) => { for (const k in a) a[k] += s[k]; return a; }, stat());
console.log('  ' + 'all opponents'.padEnd(24) + String(T.turns).padStart(6) + String(T.eligible).padStart(11) + pc(T.attacked, T.eligible).padStart(10) + String(T.free).padStart(7) + String(T.useless).padStart(14) + pc(T.held, T.useless).padStart(11) + (T.heldPower / (T.turns || 1)).toFixed(2).padStart(17));
console.log('  ' + `${DECK} itself`.padEnd(24) + String(self.turns).padStart(6) + String(self.eligible).padStart(11) + pc(self.attacked, self.eligible).padStart(10) + String(self.free).padStart(7) + String(self.useless).padStart(14) + pc(self.held, self.useless).padStart(11) + (self.heldPower / (self.turns || 1)).toFixed(2).padStart(17));
console.log(`opponent blocks: ${chumps.blocks}, of which chumps (blocker dies, attacker lives) ${pc(chumps.chump, chumps.blocks)}`);
