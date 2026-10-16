// How a control deck spends its interaction, from the per-turn game logs (research's three Azorius candidates,
// NOTE-TO-RESEARCH-15OCT-EVENING.md §2): what it counters, when its removal lands, and how often its cheap
// permanents-answers sit unused with a target in play. Offline; no engine runs.
//
//   node tools/log-control.js <logs dir> --deck "Azorius Control" [--json out.json]
//
// 1. Counters: every counter (a cast whose target is a spell) by what it hit: threats (creatures and
//    planeswalkers), card advantage and set-up (noncreature, non-planeswalker), by mana value. And the cost of a
//    counter spent on a non-threat: whether a threat of mana value 3+ then resolved uncountered within the
//    opponent's next two turns, with no counter cast at it.
// 2. Removal on creatures: the window it was cast in, and whether the creature had already attacked.
// 3. Idle answers: at the end of the deck's own turn, Seam Rip castable with an opponent's nonland permanent of
//    mana value 2 or less in play; Pinnacle Starcage castable when it would exile at least two more of the
//    opponent's artifacts and creatures (mana value 2 or less) than the deck's own.
// Every rate is split by games won and lost.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const args = process.argv.slice(2);
const take = f => { const i = args.indexOf(f); return i >= 0 ? args.splice(i, 2)[1] : null; };
const DECK = take('--deck') || 'Azorius Control', JSON_OUT = take('--json');
const [DIR] = args;
if (!DIR) { console.error('usage: node tools/log-control.js <logs dir> --deck "Azorius Control"'); process.exit(1); }

const IDLE = { 'Seam Rip': 'rip', 'Pinnacle Starcage': 'cage' };
// removal: any instant or sorcery aimed at an opponent's creature, plus these permanents' triggers; add with --removal "A;B"
const REMOVAL = new Set(['Seam Rip', 'Pinnacle Starcage', ...(take('--removal') || '').split(';').filter(Boolean)]);
const isThreat = k => k === 'creature' || k === 'planeswalker';

const files = [];
for (const d of fs.readdirSync(DIR)) { const p = path.join(DIR, d); if (fs.statSync(p).isDirectory()) for (const f of fs.readdirSync(p)) if (f.endsWith('.jsonl.gz')) files.push(path.join(p, f)); }

const S = {
  games: { won: 0, lost: 0 },
  counters: { won: [], lost: [] },                  // { kind, mv, name, cost: bool|null }
  removal: { won: [], lost: [] },                   // { window, attacked }
  idle: { rip: { won: [0, 0], lost: [0, 0] }, cage: { won: [0, 0], lost: [0, 0] } },  // [turns castable with a target, turns cast]
};
const hitNames = {};

for (const f of files) {
  const L = zlib.gunzipSync(fs.readFileSync(f)).toString().trim().split('\n').map(x => JSON.parse(x));
  const g = L.find(e => e.t === 'game'), end = L.find(e => e.t === 'end');
  if (!g || !end) continue;
  const me = g.decks.indexOf(DECK); if (me < 0 || g.decks[0] === g.decks[1]) continue;
  const opp = 1 - me, res = end.winner === me ? 'won' : 'lost';
  S.games[res]++;
  // the opponent's spell casts, in order, to find each counter's target and what resolved after it
  const casts = L.map((e, i) => ({ ...e, i })).filter(e => e.t === 'cast' && e.spell);
  const counteredAt = new Set();
  const myCounters = casts.filter(e => e.seat === me && (e.targets || []).some(t => t.spell));   // a counter is any spell of ours aimed at a spell
  for (const c of myCounters) {
    const t = c.targets.find(x => x.spell);
    // the targeted cast: the latest opponent cast of that name before the counter
    const hit = [...casts].reverse().find(e => e.i < c.i && e.seat === opp && e.name === t.spell);
    if (hit) counteredAt.add(hit.i);
    const kind = hit ? hit.kind : 'unknown', mv = hit ? hit.mv : null;
    c._hit = { kind, mv, name: t.spell };
  }
  for (const c of myCounters) {
    const h = c._hit; let cost = null;
    if (!isThreat(h.kind)) {   // a counter on a non-threat: did a 3+ threat resolve in the opponent's next two turns?
      const oppTurns = [...new Set(L.filter(e => e.t === 'turn' && e.active === opp && e.turn >= c.turn).map(e => e.turn))].slice(0, 2);
      cost = casts.some(e => e.i > c.i && e.seat === opp && oppTurns.includes(e.turn) && isThreat(e.kind) && e.mv >= 3 && !counteredAt.has(e.i));
    }
    S.counters[res].push({ ...h, cost });
    hitNames[h.name] = hitNames[h.name] || { n: 0, kind: h.kind, mv: h.mv }; hitNames[h.name].n++;
  }
  // removal on creatures: the window, and whether the creature had attacked before
  const attacked = new Map();   // name -> the turn it first attacked (the opponent's creatures, as the log goes)
  for (const e of L) {
    if (e.t === 'attack' && e.seat === opp) for (const a of e.attackers) if (!attacked.has(a.name)) attacked.set(a.name, e.turn);
    const isRemoval = e.t === 'cast' && e.seat === me && !(e.targets || []).some(t => t.spell) && (REMOVAL.has(e.name) || e.spell && (e.kind === 'instant' || e.kind === 'sorcery'));
    if (isRemoval) {   // an instant or sorcery aimed at their creature, or a named removal trigger (Seam Rip); not a counter
      for (const t of (e.targets || [])) {
        if (t.seat !== opp || t.kind !== 'creature') continue;
        const own = e.active === me, ph = e.phase || '';
        const window = own ? (/UPKEEP|DRAW/.test(ph) ? 'own upkeep/draw' : /COMBAT/.test(ph) ? 'own combat' : /END|CLEANUP/.test(ph) ? 'own end' : 'own main')
          : (/UPKEEP|DRAW/.test(ph) ? 'opp upkeep/draw' : /COMBAT/.test(ph) ? 'opp combat' : /END|CLEANUP/.test(ph) ? 'opp end step' : 'opp main');
        const first = attacked.get(t.name);
        S.removal[res].push({ name: e.name, window, attacked: first != null });   // the log is read in order: an attack already seen came first
      }
    }
  }
  // idle answers at the end of the deck's own turns: the card in hand (the next turn's view of our hand is the
  // hand we ended on), its mana untapped (turn_end's manaAvailable), and a good target on the board
  let lastBoard = [];
  const idx = L.map((e, i) => i);
  for (const i of idx) {
    const e = L[i];
    if (e.t === 'turn') lastBoard = e.board || [];
    if (e.t === 'cast' && e.seat === me && IDLE[e.name] && e.spell) S.idle[IDLE[e.name]][res][1]++;
    if (e.t !== 'turn_end' || e.active !== me) continue;
    const next = L.slice(i + 1).find(x => x.t === 'turn'); if (!next) continue;
    const hand = new Set((((next.views || [])[me] || {}).me || {}).hand?.map(c => c.name) || []);
    const mana = ((e.seats || [])[me] || {}).manaAvailable || 0;
    const theirs = lastBoard.filter(b => b.seat === opp && b.kind !== 'land' && b.mv != null && b.mv <= 2);
    if (hand.has('Seam Rip') && mana >= 1 && theirs.length) S.idle.rip[res][0]++;
    const smallOf = q => lastBoard.filter(b => b.seat === q && (b.kind === 'creature' || /artifact/i.test(b.kind) || b.kind === 'other' && /Token|Map|Clue|Treasure|Food/.test(b.name)) && b.mv != null && b.mv <= 2).length;
    if (hand.has('Pinnacle Starcage') && mana >= 3 && smallOf(opp) - smallOf(me) >= 2) S.idle.cage[res][0]++;
  }
}

const pc = (a, b) => b ? (100 * a / b).toFixed(0) + '%' : '—';
const both = k => [...S[k].won, ...S[k].lost];
console.log(`${DECK}: ${S.games.won + S.games.lost} games (${S.games.won} won, ${S.games.lost} lost) from ${DIR}\n`);
console.log('1. What it counters');
const cs = both('counters'), threat = cs.filter(c => isThreat(c.kind)), non = cs.filter(c => !isThreat(c.kind) && c.kind !== 'unknown');
console.log(`   ${cs.length} counters: ${pc(threat.length, cs.length)} on threats (creatures, planeswalkers), ${pc(non.length, cs.length)} on other spells`);
for (const r of ['won', 'lost']) { const x = S.counters[r]; console.log(`   in games ${r}: ${pc(x.filter(c => isThreat(c.kind)).length, x.length)} on threats (${x.length} counters, ${(x.length / Math.max(1, S.games[r])).toFixed(2)} a game)`); }
const costly = non.filter(c => c.cost);
console.log(`   a counter on a non-threat, then a 3+ threat resolved within the opponent's next two turns: ${pc(costly.length, non.length)} (${costly.length} of ${non.length})`);
console.log('   most countered: ' + Object.entries(hitNames).sort((a, b) => b[1].n - a[1].n).slice(0, 12).map(([n, x]) => `${n} (${x.kind}, ${x.mv}) ${x.n}`).join(' · '));
console.log('\n2. Removal on creatures: the window, and whether the creature had attacked first');
const rm = both('removal'), win = {};
for (const r of rm) { win[r.window] = (win[r.window] || 0) + 1; }
console.log('   ' + Object.entries(win).sort((a, b) => b[1] - a[1]).map(([w, n]) => `${w} ${pc(n, rm.length)}`).join(' · ') + `  (${rm.length} removal spells)`);
for (const r of ['won', 'lost']) { const x = S.removal[r]; console.log(`   in games ${r}: ${pc(x.filter(y => y.attacked).length, x.length)} after the creature had attacked (${x.length})`); }
console.log('\n3. Idle answers: own turns ended with the card in hand, its mana untapped and a good target in play · times cast');
for (const [k, label] of [['rip', 'Seam Rip, an opponent\'s permanent of mana value 2 or less in play'], ['cage', 'Pinnacle Starcage, 2+ more of theirs than ours to exile']])
  console.log(`   ${label}: won ${S.idle[k].won[0]} idle · ${S.idle[k].won[1]} cast; lost ${S.idle[k].lost[0]} idle · ${S.idle[k].lost[1]} cast`);
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ deck: DECK, ...S, hitNames }, null, 1));
