// A deck's win rate in games where a card of its resolved by turn N (own casts), vs games where it didn't, per opponent
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const [DIR, DECK, CARD, BY = '8'] = process.argv.slice(2);
const by = {};
for (const pd of fs.readdirSync(DIR)) { if (!pd.includes(DECK.replace(/ /g, '-'))) continue;
  for (const f of fs.readdirSync(path.join(DIR, pd))) {
    const L = zlib.gunzipSync(fs.readFileSync(path.join(DIR, pd, f))).toString().split('\n').filter(Boolean).map(JSON.parse);
    const decks = L[0].decks, ds = decks.indexOf(DECK), opp = decks[1 - ds], end = L.find(r => r.t === 'end'); if (!end) continue;
    const had = L.some(r => r.t === 'cast' && r.seat === ds && r.name === CARD && r.turn <= +BY);
    const o = by[opp] = by[opp] || { with: [0, 0], without: [0, 0] }; o[had ? 'with' : 'without'][end.winner === ds ? 0 : 1]++;
  }
}
const p = a => a[0] + a[1] ? (100 * a[0] / (a[0] + a[1])).toFixed(0).padStart(3) + '% of ' + String(a[0] + a[1]).padEnd(4) : '-';
console.log(`${DECK}: win rate with ${CARD} cast by game turn ${BY}, and without`);
for (const [k, o] of Object.entries(by)) console.log('  vs ' + k.padEnd(22), 'with', p(o.with), ' without', p(o.without));
