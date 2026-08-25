// SYNCED FILE — mirrors "Star Shard v3 Build Plan/research/manzil-engine-v6.js" verbatim.
// This is the server-authoritative copy for real-time PvP move validation
// (starshard-api/lib/manzil-lobby.js). Never hand-edit here: change the
// research copy and re-copy, same discipline as the frontend's generated
// files (see CLAUDE.md's ownership table).
//
// manzil engine v6 — a port of "Manzil - Prototype.dc.html" as shipped 22 august 2026,
// plus the 25 august 2026 slate rewrite (20 signatures rebuilt) rebased onto this file's own
// owner-relative fixes rather than the pre-24-Aug lineage Design's own port branched from.
// scope: the whole live ruleset. all 28 mansion signatures, her five planets, the base laws
// (ties flip · a tie-flip attacks both its own neighbours · tied counts are yours), dominion,
// jupiter's counts-two, the dealt five, and her two-ply reply at a per-rung reading depth.
//
// the 25 aug rewrite, card by card (rebased — see docs/handoffs/NOTE-TO-CODE-slate-rebase.md):
//   bearer   keeps the ground beside it (lodge or claim)     was: neighbours +1
//   follower answers when its side is claimed                was: copies the left face
//   storm    no tie takes it, anywhere                        was: only on its own mansion
//   return   bounded: once, on its own ground                 was: unbounded
//   ghost    first opposing card that lodges beside it, -2    was: -1 field while road <half full
//   glance   her next card -2                                 was: -1
//   mane     counts for whoever holds both its neighbours,    was: +1 between two
//            single-player only (g.maneFair neutralizes for PvP, see mkGame/manzil-lobby.js)
//   hand     steps aside to the first open ground on the road was: a tap-driven relocation
//   jewel    floor of 7, still immune to softening            was: cannot be softened
//   veil     turns the first card that lodges beside it       was: safe on the turn it lands
//   claws    its claimer fights -2                             was: -1
//   crown    counts two beside its own ground                 was: counts two on the two edges
//   heart    counts two while its side holds less of the road was: cannot be softened
//   flock    what it claims turns as it joins                 was: neighbours +1 on claim
//   district counts two AND silences both sides               was: counts two while untouched
//   drum     answers what's taken from its side, anywhere     was: its claim struck onward
//   void     everything beside it fights -1                   was: safe while alone
//   hideaway its own ground counts two                        was: silenced the loudest neighbour
//   guide    trades the two grounds beside it as it lands     was: a tap-driven swap
//   throne   twoFaced now gates on lvl>=2 (a harness/engine bug: it made the asleep and awake
//            arms of any awake/asleep comparison identical). its "turn in place" is a tap on
//            your own turn — player tempo the sim still doesn't model; unlisted above.
//
// deliberate deviations from the prototype, all of them player-side tempo the sim cannot use:
//   the throne's turn-in-place (see above) is not modelled.
//   her seeded tie-break (FNV over the date) is replaced by a deterministic hash over the move
//   itself (id, slot, face), not hand order — see moveKey() — so runs are repeatable and a
//   card's measured worth can't depend on where it sits in the hand.
//   tempers are omitted: they are a tie-break filter above the same seed.
// everything else is line-for-line the shipped behaviour. conformance vectors: see VECTORS below.

const POOL = [
  ["the gate", 6, 5, "gate"], ["the bearer", 6, 4, "bearer"], ["the gathered stars", 7, 6, "gathered"],
  ["the follower", 7, 7, "follower"], ["the blaze", 5, 6, "blaze"], ["the storm", 8, 5, "storm"],
  ["the return", 7, 6, "return"], ["the ghost", 6, 6, "ghost"], ["the glance", 4, 6, "glance"],
  ["the throne", 6, 9, "throne"], ["the mane", 6, 5, "mane"], ["the turning", 7, 5, "turning"],
  ["the hand", 7, 4, "hand"], ["the jewel", 7, 7, "jewel"], ["the veil", 8, 2, "veil"],
  ["the claws", 6, 6, "claws"], ["the crown", 6, 6, "crown"], ["the heart", 7, 7, "heart"],
  ["the root", 7, 6, "root"], ["the flock", 6, 6, "flock"], ["the empty district", 2, 8, "district"],
  ["the listener", 7, 4, "listener"], ["the drum", 4, 7, "drum"], ["the void", 9, 2, "void"],
  ["the hideaway", 5, 6, "hideaway"], ["the chamber", 7, 5, "chamber"], ["the guide", 6, 5, "guide"],
  ["the thread", 5, 6, "thread"],
];
const PLANETS = {
  101: { name: "saturn", l: 9, r: 5, ab: "saturn", homeM: 26 },
  102: { name: "mars", l: 8, r: 6, ab: "mars", homeM: 14 },
  103: { name: "venus", l: 4, r: 7, ab: "venus", homeM: 22 },
  104: { name: "mercury", l: 6, r: 5, ab: "mercury", homeM: 8 },
  105: { name: "jupiter", l: 7, r: 8, ab: "jupiter", homeM: 2 },
};

// lvl: 1 = asleep (numbers only), 2+ = signature awake. numbers are re-baselined by default (22 aug 2026);
// pass legacyBase:true to reproduce the old level-climbing numbers.
function makeCards(opts) {
  const o = opts || {}, C = {};
  POOL.forEach((p, idx) => {
    const id = idx + 1;
    let l = p[1], r = p[2];
    const lvl = o.levels && o.levels[id] != null ? o.levels[id] : (o.lvl || 2);
    if (o.legacyBase) { // pre-22-aug: numbers climbed with level
      if (lvl >= 3) { if (l <= r) l = Math.min(9, l + 1); else r = Math.min(9, r + 1); }
      if (lvl >= 4) { l = Math.min(9, l + 1); r = Math.min(9, r + 1); }
    } else { // the re-baseline: what used to be L3, from night one, and levels never touch numbers again
      if (l <= r) l = Math.min(9, l + 1); else r = Math.min(9, r + 1);
    }
    C[id] = { id, name: p[0], l, r, ab: o.silence === id ? null : p[3], lvl, who: "you", twoFaced: p[3] === "throne" && lvl >= 2, homeM: id };
  });
  Object.keys(PLANETS).forEach(k => { C[k] = { ...PLANETS[k], id: +k, who: "sky", lvl: 3 }; });
  if (o.homes) Object.keys(o.homes).forEach(k => { C[k] = { ...C[k], homeM: o.homes[k] }; });
  return C;
}

function mkGame(cfg) {
  const g = {
    C: cfg.C, tonight: cfg.tonight || 1, len: cfg.len || 9,
    slots: Array.from({ length: cfg.len || 9 }, () => null),
    you: (cfg.you || []).slice(), sky: (cfg.sky || []).slice(),
    turn: cfg.leader || "you", retUsed: false, glanceOn: false,
    depth: cfg.depth == null ? 8 : cfg.depth, tieRule: cfg.tieRule || "you",
    jupiterMode: cfg.jupiterMode || "always", stats: { flips: 0, leads: 0 },
    // the mane's single-player asymmetry (see slotW) must not carry into PvP, same reason
    // as tieRule above — whichever seat is locally labeled "you" would get a free advantage.
    maneFair: cfg.maneFair || false,
  };
  // the gate lodges before her lead — either hand's gate seizes the lead, not just "you"'s
  const hasGate = ids => ids.some(id => on(g, g.C[id]) && g.C[id].ab === "gate");
  if (g.turn === "sky" && hasGate(g.you)) g.turn = "you";
  else if (g.turn === "you" && hasGate(g.sky)) g.turn = "sky";
  return g;
}
const on = (g, c) => !!c && !!c.ab && (c.who === "sky" || c.lvl >= 2);
const nb = (g, i, d) => { const k = i + d; return k >= 0 && k < g.len ? k : -1; };
const boardM = (g, i) => ((g.tonight - 1 + i) % 28) + 1;
const isHome = (g, id, i) => (g.C[id].homeM || id) === boardM(g, i);

// the hard light: the jewel is immune to softening (see faceOf's floor-of-7 too)
function noSoften(g, slots, i) {
  const s = slots[i]; if (!s) return false;
  const c = g.C[s.id];
  return c.ab === "jewel" && on(g, c);
}
// every face modifier in the slate, resolved live
function faceOf(g, slots, i, dir) {
  const s = slots[i]; if (!s) return 0;
  const c = g.C[s.id];
  let v = dir === 1 ? s.r : s.l;
  let d = 0;
  if (c.ab === "root" && on(g, c) && s.first) d += 1;
  if (s.clawed) d -= 2;
  if (s.ghosted) d -= 2;
  if (s.glanced) d -= 2;
  for (const dd of [-1, 1]) {
    const k = nb(g, i, dd); if (k < 0 || !slots[k]) continue;
    const n = g.C[slots[k].id]; if (!on(g, n)) continue;
    if (n.ab === "void") d -= 1;
  }
  if (d < 0 && noSoften(g, slots, i)) d = 0;
  if (c.ab === "jewel" && on(g, c)) return Math.max(7, v + d);
  return Math.max(1, v + d);
}
function safeNow(g, slots, ti) {
  const t = slots[ti]; if (!t) return false;
  const age = t.age || 0;
  if (age <= 1) for (const d of [-1, 1]) { const k = nb(g, ti, d); if (k < 0 || !slots[k] || slots[k].owner !== t.owner) continue; const n = g.C[slots[k].id]; if (n.ab === "chamber" && on(g, n)) return true; }
  return false;
}
function tryFlip(g, slots, ai, ti, dir) {
  const a = slots[ai], t = slots[ti];
  if (!t || !a || t.owner === a.owner) return false;
  const aC = g.C[a.id], tC = g.C[t.id];
  const av = faceOf(g, slots, ai, dir), tv = faceOf(g, slots, ti, -dir);
  const stormFace = tC.ab === "storm" && on(g, tC); // ties never take the storm, wherever it stands
  const tie = av === tv && !stormFace;
  if (!(av > tv || tie)) return false;
  if (tC.ab === "saturn") return false;
  if (safeNow(g, slots, ti)) return false;
  if (tC.ab === "return" && on(g, tC) && t.came === false && isHome(g, t.id, ti)) return "return";
  t.owner = a.owner;
  if (tC.ab === "claws" && on(g, tC)) slots[ai] = { ...slots[ai], clawed: true };
  if (aC.ab === "flock" && on(g, aC)) slots[ti] = { ...slots[ti], l: slots[ti].r, r: slots[ti].l };
  for (const d of [-1, 1]) { // the bearer: whatever it claims beside it, the ground locks to its own side
    const k = nb(g, ti, d); if (k < 0 || !slots[k] || slots[k].owner !== a.owner) continue;
    const n = g.C[slots[k].id]; if (n.ab === "bearer" && on(g, n)) slots[ti] = { ...slots[ti], ground: a.owner };
  }
  return tie ? "tie" : true;
}
function lodge(g, slotsIn, cardId, i, rev, side) {
  const c = g.C[cardId], own = side || c.who;
  const slots = slotsIn.slice().map(x => x ? { ...x, age: (x.age || 0) + 1 } : x);
  const first = !slotsIn.some(x => x && x.owner === own);
  slots[i] = { id: cardId, l: rev ? c.r : c.l, r: rev ? c.l : c.r, owner: own, age: 0, first };
  if (g.glanceOn && g.glanceOn !== own) slots[i].glanced = true;
  if (c.ab === "blaze" && on(g, c)) slots[i].ground = own;
  if (c.ab === "return" && on(g, c)) slots[i].came = g.retUsed ? true : false;
  if (c.ab === "turning" && on(g, c)) {
    let best = -1, bv = 0;
    [-1, 1].forEach(d => { const k = nb(g, i, d); if (k < 0 || !slots[k] || slots[k].owner === own) return;
      const face = d === 1 ? slots[k].l : slots[k].r, back = d === 1 ? slots[k].r : slots[k].l;
      if (face > back && face - back > bv) { bv = face - back; best = k; } });
    if (best >= 0) slots[best] = { ...slots[best], l: slots[best].r, r: slots[best].l };
  }
  if (c.ab === "venus") [-1, 1].forEach(d => {
    const t = nb(g, i, d); if (t < 0 || !slots[t] || noSoften(g, slots, t)) return;
    const key = d === 1 ? "l" : "r";
    if (slots[t][key] > 1) slots[t] = { ...slots[t], [key]: slots[t][key] - 1 };
  });
  if (c.ab === "guide" && on(g, c)) { // it trades the grounds beside it as it lands
    const a = nb(g, i, -1), b = nb(g, i, 1);
    if (a >= 0 && b >= 0 && slots[a] && slots[b]) {
      const ta = { ...slots[a] }, tb2 = { ...slots[b] };
      slots[a] = { ...tb2, age: ta.age }; slots[b] = { ...ta, age: tb2.age };
    }
  }
  for (const d of [-1, 1]) { // lodged beside the bearer: the ground is its owner's from the start
    const k = nb(g, i, d); if (k < 0 || !slots[k] || slots[k].owner !== own) continue;
    const n = g.C[slots[k].id]; if (n.ab === "bearer" && on(g, n)) slots[i].ground = own;
  }
  for (const d of [-1, 1]) { // the ghost chills, the veil turns, the hand steps aside — only ever an opponent's card
    const k = nb(g, i, d); if (k < 0 || !slots[k] || slots[k].owner === own) continue;
    const n = g.C[slots[k].id]; if (!on(g, n)) continue;
    if (n.ab === "ghost" && !slots[k].vused) { slots[k] = { ...slots[k], vused: true }; slots[i].ghosted = true; }
    if (n.ab === "veil" && !slots[k].vused) { slots[k] = { ...slots[k], vused: true }; slots[i] = { ...slots[i], l: slots[i].r, r: slots[i].l }; }
    if (n.ab === "hand" && !slots[k].moved) {
      const away = slots.findIndex(x => !x);
      if (away >= 0) { slots[away] = { ...slots[k], moved: true, age: 0 }; slots[k] = null; }
    }
  }
  return slots;
}
function resolve(g, slotsIn, cardId, i, rev, side) {
  const own = side || g.C[cardId].who;
  const slots = lodge(g, slotsIn, cardId, i, rev, side);
  const queue = [], ret = [], seq = [];
  for (const d of [-1, 1]) { // the listener strikes what lands beside it
    const k = nb(g, i, d);
    if (k >= 0 && slots[k] && slots[k].owner !== own && g.C[slots[k].id].ab === "listener" && on(g, g.C[slots[k].id])) queue.push({ from: k, to: i, dir: -d });
  }
  queue.push({ from: i, to: nb(g, i, -1), dir: -1 }, { from: i, to: nb(g, i, 1), dir: 1 });
  let flips = 0, guard = 0;
  while (queue.length && guard++ < 60) {
    const { from, to, dir } = queue.shift();
    if (to < 0 || !slots[from] || !slots[to]) continue;
    const res = tryFlip(g, slots, from, to, dir);
    if (!res) continue;
    flips++;
    if (res === "return") { seq.push({ from, to, dir, ret: slots[to].id }); ret.push(slots[to].id); slots[to] = null; continue; }
    seq.push({ from, to, dir, owner: slots[to].owner });
    if (res === "tie") for (const d of [-1, 1]) { const far = nb(g, to, d); if (far >= 0 && far !== from) queue.push({ from: to, to: far, dir: d }); }
    const claimer = slots[from].owner, victim = claimer === "you" ? "sky" : "you";
    if (!slots[to].drummed) { // the drum answers what's taken from its own side, from wherever it stands
      const ks = slots.map((x, xi) => x && x.owner === victim && g.C[x.id].ab === "drum" && on(g, g.C[x.id]) ? xi : -1).filter(xi => xi >= 0);
      if (ks.length) { const k = ks[0]; slots[to] = { ...slots[to], drummed: true }; queue.push({ from: k, to, dir: k > to ? -1 : 1 }); }
    }
    const fk = nb(g, to, 1);
    if (fk >= 0 && slots[fk] && slots[fk].owner === victim && !slots[to].followed) {
      const n = g.C[slots[fk].id];
      if (n.ab === "follower" && on(g, n)) { slots[to] = { ...slots[to], followed: true }; queue.push({ from: fk, to, dir: -1 }); }
    }
    if (g.C[slots[from].id].ab === "mars") { const far = nb(g, to, dir); if (far >= 0) queue.push({ from: to, to: far, dir }); }
  }
  return { slots, flips, ret, seq };
}
function slotW(g, slots, i, ctx) {
  const s = slots[i]; if (!s) return { who: null, w: 0 };
  if (ctx && ctx.sil[i]) return { who: null, w: 0, silent: true };
  const c = g.C[s.id], home = isHome(g, s.id, i), own = s.ground || s.owner;
  let j = 0;
  if (c.ab === "jupiter") j = g.jupiterMode === "on its home only" ? (home ? 1 : 0) : g.jupiterMode === "while she holds it" ? (s.owner === "sky" ? 1 : 0) : 1;
  let w = 1 + j + (home ? 1 : 0);
  if (on(g, c)) {
    if (c.ab === "gathered") w += 1;
    if (c.ab === "crown") { for (const d of [-1, 1]) { const k = nb(g, i, d); if (k >= 0 && slots[k] && (slots[k].ground || slots[k].owner) === own) { w += 1; break; } } }
    if (c.ab === "district") w += 1;
    if (c.ab === "hideaway") w += 1;
    if (c.ab === "heart") { // a comeback card: counts two while its own side holds less of the road
      let mine = 0, theirs = 0;
      slots.forEach(x => { if (!x) return; (x.ground || x.owner) === own ? mine++ : theirs++; });
      if (theirs > mine) w += 1;
    }
  }
  let who = own;
  if (ctx && ctx.thread && (i === 0 || i === g.len - 1)) who = ctx.thread;
  if (on(g, c) && c.ab === "mane") {
    const a = nb(g, i, -1), b = nb(g, i, 1);
    if (a >= 0 && b >= 0 && slots[a] && slots[b]) {
      const oa = slots[a].ground || slots[a].owner, ob = slots[b].ground || slots[b].owner;
      // single-player only: whoever holds both its neighbours gains the mane's count, but
      // never the sky — measured 25 aug, a symmetric version favoured her by -3.0 net,
      // because her own evaluation claims in pairs more often than the player does.
      // g.maneFair (set true for PvP, see mkGame) restores the symmetric version so
      // neither PvP seat gets a free advantage from whichever side is locally "you".
      if (oa === ob && (g.maneFair || oa === "you")) who = oa;
    }
  }
  return { who, w };
}
function ctxOf(g, slots) {
  let thread = null;
  slots.forEach(s => { if (s && g.C[s.id].ab === "thread" && on(g, g.C[s.id])) thread = s.ground || s.owner; });
  const sil = {};
  slots.forEach((s, i) => { // the empty district silences both sides of it
    if (!s) return; const c = g.C[s.id];
    if (c.ab !== "district" || !on(g, c)) return;
    [-1, 1].forEach(d => { const k = nb(g, i, d); if (k >= 0 && slots[k]) sil[k] = true; });
  });
  return { thread, sil };
}
function counts(g, slots) {
  const ctx = ctxOf(g, slots);
  let you = 0, sky = 0;
  slots.forEach((s, i) => { const r = slotW(g, slots, i, ctx); if (!r.who) return; if (r.who === "you") you += r.w; else sky += r.w; });
  return [you, sky];
}
function boardWinner(g, slots) {
  const [you, sky] = counts(g, slots);
  if (you !== sky) return you > sky ? "you" : "sky";
  return g.tieRule === "the sky" ? "sky" : g.tieRule === "a draw" ? "draw" : "you";
}

const legalSlots = (g) => g.slots.map((s, i) => s ? -1 : i).filter(i => i >= 0);
function bestYouReply(g, slots, hand) {
  let best = null;
  hand.forEach(id => {
    (g.C[id].twoFaced ? [false, true] : [false]).forEach(rev => {
      slots.forEach((s, i) => {
        if (s) return;
        const [y, k] = counts(g, resolve(g, slots, id, i, rev, "you").slots);
        if (best === null || y - k > best) best = y - k;
      });
    });
  });
  return best;
}
// her move: greedy on the count, plus a two-ply reply term weighted by reading depth
// A STABLE, HAND-ORDER-INDEPENDENT TIEBREAK.
// The agents used a strict `>`, so among equally-scored moves whichever came FIRST IN HAND
// ORDER won. That made the order of the five worth 17.9 points to careful play. Ties now
// break on a hash of the move itself, so shuffling the hand cannot change the choice.
function moveKey(g, id, i, rev) {
  let h = (((id * 73856093) ^ (i * 19349663) ^ ((rev ? 1 : 0) * 83492791) ^ ((g.tonight || 1) * 2654435761)) >>> 0);
  h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0;
  return h >>> 0;
}
function skyMove(g) {
  let best = null;
  g.sky.forEach(id => {
    const revs = (g.C[id].ab === "mercury" || g.C[id].twoFaced) ? [false, true] : [false];
    revs.forEach(rev => {
      legalSlots(g).forEach(i => {
        const r = resolve(g, g.slots, id, i, rev, "sky");
        const [y, k] = counts(g, r.slots);
        let score = (k - y) * 10;
        if (g.depth > 0) {
          const rest = g.sky.filter(x => x !== id);
          const reply = bestYouReply(g, r.slots, g.you);
          if (reply !== null) score -= reply * g.depth;
        }
        const key = moveKey(g, id, i, rev);
        if (best === null || score > best.score || (score === best.score && key > best.key)) best = { id, i, rev, score, r, key };
      });
    });
  });
  return best;
}
function youMove(g) { // the careful player: same shape, so skill is one dial
  let best = null;
  g.you.forEach(id => {
    (g.C[id].twoFaced ? [false, true] : [false]).forEach(rev => {
      legalSlots(g).forEach(i => {
        const r = resolve(g, g.slots, id, i, rev, "you");
        const [y, k] = counts(g, r.slots);
        let score = (y - k) * 10;
        if (g.youDepth > 0) {
          let worst = null;
          g.sky.forEach(sid => legalSlots({ ...g, slots: r.slots }).forEach(si => {
            if (r.slots[si]) return;
            const r2 = resolve({ ...g, slots: r.slots }, r.slots, sid, si, false, "sky");
            const [y2, k2] = counts(g, r2.slots);
            if (worst === null || k2 - y2 > worst) worst = k2 - y2;
          }));
          if (worst !== null) score -= worst * g.youDepth;
        }
        const key = moveKey(g, id, i, rev);
        if (best === null || score > best.score || (score === best.score && key > best.key)) best = { id, i, rev, score, r, key };
      });
    });
  });
  return best;
}
function playBoard(cfg) {
  const g = mkGame(cfg);
  g.youDepth = cfg.youDepth == null ? 8 : cfg.youDepth;
  let flips = 0, guard = 0;
  while (g.slots.some(s => !s) && (g.you.length || g.sky.length) && guard++ < 40) {
    const side = g.turn;
    const mv = side === "you" ? (g.you.length ? youMove(g) : null) : (g.sky.length ? skyMove(g) : null);
    if (!mv) { g.turn = side === "you" ? "sky" : "you"; continue; }
    g.slots = mv.r.slots; flips += mv.r.flips;
    if (side === "you") g.you = g.you.filter(x => x !== mv.id); else g.sky = g.sky.filter(x => x !== mv.id);
    if (mv.r.ret.length) { g.you = g.you.concat(mv.r.ret); g.retUsed = true; }
    g.glanceOn = (g.C[mv.id].ab === "glance" && on(g, g.C[mv.id])) ? side : false;
    g.turn = side === "you" ? "sky" : "you";
  }
  const [you, sky] = counts(g, g.slots);
  return { winner: boardWinner(g, g.slots), you, sky, flips, slots: g.slots };
}

// the five dealt from the pack: seeded, tonight's mansion first when it is carried
function deal(pack, seed, tonight, guarantee) {
  if (!pack || pack.length <= 5) return (pack || []).slice();
  let h = (seed ^ 2166136261) >>> 0;
  const rnd = () => { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; };
  const bag = pack.slice(), out = [];
  if (guarantee !== false && bag.includes(tonight)) out.push(bag.splice(bag.indexOf(tonight), 1)[0]);
  while (out.length < 5 && bag.length) out.push(bag.splice(Math.floor(rnd() * bag.length), 1)[0]);
  return out;
}

// conformance vectors: a port is faithful only if every one of these reproduces.
// each is [name, setup, expectation]; run them with runVectors().
const VECTORS = [
  ["ties flip", g => { g.slots[0] = { id: 17, owner: "you", l: 6, r: 6, age: 3 }; return resolve(g, g.slots, 1, 1, false, "sky").slots[0].owner; }, "sky"],
  ["a tie-flip strikes on, past her reach", g => {
    // she lodges at 0 and can only reach slot 1. slot 2 falls only because the tie-flip attacks onward.
    g.slots[1] = { id: 17, owner: "you", l: 6, r: 6, age: 3 }; g.slots[2] = { id: 16, owner: "you", l: 6, r: 6, age: 3 };
    const r = resolve(g, g.slots, 1, 0, false, "sky");
    return [r.slots[1].owner, r.slots[2].owner].join("/");
  }, "sky/sky"],
  ["tied counts are yours", g => { g.slots[0] = { id: 1, owner: "you", l: 6, r: 5, age: 1 }; g.slots[1] = { id: 2, owner: "sky", l: 6, r: 4, age: 1 }; g.len = 2; return boardWinner(g, g.slots.slice(0, 2)); }, "you"],
  ["saturn's ground is never claimed", g => { g.slots[1] = { id: 101, owner: "sky", l: 9, r: 5, age: 3 }; return resolve(g, g.slots, 24, 0, false, "you").slots[1].owner; }, "sky"],
  ["dominion counts two", g => { g.tonight = 1; g.slots[0] = { id: 1, owner: "you", l: 6, r: 5, age: 0 }; return counts(g, g.slots)[0]; }, 2],
  ["jupiter counts two", g => { g.slots[3] = { id: 105, owner: "sky", l: 7, r: 8, age: 0 }; return counts(g, g.slots)[1]; }, 2],
  ["the gate takes the lead", g => mkGame({ C: g.C, you: [1], sky: [101], leader: "sky" }).turn, "you"],
  ["the bearer keeps the ground it's lodged beside", g => { g.slots[0] = { id: 2, owner: "you", l: 6, r: 4, age: 2 }; const s = lodge(g, g.slots, 17, 1, false, "you"); return s[1].ground; }, "you"],
  ["the bearer keeps the ground it claims beside", g => { g.slots[0] = { id: 2, owner: "you", l: 6, r: 4, age: 2 }; g.slots[1] = { id: 20, owner: "sky", l: 1, r: 1, age: 3 }; const r = resolve(g, g.slots, 17, 2, false, "you"); return r.slots[1].ground; }, "you"],
  ["the gathered stars count two", g => { g.tonight = 9; g.slots[0] = { id: 3, owner: "you", l: 7, r: 6, age: 0 }; return counts(g, g.slots)[0]; }, 2],
  ["the follower answers when its side is claimed", g => {
    g.slots[1] = { id: 6, owner: "sky", l: 1, r: 1, age: 3 }; g.slots[2] = { id: 4, owner: "sky", l: 9, r: 9, age: 3 };
    const r = resolve(g, g.slots, 17, 0, false, "you"); return [r.slots[1].owner, r.flips].join("/");
  }, "sky/2"],
  ["the blaze keeps its ground", g => { const s = lodge(g, g.slots, 5, 4, false, "you"); s[4].owner = "sky"; return slotW(g, s, 4, ctxOf(g, s)).who; }, "you"],
  ["the storm cannot be tied, anywhere (at home)", g => { g.tonight = 6; g.slots[0] = { id: 6, owner: "you", l: 8, r: 6, age: 3 }; return resolve(g, g.slots, 1, 1, false, "sky").slots[0].owner; }, "you"],
  ["the storm cannot be tied, anywhere (away)", g => { g.tonight = 1; g.slots[0] = { id: 6, owner: "you", l: 8, r: 6, age: 3 }; return resolve(g, g.slots, 1, 1, false, "sky").slots[0].owner; }, "you"],
  ["the return comes home once, on its own ground", g => { g.tonight = 7; const s = lodge(g, g.slots, 7, 0, false, "you"); const r = resolve({ ...g, tonight: 7, slots: s }, s, 101, 1, false, "sky"); return [r.slots[0] === null ? "gone" : "stayed", r.ret[0]].join("/"); }, "gone/7"],
  ["the return does not trigger off its own ground", g => { g.tonight = 1; const s = lodge(g, g.slots, 7, 0, false, "you"); const r = resolve({ ...g, tonight: 1, slots: s }, s, 101, 1, false, "sky"); return r.slots[0] === null ? "gone" : "stayed"; }, "stayed"],
  ["the ghost dims the first opposing lodge beside it, once", g => {
    g.slots[1] = { id: 8, owner: "you", l: 6, r: 6, age: 2 };
    const s1 = lodge(g, g.slots, 101, 2, false, "sky"); const f1 = faceOf({ ...g, slots: s1 }, s1, 2, -1);
    const s2 = lodge({ ...g, slots: s1 }, s1, 102, 0, false, "sky"); const f2 = faceOf({ ...g, slots: s2 }, s2, 0, 1);
    return f1 + "/" + f2;
  }, "7/6"],
  ["the glance dims her next by two", g => { g.glanceOn = true; const s = lodge(g, g.slots, 101, 4, false, "sky"); return faceOf({ ...g, slots: s }, s, 4, 1); }, 3],
  ["the mane: her card, you hold both sides, you gain it", g => { g.slots[1] = { id: 11, owner: "sky", l: 6, r: 5, age: 0 }; g.slots[0] = { id: 20, owner: "you", l: 6, r: 6, age: 2 }; g.slots[2] = { id: 20, owner: "you", l: 6, r: 6, age: 2 }; return slotW(g, g.slots, 1, ctxOf(g, g.slots)).who; }, "you"],
  ["the mane: your card, sky holds both sides, stays yours", g => { g.slots[1] = { id: 11, owner: "you", l: 6, r: 5, age: 0 }; g.slots[0] = { id: 20, owner: "sky", l: 6, r: 6, age: 2 }; g.slots[2] = { id: 20, owner: "sky", l: 6, r: 6, age: 2 }; return slotW(g, g.slots, 1, ctxOf(g, g.slots)).who; }, "you"],
  ["the mane: maneFair restores symmetry for PvP", g => { g.maneFair = true; g.slots[1] = { id: 11, owner: "you", l: 6, r: 5, age: 0 }; g.slots[0] = { id: 20, owner: "sky", l: 6, r: 6, age: 2 }; g.slots[2] = { id: 20, owner: "sky", l: 6, r: 6, age: 2 }; return slotW(g, g.slots, 1, ctxOf(g, g.slots)).who; }, "sky"],
  ["the turning turns her", g => { g.slots[1] = { id: 101, owner: "sky", l: 9, r: 5, age: 2 }; const s = lodge(g, g.slots, 12, 0, false, "you"); return s[1].l; }, 5],
  ["the jewel cannot be softened", g => { g.slots[0] = { id: 14, owner: "you", l: 7, r: 7, age: 2 }; const s = lodge(g, g.slots, 103, 1, false, "sky"); return s[0].r; }, 7],
  ["the veil turns the first card that lodges beside it", g => { const s = lodge(g, g.slots, 15, 0, false, "you"); const s2 = lodge({ ...g, slots: s }, s, 101, 1, false, "sky"); return [s2[1].l, s2[1].r].join(","); }, "5,9"],
  ["baseline: without the veil, no turn happens", g => { g.slots[0] = { id: 1, owner: "you", l: 6, r: 5, age: 3 }; const s2 = lodge(g, g.slots, 101, 1, false, "sky"); return [s2[1].l, s2[1].r].join(","); }, "9,5"],
  ["the claws' claimer fights at -2", g => { g.slots[0] = { id: 16, owner: "you", l: 6, r: 6, age: 3 }; const r = resolve(g, g.slots, 101, 1, false, "sky"); return faceOf({ ...g, slots: r.slots }, r.slots, 1, 1); }, 3],
  ["the crown counts two beside its own ground", g => { g.slots[0] = { id: 5, owner: "you", l: 5, r: 6, age: 0 }; g.slots[1] = { id: 17, owner: "you", l: 6, r: 6, age: 0 }; return slotW(g, g.slots, 1, ctxOf(g, g.slots)).w; }, 2],
  ["the crown: no bonus with no ground beside it", g => { g.slots[0] = { id: 20, owner: "sky", l: 6, r: 6, age: 0 }; g.slots[1] = { id: 17, owner: "you", l: 6, r: 6, age: 0 }; return slotW(g, g.slots, 1, ctxOf(g, g.slots)).w; }, 1],
  ["the heart counts two while its side holds less of the road", g => { g.slots[0] = { id: 18, owner: "you", l: 7, r: 7, age: 0 }; g.slots[1] = { id: 20, owner: "sky", l: 6, r: 6, age: 0 }; g.slots[2] = { id: 20, owner: "sky", l: 6, r: 6, age: 0 }; return slotW(g, g.slots, 0, ctxOf(g, g.slots)).w; }, 2],
  ["the heart: no bonus while ahead or even", g => { g.slots[0] = { id: 18, owner: "you", l: 7, r: 7, age: 0 }; g.slots[1] = { id: 20, owner: "you", l: 6, r: 6, age: 0 }; return slotW(g, g.slots, 0, ctxOf(g, g.slots)).w; }, 1],
  ["the root opens higher", g => { const s = lodge(g, g.slots, 19, 3, false, "you"); return faceOf({ ...g, slots: s }, s, 3, 1); }, 8],
  ["the flock turns what it claims as it joins", g => { g.slots[0] = { id: 20, owner: "sky", l: 2, r: 3, age: 3 }; const r = resolve(g, g.slots, 20, 1, false, "you"); return [r.slots[0].owner, r.slots[0].l, r.slots[0].r].join(","); }, "you,3,2"],
  ["the empty district counts two, unconditionally", g => { g.tonight = 5; g.slots[4] = { id: 21, owner: "you", l: 2, r: 8, age: 0 }; g.slots[3] = { id: 101, owner: "sky", l: 9, r: 5, age: 0 }; return counts(g, g.slots)[0]; }, 2],
  ["the empty district silences both sides of it", g => { g.slots[1] = { id: 21, owner: "you", l: 2, r: 8, age: 0 }; g.slots[0] = { id: 1, owner: "sky", l: 6, r: 5, age: 0 }; g.slots[2] = { id: 1, owner: "sky", l: 6, r: 5, age: 0 }; return counts(g, g.slots)[1]; }, 0],
  ["the listener strikes what lands", g => { g.slots[0] = { id: 22, owner: "you", l: 7, r: 4, age: 3 }; return resolve(g, g.slots, 21, 1, false, "sky").slots[1].owner; }, "you"],
  ["the drum answers what's taken from its side, from wherever it stands", g => {
    g.slots[8] = { id: 23, owner: "you", l: 9, r: 9, age: 3 }; g.slots[1] = { id: 20, owner: "you", l: 1, r: 1, age: 3 };
    const r = resolve(g, g.slots, 101, 0, false, "sky"); return [r.slots[1] && r.slots[1].owner, r.flips].join("/");
  }, "you/2"],
  ["the void weakens everything beside it, either owner", g => {
    g.slots[4] = { id: 24, owner: "you", l: 5, r: 6, age: 2 }; g.slots[3] = { id: 1, owner: "sky", l: 6, r: 5, age: 2 }; g.slots[5] = { id: 1, owner: "you", l: 6, r: 5, age: 2 };
    return [faceOf(g, g.slots, 3, 1), faceOf(g, g.slots, 5, -1)].join(",");
  }, "4,5"],
  ["the hideaway counts its own ground two", g => { g.slots[0] = { id: 25, owner: "you", l: 5, r: 6, age: 0 }; return slotW(g, g.slots, 0, ctxOf(g, g.slots)).w; }, 2],
  ["the chamber shields a landing", g => { g.slots[0] = { id: 26, owner: "you", l: 7, r: 5, age: 3 }; const s = lodge(g, g.slots, 20, 1, false, "you"); return resolve({ ...g, slots: s }, s, 101, 2, false, "sky").slots[1].owner; }, "you"],
  ["the guide trades the two grounds beside it as it lands", g => {
    g.slots[0] = { id: 1, owner: "you", l: 6, r: 5, age: 5 }; g.slots[2] = { id: 2, owner: "sky", l: 6, r: 4, age: 7 };
    const s = lodge(g, g.slots, 27, 1, false, "you");
    return [s[0].id, s[0].owner, s[0].age, s[2].id, s[2].owner, s[2].age].join(",");
  }, "2,sky,6,1,you,8"],
  ["the thread holds both ends", g => { g.slots[0] = { id: 101, owner: "sky", l: 9, r: 5, age: 0 }; g.slots[8] = { id: 102, owner: "sky", l: 8, r: 6, age: 0 }; g.slots[4] = { id: 28, owner: "you", l: 5, r: 6, age: 0 }; return counts(g, g.slots)[1]; }, 0],
  ["the casual agent's move", g => { const q = mkGame({ C: g.C, tonight: 11, you: [5, 10, 18], sky: [102, 104], leader: "you", depth: 8 }); q.slots[2] = { id: 6, owner: "you", l: 8, r: 6, age: 2 }; q.slots[3] = { id: 101, owner: "sky", l: 9, r: 5, age: 1 }; q.youDepth = 0; const m = youMove(q); return m.id + "@" + m.r.slots.findIndex((s, i) => s && !q.slots[i]); }, "18@7"],
  // Re-baselined for the moveKey tiebreak (item 1, 25 Aug handoff): all three were
  // genuine ties under the old strict `>` compare, resolved by hand-order position.
  // The new hash-based tiebreak picks a different (still valid) tied move.
  ["the careful agent's move", g => { const q = mkGame({ C: g.C, tonight: 11, you: [5, 10, 18], sky: [102, 104], leader: "you", depth: 8 }); q.slots[2] = { id: 6, owner: "you", l: 8, r: 6, age: 2 }; q.slots[3] = { id: 101, owner: "sky", l: 9, r: 5, age: 1 }; q.youDepth = 8; const m = youMove(q); return m.id + "@" + m.r.slots.findIndex((s, i) => s && !q.slots[i]); }, "10@8"],
  ["her move on the same board", g => { const q = mkGame({ C: g.C, tonight: 11, you: [5, 10, 18], sky: [102, 104], leader: "sky", depth: 8 }); q.slots[2] = { id: 6, owner: "you", l: 8, r: 6, age: 2 }; q.slots[3] = { id: 101, owner: "sky", l: 9, r: 5, age: 1 }; const m = skyMove(q); return m.id + "@" + m.r.slots.findIndex((s, i) => s && !q.slots[i]); }, "104@1"],
  ["a full board plays out", g => { const r = playBoard({ C: g.C, tonight: 11, you: [5, 6, 10, 17, 18], sky: [101, 102, 103, 104, 105], leader: "sky", depth: 8, youDepth: 8 }); return r.winner + "/" + r.you + "/" + r.sky; }, "you/7/4"],

  // owner-relative pass (24 aug 2026): every signature above is framed from the "you" seat.
  // these mirror them from the "sky" seat to prove the fix isn't seat-locked either way.
  ["[sky] the bearer keeps the ground it's lodged beside", g => { g.slots[0] = { id: 2, owner: "sky", l: 6, r: 4, age: 2 }; const s = lodge(g, g.slots, 17, 1, false, "sky"); return s[1].ground; }, "sky"],
  ["[sky] the bearer keeps the ground it claims beside", g => { g.slots[0] = { id: 2, owner: "sky", l: 6, r: 4, age: 2 }; g.slots[1] = { id: 20, owner: "you", l: 1, r: 1, age: 3 }; const r = resolve(g, g.slots, 17, 2, false, "sky"); return r.slots[1].ground; }, "sky"],
  ["[sky] the ghost dims the first opposing lodge, once", g => { g.slots[1] = { id: 8, owner: "sky", l: 6, r: 6, age: 2 }; const s1 = lodge(g, g.slots, 101, 2, false, "you"); return faceOf({ ...g, slots: s1 }, s1, 2, -1); }, 7],
  ["[sky] the turning turns them", g => { g.slots[1] = { id: 101, owner: "you", l: 9, r: 5, age: 2 }; const s = lodge(g, g.slots, 12, 0, false, "sky"); return s[1].l; }, 5],
  ["[sky] the jewel cannot be softened", g => { g.slots[0] = { id: 14, owner: "sky", l: 7, r: 7, age: 2 }; const s = lodge(g, g.slots, 103, 1, false, "you"); return s[0].r; }, 7],
  ["[sky] the veil turns the first card that lodges beside it", g => { const s = lodge(g, g.slots, 15, 0, false, "sky"); const s2 = lodge({ ...g, slots: s }, s, 101, 1, false, "you"); return [s2[1].l, s2[1].r].join(","); }, "5,9"],
  ["[sky] the heart counts two while its side holds less of the road", g => { g.slots[0] = { id: 18, owner: "sky", l: 7, r: 7, age: 0 }; g.slots[1] = { id: 20, owner: "you", l: 6, r: 6, age: 0 }; g.slots[2] = { id: 20, owner: "you", l: 6, r: 6, age: 0 }; return slotW(g, g.slots, 0, ctxOf(g, g.slots)).w; }, 2],
  ["[sky] the void weakens everything beside it too", g => { g.slots[4] = { id: 24, owner: "sky", l: 5, r: 6, age: 2 }; g.slots[3] = { id: 1, owner: "you", l: 6, r: 5, age: 2 }; return faceOf(g, g.slots, 3, 1); }, 4],
  ["[sky] the listener strikes what lands", g => { g.slots[0] = { id: 22, owner: "sky", l: 7, r: 4, age: 3 }; return resolve(g, g.slots, 21, 1, false, "you").slots[1].owner; }, "sky"],
  ["[sky] the chamber shields a landing", g => { g.slots[0] = { id: 26, owner: "sky", l: 7, r: 5, age: 3 }; const s = lodge(g, g.slots, 20, 1, false, "sky"); return resolve({ ...g, slots: s }, s, 101, 2, false, "you").slots[1].owner; }, "sky"],
  ["[sky] the blaze keeps its ground", g => { const s = lodge(g, g.slots, 5, 4, false, "sky"); s[4].owner = "you"; return slotW(g, s, 4, ctxOf(g, s)).who; }, "sky"],
  ["[sky] the return comes home once, on its own ground", g => { g.tonight = 7; const s = lodge(g, g.slots, 7, 0, false, "sky"); const r = resolve({ ...g, tonight: 7, slots: s }, s, 101, 1, false, "you"); return [r.slots[0] === null ? "gone" : "stayed", r.ret[0]].join("/"); }, "gone/7"],
  ["[sky] the glance dims their next by two", g => { g.glanceOn = "sky"; const s = lodge(g, g.slots, 101, 4, false, "you"); return faceOf({ ...g, slots: s }, s, 4, 1); }, 3],
  ["the glance never dims its own caster", g => { g.glanceOn = "you"; const s = lodge(g, g.slots, 101, 4, false, "you"); return faceOf({ ...g, slots: s }, s, 4, 1); }, 5],
  ["[sky] the gate takes the lead", g => mkGame({ C: g.C, you: [101], sky: [1], leader: "you" }).turn, "sky"],
];
function runVectors(opts) {
  const out = [];
  VECTORS.forEach(([name, fn, want]) => {
    const C = makeCards(opts || {});
    const g = mkGame({ C, you: [], sky: [], tonight: 1 });
    let got;
    try { got = fn(g); } catch (e) { got = "threw: " + e.message; }
    out.push({ name, want, got, pass: String(got) === String(want) });
  });
  return out;
}

const API = { POOL, PLANETS, makeCards, mkGame, on, nb, isHome, faceOf, safeNow, tryFlip, lodge, resolve, counts, slotW, ctxOf, boardWinner, bestYouReply, skyMove, youMove, playBoard, deal, VECTORS, runVectors };
if (typeof module !== "undefined") module.exports = API;
if (typeof window !== "undefined") window.ManzilEngineV6 = API;
