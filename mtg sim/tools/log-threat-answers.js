// How opponents answer one threat while it's on the battlefield: each opponent turn that starts with the card in play,
// whether they held removal they could cast, and where their targeted spells went that turn (and on the deck's next turn).
// "Removal" = a card in the REMOVAL table below that kills it with the lands the opponent has at their turn start.
// Also, for each attack trigger the card makes (a non-spell cast record in the attack phase), its target kind.
// usage: node tools/log-threat-answers.js <logs dir> <deck> <card>
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const [DIR, DECK, CARD] = process.argv.slice(2);
const games = [];
for (const pd of fs.readdirSync(DIR)) for (const f of fs.readdirSync(path.join(DIR, pd)))
  games.push({ pd, L: zlib.gunzipSync(fs.readFileSync(path.join(DIR, pd, f))).toString().split('\n').filter(Boolean).map(JSON.parse) });

// The field's creature removal, from the card texts (Forge's scripts): lands needed, and what it can kill.
// kill: 'any' destroys/exiles any creature; a number is damage; noFly = can't target fliers; mv = only mana value <= it
const REMOVAL = {
  'Erode': { lands: 1, kill: 'any' }, 'Get Lost': { lands: 2, kill: 'any' }, 'Shoot the Sheriff': { lands: 2, kill: 'any' },
  'Bitter Triumph': { lands: 2, kill: 'any' }, 'Inevitable Defeat': { lands: 4, kill: 'any' },
  'Deadly Precision': { lands: 1, kill: 'any', sacOr: 5 }, 'Sear': { lands: 2, kill: 4 }, 'Impractical Joke': { lands: 1, kill: 3 },
  'Burst Lightning': { lands: 5, kill: 4 }, 'Firebending Lesson': { lands: 5, kill: 5 }, 'Traumatic Critique': { lands: 5, kill: 3, xPlus: 2 },
  'Jeskai Revelation': { lands: 7, kill: 4 }, 'Charring Bite': { lands: 2, kill: 5, noFly: true }, 'Requiting Hex': { lands: 1, kill: 'any', mv: 2 },
};
const killsIt = (name, c, lands, haveSac) => {
  const r = REMOVAL[name]; if (!r) return false;
  if (r.noFly && (c.kw || []).includes('flying')) return false;
  if (r.mv !== undefined && (c.mv || 0) > r.mv) return false;
  const need = r.xPlus ? r.xPlus + (c.toughness || 0) : r.sacOr && !haveSac ? r.sacOr : r.lands;
  return lands >= need && (r.kill === 'any' || r.kill >= (c.toughness || 0));
};
const by = {}, trig = { player: 0, creature: 0, other: 0, none: 0, treasures: [] };
let lives = [], resolved = 0; const unusedBy = {};
for (const { pd, L } of games) {
  const decks = L[0].decks, ds = decks.indexOf(DECK); if (ds < 0 || !pd.includes(DECK.replace(/ /g, '-'))) continue;
  const os = 1 - ds, opp = decks[os];
  const o = by[opp] = by[opp] || { turns: 0, held: 0, aimed: 0, elsewhere: 0, unused: 0, games: 0, oppTurnsAlive: 0 };
  const turns = []; let cur = null;
  for (const r of L) { if (r.t === 'turn') { cur = { start: r, recs: [] }; turns.push(cur); } else if (cur) cur.recs.push(r); }
  let alive = 0, seen = false;
  for (let i = 0; i < turns.length; i++) {
    const { start, recs } = turns[i];
    const on = start.board.some(c => c.seat === ds && c.name === CARD);
    if (on && !seen) { seen = true; resolved++; o.games++; }
    if (on && start.active === os) alive++;
    if (on && start.active === ds) for (const r of recs) if (r.t === 'cast' && !r.spell && r.seat === ds && r.name === CARD && /ATTACK/.test(r.phase)) {
      const t = (r.targets || [])[0];
      trig[!t ? 'none' : t.player !== undefined ? 'player' : t.kind === 'creature' ? 'creature' : 'other']++;
      trig.treasures.push(start.board.filter(c => c.seat === ds && /Treasure/.test(c.name)).length + 1);
    }
    if (!on || start.active !== os) continue;
    o.turns++;
    const v = start.views && start.views[os] && start.views[os].me; if (!v || !v.hand) continue;
    const it = start.board.find(c => c.seat === ds && c.name === CARD);
    const haveSac = start.board.some(c => c.seat === os && (c.kind === 'creature' || c.kind === 'artifact'));
    const castable = v.hand.filter(h => killsIt(h.name, it, v.lands, haveSac));
    // this opponent turn plus the deck's next turn (instant-speed answers)
    const window = recs.concat(turns[i + 1] ? turns[i + 1].recs : []);
    const shots = window.filter(r => r.t === 'cast' && r.spell && r.seat === os && (r.targets || []).some(t => t.kind === 'creature' && t.seat === ds));
    const atIt = shots.some(r => r.targets.some(t => t.name === CARD));
    if (castable.length) { o.held++; if (atIt) o.aimed++; else if (shots.length) o.elsewhere++; else { o.unused++; for (const h of castable) unusedBy[h.name] = (unusedBy[h.name] || 0) + 1; } }
  }
  if (seen) lives.push(alive);
}
const pc = (a, b) => b ? (100 * a / b).toFixed(0).padStart(3) + '%' : '  -';
console.log(`${DECK} · ${CARD}: resolved in ${resolved} games; opponent turns it lived through: mean ${(lives.reduce((a, b) => a + b, 0) / (lives.length || 1)).toFixed(1)}`);
console.log('opponent turns with it in play, opponent holding castable removal: aimed at it / at another creature / not cast');
for (const [k, o] of Object.entries(by)) if (o.turns)
  console.log('  ' + k.padEnd(22), String(o.turns).padStart(4), 'turns ·', String(o.held).padStart(4), 'held ·', pc(o.aimed, o.held), pc(o.elsewhere, o.held), pc(o.unused, o.held));
console.log('not cast, by card:', Object.entries(unusedBy).sort((a, b) => b[1] - a[1]).map(([k, n]) => k + ' ' + n).join(' · '));
const T = trig.player + trig.creature + trig.other + trig.none, tr = trig.treasures;
console.log(`attack triggers: ${T} · at player ${pc(trig.player, T)} · at creature ${pc(trig.creature, T)} · other ${pc(trig.other, T)} · no target ${pc(trig.none, T)}`);
console.log(`Treasures at the trigger (board at turn start + the upkeep one): mean ${(tr.reduce((a, b) => a + b, 0) / (tr.length || 1)).toFixed(1)}, max ${Math.max(0, ...tr)}`);
