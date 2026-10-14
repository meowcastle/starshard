// Cards Forge could cast and didn't, from the per-turn game logs: the dead-card audit for every deck in a batch.
// Research's engine roadmap item 2. Airbender Ascension (in hand 837 times, cast 0) is the kind of thing this finds
// without anyone reading a log by hand.
//
//   node tools/log-dead-cards.js <logs dir> [--min 20] [--json out.json]
//
// For every deck and card: the turn-ends at which the card was in the castable list (the seat had the mana and
// the card in hand) and the number of times it was actually cast. "cast rate" = casts / castable turn-ends.
// A card with ≥ --min castable turn-ends and a cast rate under 10% is flagged dead; 10–30% limited. A land or a
// card that is only ever cast in response (instants) can be low for good reasons, so the table is a shortlist
// for a person (or the dead-card list in forge-pilot/dead-cards.json), not a verdict.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const args = process.argv.slice(2);
const take = (flag, d) => { const i = args.indexOf(flag); return i >= 0 ? args.splice(i, 2)[1] : d; };
const JSON_OUT = take('--json', null), MIN = +take('--min', 20);
const [DIR] = args;
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name.endsWith('.jsonl.gz')) files.push(f); } })(DIR);

// Two readings of "could have cast it". `castable` is the bridge's list at turn end, which only ever holds
// instant-speed cards (it is read in the cleanup step). `affordable` adds the rest: the seat's own turns on
// which the card sat in hand with at least its mana value in lands (colours not checked, so it overcounts a
// little). A creature, sorcery or planeswalker Forge never casts shows up only in the second.
const deck = {}; // deck -> card -> { castable, affordable, cast, inHand, games }
const C = (d, n) => (deck[d] = deck[d] || {})[n] = deck[d][n] || { castable: 0, affordable: 0, cast: 0, inHand: 0, games: new Set() };
let games = 0;
for (const f of files) {
  let recs; try { recs = zlib.gunzipSync(fs.readFileSync(f)).toString('utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch { continue; }
  const head = recs.find(r => r.t === 'game'); if (!head) continue;
  games++;
  const names = head.decks;
  for (const r of recs) {
    if (r.t === 'turn') for (const s of [0, 1]) { const v = r.views && r.views[s]; if (v && v.me.hand) for (const h of v.me.hand) { if (h.mv >= 0) { const c = C(names[s], h.name); c.inHand++; c.games.add(f); if (r.active === s && h.mv <= (v.me.lands || 0)) c.affordable++; } } }
    if (r.t === 'turn_end') for (const s of [0, 1]) { const st = r.seats[s]; if (!st) continue; for (const c of st.castable || []) { if (c.mv >= 0) { const x = C(names[s], c.name); x.castable++; x.games.add(f); } } }
    if (r.t === 'cast' && r.spell !== false && r.name && !/^arena:/.test(r.name)) { const x = C(names[r.seat], r.name); x.cast++; }
  }
}
const rows = [];
for (const [d, cards] of Object.entries(deck)) for (const [n, x] of Object.entries(cards)) {
  const could = Math.max(x.castable, x.affordable);
  if (could < MIN) continue;
  const rate = x.cast / could;
  rows.push({ deck: d, card: n, castable: x.castable, affordable: x.affordable, could, cast: x.cast, inHand: x.inHand, games: x.games.size, rate, flag: rate < 0.1 ? 'dead' : rate < 0.3 ? 'limited' : '' });
}
rows.sort((a, b) => a.rate - b.rate);
console.log(`${files.length} logs, ${games} games · cards with ≥ ${MIN} chances, lowest cast rate first (chances: the larger of instant-speed castable turn-ends and own turns affordable)`);
console.log('   ' + 'deck'.padEnd(24) + 'card'.padEnd(32) + 'castable'.padStart(9) + 'afford'.padStart(8) + 'cast'.padStart(6) + 'rate'.padStart(7) + '  flag');
for (const r of rows.slice(0, 60)) console.log('   ' + r.deck.padEnd(24) + r.card.slice(0, 31).padEnd(32) + String(r.castable).padStart(9) + String(r.affordable).padStart(8) + String(r.cast).padStart(6) + (Math.round(100 * r.rate) + '%').padStart(7) + '  ' + r.flag);
const dead = rows.filter(r => r.flag === 'dead'), lim = rows.filter(r => r.flag === 'limited');
console.log(`\n${dead.length} dead, ${lim.length} limited, of ${rows.length} cards measured`);
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ files: files.length, games, min: MIN, rows }, null, 1));
