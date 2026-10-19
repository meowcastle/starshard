// Boros Dragons' threats (creatures mv>=3 cast on its own turn): was the opponent holding a counter that hits a creature,
// with the mana for it still untapped at the end of that turn, and no Voice of Victory on the Dragons side?
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const [DIR, DECK = 'Boros Dragons'] = process.argv.slice(2);
const COUNTERS = { 'Get Out': 2, 'Countersculpt': 3, 'No More Lies': 2 };
const by = {};
for (const pd of fs.readdirSync(DIR)) { if (!pd.includes(DECK.replace(/ /g, '-'))) continue;
  for (const f of fs.readdirSync(path.join(DIR, pd))) {
    const L = zlib.gunzipSync(fs.readFileSync(path.join(DIR, pd, f))).toString().split('\n').filter(Boolean).map(JSON.parse);
    const decks = L[0].decks, ds = decks.indexOf(DECK), os = 1 - ds, opp = decks[os];
    let start = null, threats = [], countered = 0;
    for (const r of L) {
      if (r.t === 'turn') { start = r; threats = []; }
      else if (r.t === 'cast' && r.seat === ds && r.active === ds && r.spell && r.kind === 'creature' && r.mv >= 3) threats.push(r.name);
      else if (r.t === 'cast' && r.seat === os && COUNTERS[r.name] && r.active === ds) countered++;
      else if (r.t === 'turn_end' && r.active === ds && start) {
        const o = by[opp] = by[opp] || { threats: 0, heldCounter: 0, heldAndMana: 0, voiceOff: 0, counterCasts: 0 };
        o.counterCasts += countered; countered = 0;
        if (!threats.length) continue;
        o.threats += threats.length;
        const hand = (start.views[os].me.hand || []).map(h => h.name), have = hand.filter(n => COUNTERS[n]);
        if (!have.length) continue; o.heldCounter += threats.length;
        const mana = r.seats[os].landsUntapped; if (mana < Math.min(...have.map(n => COUNTERS[n]))) continue;
        o.heldAndMana += threats.length;
        if (!start.board.some(x => x.seat === ds && x.name === 'Voice of Victory')) o.voiceOff += threats.length;
      }
    }
  }
}
console.log(`${DECK}'s threats (creatures, mana value 3+, cast on its own turn), by opponent`);
console.log('opponent'.padEnd(22), 'threats', 'opp held a counter', '+ mana left unused', '+ no Voice of Victory', 'counters cast on Dragons turns');
for (const [k, o] of Object.entries(by)) if (o.threats) console.log(k.padEnd(22), String(o.threats).padStart(7), String(o.heldCounter).padStart(12), String(o.heldAndMana).padStart(16), String(o.voiceOff).padStart(18), String(o.counterCasts).padStart(14));
