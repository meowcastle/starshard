// Card-level stats from Forge's game log. Without -q, Forge prints each game's
// full log (oldest first) before its "Game Result" line. From it we read, per seat:
// which cards were cast and on which of that player's turns, the damage each card
// dealt to an opponent, discards, and mulligans.
//
// Two things make this harder than a grep. Card ids are per game, and a cast line
// carries the name but no id ("Ai(1)-Red cast Shock targeting ..."), while damage
// lines carry the id but no player ("Shock (47) deals 2 damage to Ai(2)-Green").
// So ownership is learnt per game from the lines that name both (lands, attackers
// and blockers, resolving abilities), and a face name (an adventure's "Stomp", an
// MDFC's back) is folded into the listed card through the id they share.
const key = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const LOG = /^(Game Outcome|Match Result|Turn|Mulligan|Ante|Draft|Zone Change|Player Control|Damage|Life|Land|Discard|Combat|Information|Resolve Stack|Add To Stack|Replacement Effect|Mana|Phase): /;
const isLogLine = l => LOG.test(l);

// listed card name by normalised name, including each face of a "A // B" card
function nameMap(deck) {
  const m = new Map();
  for (const c of [...(deck.main || []), ...(deck.side || []), ...(deck.commander || [])]) {
    m.set(key(c.name), c.name);
    for (const f of c.name.split(/\s*\/\/\s*/)) m.set(key(f), c.name);
  }
  return m;
}

const ID = /([^,\[\]]+?) \((\d+)\)/g;
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// One game's lines -> per seat { cards: { name: { t, d, x } }, mull }
//   t: the player's own turn it was first cast (null if never cast)
//   d: damage it dealt to opponents; x: times discarded; l: played as a land
function parseGame(lines, names, maps) {
  const seats = names.map((n, i) => ({ pre: `Ai(${i + 1})-${n}`, turns: 0 }));
  const seatOf = s => { for (let i = 0; i < seats.length; i++) if (s.startsWith(seats[i].pre)) return i; return -1; };
  const seatIn = s => { const m = s.match(/Ai\((\d+)\)/); return m ? +m[1] - 1 : -1; };
  const owner = new Map(), idNames = new Map();
  const seen = (name, id, seat) => {
    name = name.trim(); if (!idNames.has(id)) idNames.set(id, new Set()); idNames.get(id).add(name);
    if (seat >= 0 && !owner.has(id)) owner.set(id, seat);
  };
  const casts = [], dmg = [], discards = [], mull = names.map(() => 0);
  for (const l of lines) {
    const cap = l.slice(0, l.indexOf(': ')), msg = l.slice(cap.length + 2);
    if (cap === 'Turn') { const s = seatIn(msg); if (s >= 0) seats[s].turns++; continue; }
    if (cap === 'Mulligan') { const s = seatOf(msg), m = msg.match(/kept a hand of (\d+)/); if (s >= 0 && m) mull[s] = Math.max(0, 7 - +m[1]); continue; }
    if (cap === 'Add To Stack') {
      const s = seatOf(msg); if (s < 0) continue;
      const m = msg.slice(seats[s].pre.length).match(/^ cast (.+?)(?: targeting .*)?$/);
      if (m) casts.push({ seat: s, name: m[1].replace(/ \(\d+\)$/, ''), turn: seats[s].turns });
      continue;
    }
    if (cap === 'Land') { const s = seatOf(msg), m = msg.match(/ played (.+) \((\d+)\)\s*$/); if (s >= 0 && m) { seen(m[1], m[2], s); casts.push({ seat: s, name: m[1], turn: seats[s].turns, land: true }); } continue; }
    if (cap === 'Combat') {
      // "P assigned A (8) and B (9) to attack Q." / "P assigned X (5) to block Y (121)." / "P didn't block A (8)."
      const s = seatOf(msg); if (s < 0) continue;
      const own = msg.match(/ assigned (.+?) to (attack|block)/); if (!own) continue;
      for (const m of own[1].matchAll(ID)) seen(m[1].replace(/^(and )/, ''), m[2], s);
      continue;
    }
    if (cap === 'Resolve Stack') {
      const m = msg.match(/\[Card: (.+?) \((\d+)\), Activator: (Ai\(\d+\)-[^,\]]*)/); if (m) seen(m[1], m[2], seatIn(m[3]));
      const z = msg.match(/^(.+?) \((\d+)\) - /); if (z) seen(z[1], z[2], -1);
      continue;
    }
    if (cap === 'Damage') {
      const m = msg.match(/^(.+?) \((\d+)\) deals (\d+) (?:combat |non-combat )?damage to (.+?)\.?$/); if (!m) continue;
      seen(m[1], m[2], -1);
      const to = seatIn(m[4]); if (to >= 0 && m[4].startsWith(seats[to].pre)) dmg.push({ id: m[2], name: m[1], n: +m[3], to });
      continue;
    }
    if (cap === 'Discard') { const s = seatOf(msg), m = msg.match(/discards? (.+?) \((\d+)\)/); if (m) { seen(m[1], m[2], s); if (s >= 0) discards.push({ seat: s, id: m[2] }); } continue; }
    if (cap === 'Zone Change') { for (const m of msg.matchAll(ID)) seen(m[1], m[2], -1); }
  }
  // the listed card behind an id, for a given seat
  const listed = (id, seat) => { for (const n of idNames.get(id) || []) { const c = maps[seat].get(key(n)); if (c) return c; } return null; };
  // ids nobody claimed: the one seat whose list has that name; failing that, the id
  // ranges (each library is created in one block, so ids cluster by owner)
  const range = names.map(() => [Infinity, -Infinity]);
  for (const [id, s] of owner) { range[s][0] = Math.min(range[s][0], +id); range[s][1] = Math.max(range[s][1], +id); }
  const ownerOf = id => {
    if (owner.has(id)) return owner.get(id);
    const can = names.map((_, s) => s).filter(s => listed(id, s));
    if (can.length === 1) return can[0];
    const inR = (can.length ? can : names.map((_, s) => s)).filter(s => +id >= range[s][0] && +id <= range[s][1]);
    return inR.length === 1 ? inR[0] : -1;
  };
  // face name -> listed name, learnt from the ids each seat's cards carried
  const alias = names.map(() => new Map());
  for (const [id] of idNames) { const s = ownerOf(id); if (s < 0) continue; const c = listed(id, s); if (c) for (const n of idNames.get(id)) alias[s].set(key(n), c); }
  const canon = (name, s) => maps[s].get(key(name)) || alias[s].get(key(name)) || null;

  const out = names.map((_, s) => ({ cards: {}, mull: mull[s] }));
  const card = (s, n) => (out[s].cards[n] = out[s].cards[n] || { t: null, d: 0, x: 0 });
  for (const c of casts) { const n = canon(c.name, c.seat); if (!n) continue; const e = card(c.seat, n); if (e.t == null) e.t = Math.max(1, c.turn); if (c.land) e.l = 1; }
  for (const d of dmg) { const s = ownerOf(d.id); if (s < 0 || s === d.to) continue; const n = listed(d.id, s) || canon(d.name, s); if (n) card(s, n).d += d.n; }
  for (const d of discards) { const n = listed(d.id, d.seat); if (n) card(d.seat, n).x++; }
  return out;
}

// Per pairing, per seat: { games, wins, mull, cards: { name: { c: games cast, w: wins
// when cast, t: sum of first-cast turns, d: damage, x: discards } } }
function empty(n) { return Array.from({ length: n }, () => ({ games: 0, wins: 0, mull: 0, cards: {} })); }
function add(agg, game, winner) {
  game.forEach((g, s) => {
    const a = agg[s]; a.games++; if (winner === s) a.wins++; a.mull += g.mull;
    for (const [n, e] of Object.entries(g.cards)) {
      const c = a.cards[n] = a.cards[n] || { c: 0, w: 0, t: 0, d: 0, x: 0 };
      if (e.t != null) { c.c++; c.t += e.t; if (winner === s) c.w++; }
      c.d += e.d; c.x += e.x; if (e.l) c.l = 1;
    }
  });
}
// several pairings' aggregates for one seat -> one
function merge(list) {
  const o = { games: 0, wins: 0, mull: 0, cards: {} };
  for (const a of list) {
    if (!a) continue; o.games += a.games; o.wins += a.wins; o.mull += a.mull;
    for (const [n, c] of Object.entries(a.cards)) { const t = o.cards[n] = o.cards[n] || { c: 0, w: 0, t: 0, d: 0, x: 0 }; for (const k of ['c', 'w', 't', 'd', 'x']) t[k] += c[k] || 0; if (c.l) t.l = 1; }
  }
  return o;
}

module.exports = { parseGame, nameMap, empty, add, merge, isLogLine, key };
