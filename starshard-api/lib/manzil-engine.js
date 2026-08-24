// SYNCED FILE — mirrors "Star Shard v3 Build Plan/research/manzil-engine-v6.js" verbatim.
// This is the server-authoritative copy for real-time PvP move validation
// (starshard-api/lib/manzil-lobby.js). Never hand-edit here: change the
// research copy and re-copy, same discipline as the frontend's generated
// files (see CLAUDE.md's ownership table).
//
// manzil engine v6 — a port of "Manzil - Prototype.dc.html" as shipped 22 august 2026.
// scope: the whole live ruleset. all 28 mansion signatures, her five planets, the base laws
// (ties flip · a tie-flip attacks both its own neighbours · tied counts are yours), dominion,
// jupiter's counts-two, the dealt five, and her two-ply reply at a per-rung reading depth.
//
// deliberate deviations from the prototype, all of them player-side tempo the sim cannot use:
//   the hand (13) and the guide (27) are tap-driven relocations. they lodge as plain cards here.
//   her seeded tie-break (FNV over the date) is replaced by lowest-index, so runs are repeatable.
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
    C[id] = { id, name: p[0], l, r, ab: o.silence === id ? null : p[3], lvl, who: "you", twoFaced: p[3] === "throne", homeM: id };
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

function hasAwake(g, slots, ab, own) {
  return slots.some(s => s && s.owner === own && g.C[s.id].ab === ab && on(g, g.C[s.id]));
}
function noSoften(g, slots, i) {
  const s = slots[i]; if (!s) return false;
  const c = g.C[s.id];
  if (c.ab === "jewel" && on(g, c)) return true;
  return hasAwake(g, slots, "heart", s.owner);
}
// every face modifier in the slate, resolved live
function faceOf(g, slots, i, dir) {
  const s = slots[i]; if (!s) return 0;
  const c = g.C[s.id];
  let v = dir === 1 ? s.r : s.l;
  if (c.ab === "follower" && on(g, c) && dir === -1) { const k = nb(g, i, -1); if (k >= 0 && slots[k]) v = Math.max(v, slots[k].r); }
  let d = 0;
  if (c.ab === "mane" && on(g, c)) { const a = nb(g, i, -1), b = nb(g, i, 1); if (a >= 0 && b >= 0 && slots[a] && slots[b]) d += 1; }
  if (c.ab === "root" && on(g, c) && s.first) d += 1;
  if (s.clawed) d -= 1;
  if (s.flocked) d += 1;
  if (s.glanced) d -= 1;
  const filled = slots.filter(x => x).length;
  for (const dd of [-1, 1]) {
    const k = nb(g, i, dd); if (k < 0 || !slots[k]) continue;
    const n = g.C[slots[k].id]; if (!on(g, n)) continue;
    if (n.ab === "bearer" && slots[k].owner === s.owner) d += 1;
    if (n.ab === "ghost" && slots[k].owner !== s.owner && filled < 5) d -= 1;
  }
  if (d < 0 && noSoften(g, slots, i)) d = 0;
  return Math.max(1, v + d);
}
function safeNow(g, slots, ti) {
  const t = slots[ti]; if (!t) return false;
  const c = g.C[t.id], age = t.age || 0;
  if (c.ab === "veil" && on(g, c) && age <= 1) return true;
  if (c.ab === "void" && on(g, c)) { let n = 0; for (const d of [-1, 1]) { const k = nb(g, ti, d); if (k >= 0 && slots[k]) n++; } if (n <= 1) return true; }
  if (age <= 1) for (const d of [-1, 1]) { const k = nb(g, ti, d); if (k < 0 || !slots[k] || slots[k].owner !== t.owner) continue; const n = g.C[slots[k].id]; if (n.ab === "chamber" && on(g, n)) return true; }
  return false;
}
function tryFlip(g, slots, ai, ti, dir) {
  const a = slots[ai], t = slots[ti];
  if (!t || !a || t.owner === a.owner) return false;
  const aC = g.C[a.id], tC = g.C[t.id];
  const av = faceOf(g, slots, ai, dir), tv = faceOf(g, slots, ti, -dir);
  const stormFace = tC.ab === "storm" && on(g, tC) && isHome(g, t.id, ti);
  const tie = av === tv && !stormFace;
  if (!(av > tv || tie)) return false;
  if (tC.ab === "saturn") return false;
  if (safeNow(g, slots, ti)) return false;
  if (tC.ab === "return" && on(g, tC) && t.came === false) return "return";
  t.owner = a.owner;
  if (tC.ab === "claws" && on(g, tC)) slots[ai] = { ...slots[ai], clawed: true };
  if (aC.ab === "flock" && on(g, aC)) for (const d of [-1, 1]) { const k = nb(g, ai, d); if (k >= 0 && slots[k] && slots[k].owner === a.owner) slots[k] = { ...slots[k], flocked: true }; }
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
  let flips = 0;
  while (queue.length) {
    const { from, to, dir } = queue.shift();
    if (to < 0 || !slots[from] || !slots[to]) continue;
    const res = tryFlip(g, slots, from, to, dir);
    if (!res) continue;
    flips++;
    if (res === "return") { seq.push({ from, to, dir, ret: slots[to].id }); ret.push(slots[to].id); slots[to] = null; continue; }
    seq.push({ from, to, dir, owner: slots[to].owner });
    if (res === "tie") for (const d of [-1, 1]) { const far = nb(g, to, d); if (far >= 0 && far !== from) queue.push({ from: to, to: far, dir: d }); }
    const fromAb = g.C[slots[from].id].ab;
    if (fromAb === "mars" || (fromAb === "drum" && on(g, g.C[slots[from].id]))) { const far = nb(g, to, dir); if (far >= 0) queue.push({ from: to, to: far, dir }); }
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
    if (c.ab === "crown" && (i === 0 || i === g.len - 1)) w += 1;
    if (c.ab === "district") {
      let touch = false;
      for (const d of [-1, 1]) { const k = nb(g, i, d); if (k >= 0 && slots[k] && (slots[k].ground || slots[k].owner) === own) touch = true; }
      if (!touch) w += 1;
    }
  }
  let who = own;
  if (ctx && ctx.thread && (i === 0 || i === g.len - 1)) who = ctx.thread;
  return { who, w };
}
function ctxOf(g, slots) {
  let thread = null;
  slots.forEach(s => { if (s && g.C[s.id].ab === "thread" && on(g, g.C[s.id])) thread = s.ground || s.owner; });
  const sil = {};
  slots.forEach((s, i) => {
    if (!s) return; const c = g.C[s.id];
    if (c.ab !== "hideaway" || !on(g, c)) return;
    const own = s.ground || s.owner;
    let best = -1, bw = -1;
    [-1, 1].forEach(d => { const k = nb(g, i, d); if (k < 0 || !slots[k]) return;
      const r = slotW(g, slots, k, null);
      if (r.who && r.who !== own && r.w > bw) { bw = r.w; best = k; } });
    if (best >= 0) sil[best] = true;
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
function skyMove(g) {
  let best = null;
  g.sky.forEach(id => {
    const revs = g.C[id].ab === "mercury" ? [false, true] : [false];
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
        if (best === null || score > best.score) best = { id, i, rev, score, r };
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
        if (best === null || score > best.score) best = { id, i, rev, score, r };
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
  ["the bearer lifts yours", g => { g.slots[1] = { id: 2, owner: "you", l: 6, r: 4, age: 2 }; g.slots[2] = { id: 17, owner: "you", l: 6, r: 6, age: 2 }; return faceOf(g, g.slots, 2, 1); }, 7],
  ["the gathered stars count two", g => { g.tonight = 9; g.slots[0] = { id: 3, owner: "you", l: 7, r: 6, age: 0 }; return counts(g, g.slots)[0]; }, 2],
  ["the follower copies the left", g => { g.slots[0] = { id: 24, owner: "sky", l: 3, r: 9, age: 2 }; g.slots[1] = { id: 4, owner: "you", l: 7, r: 7, age: 0 }; return faceOf(g, g.slots, 1, -1); }, 9],
  ["the blaze keeps its ground", g => { const s = lodge(g, g.slots, 5, 4, false, "you"); s[4].owner = "sky"; return slotW(g, s, 4, ctxOf(g, s)).who; }, "you"],
  ["the storm cannot be tied at home", g => { g.tonight = 6; g.slots[0] = { id: 6, owner: "you", l: 8, r: 6, age: 3 }; return resolve(g, g.slots, 1, 1, false, "sky").slots[0].owner; }, "you"],
  ["the storm ties away from home", g => { g.tonight = 1; g.slots[0] = { id: 6, owner: "you", l: 8, r: 6, age: 3 }; return resolve(g, g.slots, 1, 1, false, "sky").slots[0].owner; }, "sky"],
  ["the return comes home once", g => { const s = lodge(g, g.slots, 7, 0, false, "you"); const r = resolve({ ...g, slots: s }, s, 101, 1, false, "sky"); return [r.slots[0], r.ret[0]].map(x => x === null ? "gone" : x).join("/"); }, "gone/7"],
  ["the ghost dims hers early", g => { g.slots[1] = { id: 8, owner: "you", l: 6, r: 6, age: 2 }; g.slots[2] = { id: 101, owner: "sky", l: 9, r: 5, age: 2 }; return faceOf(g, g.slots, 2, -1); }, 8],
  ["the ghost fades on a full road", g => { for (let i = 0; i < 5; i++) g.slots[i] = { id: 20, owner: "you", l: 6, r: 6, age: 2 }; g.slots[1] = { id: 8, owner: "you", l: 6, r: 6, age: 2 }; g.slots[2] = { id: 101, owner: "sky", l: 9, r: 5, age: 2 }; return faceOf(g, g.slots, 2, -1); }, 9],
  ["the glance dims her next", g => { g.glanceOn = true; const s = lodge(g, g.slots, 101, 4, false, "sky"); return faceOf({ ...g, slots: s }, s, 4, 1); }, 4],
  ["the mane stands between two", g => { g.slots[0] = { id: 20, owner: "sky", l: 6, r: 6, age: 2 }; g.slots[2] = { id: 20, owner: "sky", l: 6, r: 6, age: 2 }; g.slots[1] = { id: 11, owner: "you", l: 6, r: 5, age: 0 }; return faceOf(g, g.slots, 1, 1); }, 6],
  ["the turning turns her", g => { g.slots[1] = { id: 101, owner: "sky", l: 9, r: 5, age: 2 }; const s = lodge(g, g.slots, 12, 0, false, "you"); return s[1].l; }, 5],
  ["the jewel cannot be softened", g => { g.slots[0] = { id: 14, owner: "you", l: 7, r: 7, age: 2 }; const s = lodge(g, g.slots, 103, 1, false, "sky"); return s[0].r; }, 7],
  ["the veil lands safe", g => { const s = lodge(g, g.slots, 15, 0, false, "you"); return resolve({ ...g, slots: s }, s, 101, 1, false, "sky").slots[0].owner; }, "you"],
  ["the claws bleed their claimer", g => { g.slots[0] = { id: 16, owner: "you", l: 6, r: 6, age: 3 }; const r = resolve(g, g.slots, 101, 1, false, "sky"); return faceOf({ ...g, slots: r.slots }, r.slots, 1, 1); }, 4],
  ["the crown counts two on an edge", g => { g.tonight = 20; g.slots[0] = { id: 17, owner: "you", l: 6, r: 6, age: 0 }; return counts(g, g.slots)[0]; }, 2],
  ["the heart keeps yours from dimming", g => { g.slots[0] = { id: 18, owner: "you", l: 7, r: 7, age: 2 }; g.slots[1] = { id: 20, owner: "you", l: 6, r: 6, age: 2 }; const s = lodge(g, g.slots, 103, 2, false, "sky"); return s[1].r; }, 6],
  ["the root opens higher", g => { const s = lodge(g, g.slots, 19, 3, false, "you"); return faceOf({ ...g, slots: s }, s, 3, 1); }, 8],
  ["the flock lifts yours on a claim", g => { g.slots[0] = { id: 17, owner: "you", l: 6, r: 6, age: 2 }; g.slots[2] = { id: 21, owner: "sky", l: 2, r: 8, age: 2 }; const r = resolve(g, g.slots, 20, 1, false, "you"); return faceOf({ ...g, slots: r.slots }, r.slots, 0, 1); }, 7],
  ["the empty district counts two untouched", g => { g.tonight = 5; g.slots[4] = { id: 21, owner: "you", l: 2, r: 8, age: 0 }; g.slots[3] = { id: 101, owner: "sky", l: 9, r: 5, age: 0 }; return counts(g, g.slots)[0]; }, 2],
  ["the listener strikes what lands", g => { g.slots[0] = { id: 22, owner: "you", l: 7, r: 4, age: 3 }; return resolve(g, g.slots, 21, 1, false, "sky").slots[1].owner; }, "you"],
  ["the drum strikes onward", g => { g.slots[1] = { id: 20, owner: "sky", l: 6, r: 6, age: 3 }; g.slots[2] = { id: 20, owner: "sky", l: 6, r: 6, age: 3 }; const r = resolve(g, g.slots, 23, 0, false, "you"); return [r.slots[1].owner, r.slots[2].owner].join("/"); }, "you/you"],
  ["the void stands alone", g => { const s = lodge(g, g.slots, 24, 4, false, "you"); return resolve({ ...g, slots: s }, s, 105, 5, false, "sky").slots[4].owner; }, "you"],
  ["the hideaway closes the loudest beside it", g => { g.tonight = 26; g.slots[0] = { id: 25, owner: "you", l: 5, r: 6, age: 0 }; g.slots[1] = { id: 101, owner: "sky", l: 9, r: 5, age: 0 }; return counts(g, g.slots)[1]; }, 0],
  ["the chamber shields a landing", g => { g.slots[0] = { id: 26, owner: "you", l: 7, r: 5, age: 3 }; const s = lodge(g, g.slots, 20, 1, false, "you"); return resolve({ ...g, slots: s }, s, 101, 2, false, "sky").slots[1].owner; }, "you"],
  ["the thread holds both ends", g => { g.slots[0] = { id: 101, owner: "sky", l: 9, r: 5, age: 0 }; g.slots[8] = { id: 102, owner: "sky", l: 8, r: 6, age: 0 }; g.slots[4] = { id: 28, owner: "you", l: 5, r: 6, age: 0 }; return counts(g, g.slots)[1]; }, 0],
  ["the casual agent's move", g => { const q = mkGame({ C: g.C, tonight: 11, you: [5, 10, 18], sky: [102, 104], leader: "you", depth: 8 }); q.slots[2] = { id: 6, owner: "you", l: 8, r: 6, age: 2 }; q.slots[3] = { id: 101, owner: "sky", l: 9, r: 5, age: 1 }; q.youDepth = 0; const m = youMove(q); return m.id + "@" + m.r.slots.findIndex((s, i) => s && !q.slots[i]); }, "18@7"],
  ["the careful agent's move", g => { const q = mkGame({ C: g.C, tonight: 11, you: [5, 10, 18], sky: [102, 104], leader: "you", depth: 8 }); q.slots[2] = { id: 6, owner: "you", l: 8, r: 6, age: 2 }; q.slots[3] = { id: 101, owner: "sky", l: 9, r: 5, age: 1 }; q.youDepth = 8; const m = youMove(q); return m.id + "@" + m.r.slots.findIndex((s, i) => s && !q.slots[i]); }, "5@0"],
  ["her move on the same board", g => { const q = mkGame({ C: g.C, tonight: 11, you: [5, 10, 18], sky: [102, 104], leader: "sky", depth: 8 }); q.slots[2] = { id: 6, owner: "you", l: 8, r: 6, age: 2 }; q.slots[3] = { id: 101, owner: "sky", l: 9, r: 5, age: 1 }; const m = skyMove(q); return m.id + "@" + m.r.slots.findIndex((s, i) => s && !q.slots[i]); }, "102@0"],
  ["a full board plays out", g => { const r = playBoard({ C: g.C, tonight: 11, you: [5, 6, 10, 17, 18], sky: [101, 102, 103, 104, 105], leader: "sky", depth: 8, youDepth: 8 }); return r.winner + "/" + r.you + "/" + r.sky; }, "you/8/4"],

  // owner-relative pass (24 aug 2026): every signature above is framed from the "you" seat.
  // these mirror them from the "sky" seat to prove the fix isn't seat-locked either way.
  ["[sky] the bearer lifts its own", g => { g.slots[1] = { id: 2, owner: "sky", l: 6, r: 4, age: 2 }; g.slots[2] = { id: 17, owner: "sky", l: 6, r: 6, age: 2 }; return faceOf(g, g.slots, 2, 1); }, 7],
  ["[sky] the ghost dims theirs early", g => { g.slots[1] = { id: 8, owner: "sky", l: 6, r: 6, age: 2 }; g.slots[2] = { id: 101, owner: "you", l: 9, r: 5, age: 2 }; return faceOf(g, g.slots, 2, -1); }, 8],
  ["[sky] the turning turns them", g => { g.slots[1] = { id: 101, owner: "you", l: 9, r: 5, age: 2 }; const s = lodge(g, g.slots, 12, 0, false, "sky"); return s[1].l; }, 5],
  ["[sky] the jewel cannot be softened", g => { g.slots[0] = { id: 14, owner: "sky", l: 7, r: 7, age: 2 }; const s = lodge(g, g.slots, 103, 1, false, "you"); return s[0].r; }, 7],
  ["[sky] the veil lands safe", g => { const s = lodge(g, g.slots, 15, 0, false, "sky"); return resolve({ ...g, slots: s }, s, 101, 1, false, "you").slots[0].owner; }, "sky"],
  ["[sky] the heart keeps its own from dimming", g => { g.slots[0] = { id: 18, owner: "sky", l: 7, r: 7, age: 2 }; g.slots[1] = { id: 20, owner: "sky", l: 6, r: 6, age: 2 }; const s = lodge(g, g.slots, 103, 2, false, "you"); return s[1].r; }, 6],
  ["[sky] the void stands alone", g => { const s = lodge(g, g.slots, 24, 4, false, "sky"); return resolve({ ...g, slots: s }, s, 105, 5, false, "you").slots[4].owner; }, "sky"],
  ["[sky] the listener strikes what lands", g => { g.slots[0] = { id: 22, owner: "sky", l: 7, r: 4, age: 3 }; return resolve(g, g.slots, 21, 1, false, "you").slots[1].owner; }, "sky"],
  ["[sky] the chamber shields a landing", g => { g.slots[0] = { id: 26, owner: "sky", l: 7, r: 5, age: 3 }; const s = lodge(g, g.slots, 20, 1, false, "sky"); return resolve({ ...g, slots: s }, s, 101, 2, false, "you").slots[1].owner; }, "sky"],
  ["[sky] the blaze keeps its ground", g => { const s = lodge(g, g.slots, 5, 4, false, "sky"); s[4].owner = "you"; return slotW(g, s, 4, ctxOf(g, s)).who; }, "sky"],
  ["[sky] the return comes home once", g => { const s = lodge(g, g.slots, 7, 0, false, "sky"); const r = resolve({ ...g, slots: s }, s, 101, 1, false, "you"); return [r.slots[0], r.ret[0]].map(x => x === null ? "gone" : x).join("/"); }, "gone/7"],
  ["[sky] the glance dims their next", g => { g.glanceOn = "sky"; const s = lodge(g, g.slots, 101, 4, false, "you"); return faceOf({ ...g, slots: s }, s, 4, 1); }, 4],
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
