// manzil-engine.js — server-authoritative move engine for real-time PvP
// (starshard-api/lib/manzil-lobby.js). Ported + verified 30 aug 2026 against the LIVE
// "Star Shard v3 Build Plan/Manzil - Game Prototype V2.dc.html" (`_faceOf`/`_shielded`/`_tryFlip`/
// `_lodge`/`_resolve`/`_isHome`/`_slotW`/`_ctx`/`_counts`/`_boardWinner`/`_cards`/`_mlvl`/`_baseLvl`/
// `_builds`), NOT against `research/manzil-engine-current.cjs` (a V1 port whose own header flags it
// as unverified against V2 — this file supersedes it as "the one to use" for PvP specifically; the
// .cjs file stays the reference for offline sims, a different documented-scope artifact).
//
// PREVIOUS VERSION of this file mirrored "research/manzil-engine-v6.js" (22-25 aug era) — stale
// relative to both V2 and .cjs; replaced wholesale rather than patched.
//
// SCOPE, checked by hand against the live client rather than assumed:
//
// STATION LAWS (mansion 18 "beat", 25 "shell", 10 "reach") and every road-mode special ground
// (mansion 21/23/25/26/27/28's remedy/kiln/cross/rope/reson) are DELIBERATELY NOT PORTED. The
// client's own `_bossRule()` (line ~5952) returns null whenever `st.duel` is set, and every one of
// `_remedy`/`_kiln`/`_cross`/`_rope`/`_reson` returns -1 under the same `st.duel` guard — i.e. the
// LIVE GAME ITSELF exempts every duel mode (including the existing fake "net" AI duel and real
// pass-and-play "seat") from station laws and road-only grounds. A real networked PvP match is
// exactly another duel; porting station laws in would make PvP MORE road-like than any duel the
// live client has ever actually produced. If a future decision wants station laws in PvP, that's a
// new product call, not a parity fix — flag it rather than silently reintroducing here.
//
// DOMINION uses `_isHome`/`_boardM`'s real tonight-relative rotation (`boardM(i) = ((tonight-1+i)%28)+1`
// for i in 0..8), NOT a flat "slot i is mansion i+1" — this is a genuine, confirmed divergence from
// research/manzil-engine-current.cjs's `isHome`, which hardcodes slotIdx+1 with no tonight rotation
// at all. Without this fix, dominion would fire on the wrong stations for every night except the one
// where tonight happens to be mansion 1. The mansion-25 four-station road-window slide the client
// applies on ITS OWN night (`_boardM`'s `off:4` for m25) exists only to host the shell law, which
// duels don't get — so `off` is always 0 here, deliberately.
//
// MANE is inherently owner-relative already (`_faceOf`'s own mane check compares the mane-holder's
// side against the card being evaluated's side, not a hardcoded "you"), in both the client and this
// file — no `maneFair`-style neutralizing flag is needed here, unlike the file this replaces.
//
// LEVELS + THE THREE-DOOR BUILD SYSTEM (client `_cards()`, ~line 4966-4993, ground truth over any
// prose summary elsewhere in this repo that says levels no longer touch numbers — they still do):
// door 1 (lvl>=2) picks grant "g" or +2 to one face ("n"+aS); door 2 (lvl>=3) picks signature "s" or
// +1 to one face ("n"+bS); door 3 (lvl>=4) is always +1 to one face (bd.c). `cards(cfg)` takes both
// `cfg.levels` (per-id 1-4) and `cfg.builds` (per-id {a,b,c}) and reproduces this exactly — a real
// per-card model, not the all-or-nothing `cfg.grants` toggle the file this replaces used.
//
// AI/AUTOPLAY CODE IS NOT PORTED: real PvP moves come from real players via manzil-lobby.js's `place`
// event, never from a local move-picker — unlike research/manzil-engine-current.cjs (built partly
// for offline self-play sims), this file has no bestMove/pickMove/searchMove/playBoard/playMatch.
//
// TWO CARD TABLES, NOT ONE — a real architectural gap the file this replaces never had to face,
// because solo play is always a real player (real levels) against the fixed sky planets (a
// separate, non-colliding id space, 101-107). Real PvP is a real player against ANOTHER real
// player, both dealing from the SAME id space (1-28, "The Gate" is always id 1 for anyone) but at
// each player's OWN real levels/builds — so id 6 (the Storm) can be level 3 in your table and
// level 1 in your opponent's at the same time, and a single flat `g.C[id]` cannot represent both.
// `g.C` here is `{ you: cards(youCfg), sky: cards(skyCfg) }`; every lookup goes through `cardOf(g,
// slot)` (keyed off the slot's `by` — who ORIGINALLY lodged it, unchanged by later flips, since a
// card's definition belongs to whoever's collection it came from) or `cardById(g, id, side)` where
// no slot exists yet (a card about to be lodged). Passing a flat, single-seat `g.C` (as the self-
// checks below do, for brevity) still works — `cardOf`/`cardById` fall back to flat lookup when
// `g.C` has no `.you`/`.sky` keys, so a flat table means "both seats share one table," useful for
// isolated mechanic tests where per-seat asymmetry isn't what's being tested.
//
// Run self-checks: node starshard-api/lib/manzil-engine.js

"use strict";

const POOL = [
  ["The Gate", 6, 6, "gate"], ["The Bearer", 5, 6, "bearer"], ["The Gathered Stars", 7, 7, "gathered"],
  ["The Follower", 8, 7, "follower"], ["The Blaze", 6, 6, "blaze"], ["The Storm", 6, 8, "storm"],
  ["The Return", 7, 7, "return"], ["The Ghost", 7, 6, "ghost"], ["The Glance", 5, 6, "glance"],
  ["The Throne", 7, 9, "throne"], ["The Mane", 6, 6, "mane"], ["The Turning", 7, 6, "turning"],
  ["The Hand", 5, 7, "hand"], ["The Jewel", 9, 5, "jewel"], ["The Veil", 3, 8, "veil"],
  ["The Claws", 7, 6, "claws"], ["The Crown", 7, 6, "crown"], ["The Heart", 8, 7, "heart"],
  ["The Root", 7, 7, "root"], ["The Flock", 7, 6, "flock"], ["The Empty District", 3, 8, "district"],
  ["The Listener", 7, 5, "listener"], ["The Drum", 5, 7, "drum"], ["The Void", 9, 3, "void"],
  ["The Hideaway", 6, 6, "hideaway"], ["The Chamber", 7, 6, "chamber"], ["The Guide", 6, 6, "guide"],
  ["The Thread", 6, 6, "thread"],
]; // card sheet faces, matching the client's own `_cards()` `pool` array verbatim (27 aug 2026 sheet)

const QUAD_OF = {};
[["byakko", [1, 2, 3, 4, 5, 6, 28]], ["suzaku", [7, 8, 9, 10, 11, 12, 13]],
 ["seiryuu", [14, 15, 16, 17, 18, 19, 20]], ["genbu", [21, 22, 23, 24, 25, 26, 27]]]
  .forEach(([q, ids]) => ids.forEach(id => { QUAD_OF[id] = q; }));
function quadOf(id) { return QUAD_OF[id] || "byakko"; }

const BOARD_LEN = 9;

// cfg.levels: {id: 1-4}, default 1. cfg.builds: {id: {a: "g"|"n", aS: "l"|"r", b: "s"|"n", bS: "l"|"r", c: "l"|"r"}}
// — exact mirror of the client's `_cards()` door logic (verified against the live source, not the
// simpler "level>=2 wakes everything" model an earlier version of this file used).
function cards(cfg) {
  cfg = cfg || {};
  const levels = cfg.levels || {};
  const builds = cfg.builds || {};
  const C = {};
  POOL.forEach((p, idx) => {
    const id = idx + 1;
    const lvl = levels[id] != null ? levels[id] : 1;
    const bd = builds[id] || {};
    const q = quadOf(id);
    const sigOn = lvl >= 3 && bd.b === "s";
    const grantOn = lvl >= 2 && bd.a === "g";
    let dl = 0, dr = 0;
    if (lvl >= 2 && bd.a === "n" && bd.aS) { if (bd.aS === "r") dr += 2; else dl += 2; }
    if (lvl >= 3 && bd.b === "n" && bd.bS) { if (bd.bS === "r") dr += 1; else dl += 1; }
    if (lvl >= 4 && bd.c) { if (bd.c === "r") dr += 1; else dl += 1; }
    C[id] = {
      id, name: p[0], l: p[1] + dl, r: p[2] + dr, who: "you", lvl, loan: false,
      ab: sigOn ? p[3] : null, sig: p[3], quad: q, grantOn,
      homeM: id, // a player's own mansion cards' dominion ground is themselves, always
      twoFaced: grantOn && q === "seiryuu",
    };
  });
  return C;
}

function seededRand(seed) {
  let h = (seed >>> 0) || 1;
  return function rnd() {
    h ^= h << 13; h >>>= 0; h ^= h >>> 17; h >>>= 0; h ^= h << 5; h >>>= 0;
    return h / 4294967296;
  };
}

// pack: array of card ids to deal from (default: all 28). n: hand size (7, a real match's own hand).
// No walking-twelve "guarantee tonight's mansion" logic here — that's a single-player road
// convenience with no clear PvP-fair equivalent (see header); a plain seeded pick is the honest port.
function deal(pack, seed, n) {
  n = n || 7;
  const bag = (pack && pack.length ? pack : Array.from({ length: 28 }, (_, i) => i + 1)).slice();
  if (bag.length <= n) return bag;
  const rnd = seededRand(seed);
  const out = [];
  while (out.length < n && bag.length) out.push(bag.splice(Math.floor(rnd() * bag.length), 1)[0]);
  return out;
}

function mkGame(cfg) {
  cfg = cfg || {};
  let C = cfg.C;
  if (!C) C = (cfg.youConfig || cfg.skyConfig) ? { you: cards(cfg.youConfig || {}), sky: cards(cfg.skyConfig || {}) } : cards(cfg);
  const len = cfg.len || BOARD_LEN;
  return {
    C, len,
    slots: Array.from({ length: len }, () => null),
    you: (cfg.you || deal(null, cfg.seed || 1)).slice(),
    sky: (cfg.sky || deal(null, (cfg.seed || 1) + 1)).slice(),
    turn: cfg.leader || "you",
    leader: cfg.leader || "you",
    tieRule: cfg.tieRule || "a draw", // PvP default — matches the client's own duel-mode tieRule
    tonight: cfg.tonight || 1, // for dominion's boardM rotation only; no station laws read this here
  };
}

function nb(g, i, dir) { const k = i + dir; return k >= 0 && k < g.len ? k : -1; }
// mansion for board station i (0-based), rotated from tonight's real mansion — matches the client's
// `_boardM(i)` with `off` always 0 (the mansion-25 4-station slide only exists to host the shell
// law, which duels don't get here — see header).
function boardM(g, i) { return ((g.tonight - 1 + i) % 28) + 1; }
// a card's real definition — for an EXISTING slot, keyed by `by` (who lodged it, never changes with
// a later flip: the card's own level/build stays that side's, even once the other side holds it).
function cardOf(g, s) {
  if (!s) return null;
  const perSeat = g.C && (g.C.you || g.C.sky);
  return (perSeat ? g.C[s.by || s.owner] : g.C)[s.id];
}
// a card about to be lodged (no slot object yet) — `side` is the mover's own seat, always passed
// explicitly by manzil-lobby.js; "you" is a safe default only for tests that omit it.
function cardById(g, cardId, side) {
  const perSeat = g.C && (g.C.you || g.C.sky);
  return (perSeat ? g.C[side || "you"] : g.C)[cardId];
}
function isHome(g, s, slotIdx) { const c = cardOf(g, s); return (c.homeM || s.id) === boardM(g, slotIdx); }
function on(g, c) { return !!c && !!c.ab && c.lvl >= 2 && !c.loan; }

function faceOf(g, slots, i, dir) {
  const s = slots[i]; if (!s) return 0;
  let v = dir === 1 ? s.r : s.l, d = 0;
  if (s.boon) d += s.boon;
  if (s.blazed) d -= 2;
  const own = s.ground || s.owner;
  for (const dd of [-1, 1]) {
    const k = nb(g, i, dd); if (k < 0 || !slots[k]) continue;
    const n = cardOf(g, slots[k]); if (!on(g, n)) continue;
    if (n.ab === "thread") d -= 1;
    if (n.ab === "mane" && (slots[k].ground || slots[k].owner) === own) d += 1;
  }
  return Math.max(1, v + d);
}

function shielded(g, slots, ti) {
  const t = slots[ti]; if (!t) return true;
  const tC = cardOf(g, t);
  if (t.spent || t.crowned) return true;
  if (tC.grantOn && tC.quad === "byakko") return true; // the white tiger's grant: the ground holds
  if (tC.ab === "gathered" && on(g, tC)) {
    const own = t.ground || t.owner;
    for (const d of [-1, 1]) { const k = nb(g, ti, d); if (k >= 0 && slots[k] && (slots[k].ground || slots[k].owner) === own) return true; }
  }
  return false;
}

function tryFlip(g, slots, ai, ti, dir) {
  const a = slots[ai], t = slots[ti];
  if (!t || t.spent || t.owner === a.owner) return false;
  const tC = cardOf(g, t);
  let av = faceOf(g, slots, ai, dir), tv = faceOf(g, slots, ti, -dir);
  for (const d of [-1, 1]) {
    const k = nb(g, ti, d); if (k < 0 || k === ai || !slots[k]) continue;
    const n = cardOf(g, slots[k]); if (n.ab === "bearer" && on(g, n)) { av = Math.max(1, av - 2); break; }
  }
  const tie = av === tv && !(tC.ab === "storm" && on(g, tC));
  if (!(av > tv || tie)) return false;
  if (shielded(g, slots, ti)) return false;
  if (tC.ab === "gate" && on(g, tC) && !t.gateUsed) { t.gateUsed = true; return "gate"; }
  t.owner = a.owner;
  return tie ? "tie" : true;
}

function lodge(g, slotsIn, cardId, i, rev, side) {
  const own = side || "you", c = cardById(g, cardId, own), sigs = [];
  const slots = slotsIn.slice().map(x => x ? Object.assign({}, x, { age: (x.age || 0) + 1 }) : x);
  const first = !slotsIn.some(x => x && x.owner === own);
  slots[i] = { id: cardId, l: rev ? c.r : c.l, r: rev ? c.l : c.r, owner: own, by: own, age: 0, first };
  let at = i;
  if (on(g, c) && c.ab === "flock") {
    const ns = [-1, 1].map(d => nb(g, i, d)).filter(k => k >= 0 && k !== i && slots[k]);
    const k = ns.find(x => (slots[x].ground || slots[x].owner) !== own);
    const pick = k != null ? k : ns[0];
    if (pick != null) {
      const mine = Object.assign({}, slots[i]), theirs = Object.assign({}, slots[pick]);
      slots[pick] = Object.assign({}, mine, { age: 0 }); slots[i] = theirs;
      at = pick; sigs.push("the flock trades places.");
    }
  } else for (const d of [-1, 1]) {
    const k = nb(g, i, d); if (k < 0 || k === i || !slots[k]) continue;
    const n = cardOf(g, slots[k]);
    if (n.ab !== "claws" || !on(g, n) || (slots[k].ground || slots[k].owner) === own) continue;
    const away = i + (i > k ? 1 : -1);
    if (away < 0 || away >= slots.length || slots[away]) continue;
    slots[away] = Object.assign({}, slots[i], { age: 0 }); slots[i] = null; at = away;
    sigs.push("the claws shove it along one station."); break;
  }
  for (const d of [-1, 1]) {
    const k = nb(g, at, d); if (k < 0 || k === at || !slots[k]) continue;
    const n = cardOf(g, slots[k]); if (!on(g, n)) continue;
    if (n.ab === "hand" && (slots[k].ground || slots[k].owner) === own) {
      slots[at] = Object.assign({}, slots[at], { boon: (slots[at].boon || 0) + 1 });
      sigs.push("the hand raises what lands beside it.");
    }
    if (n.ab === "veil" && !slots[k].vused) {
      slots[k] = Object.assign({}, slots[k], { vused: true });
      slots[at] = Object.assign({}, slots[at], { l: slots[at].r, r: slots[at].l, turned: true });
      sigs.push("the veil turns the first card that lands beside it.");
    }
    if (n.ab === "jewel") {
      const hi = Math.max(slots[k].l, slots[k].r), lo = Math.min(slots[k].l, slots[k].r);
      const nl = d === 1 ? hi : lo, nr = d === 1 ? lo : hi;
      if (slots[k].l !== nl || slots[k].r !== nr) { slots[k] = Object.assign({}, slots[k], { l: nl, r: nr, turned: true }); sigs.push("the jewel turns its stronger face to meet it."); }
    }
  }
  if (on(g, c) && c.ab === "root") {
    let any = false;
    for (const d of [-1, 1]) { const k = nb(g, at, d); if (k < 0 || k === at || !slots[k]) continue; slots[k] = Object.assign({}, slots[k], { l: slots[k].r, r: slots[k].l, turned: true }); any = true; }
    if (any) sigs.push("the root turns both its neighbours.");
  }
  if (on(g, c) && c.ab === "blaze") {
    let best = -1, bv = -1;
    for (const d of [-1, 1]) {
      const k = nb(g, at, d); if (k < 0 || k === at || !slots[k]) continue;
      if ((slots[k].ground || slots[k].owner) === own) continue;
      const f = Math.max(slots[k].l, slots[k].r); if (f > bv) { bv = f; best = k; }
    }
    if (best >= 0) { slots[best] = Object.assign({}, slots[best], { blazed: true }); sigs.push("the blaze marks it two lower, for good."); }
  }
  const soft = [];
  if (c.ab === "venus") { // no live PvP card has ab "venus" (that's a sky-planet-only ability) — kept
    [-1, 1].forEach(d => { // for structural parity with the client's shared _lodge, harmless no-op here
      const t = nb(g, at, d); if (t < 0 || !slots[t]) return;
      const key = d === 1 ? "l" : "r";
      if (slots[t][key] > 1) { slots[t] = Object.assign({}, slots[t], { [key]: slots[t][key] - 1 }); soft.push(t); }
    });
  }
  if (soft.length) sigs.push("venus softens her neighbors.");
  return { slots, soft, sigs, at };
}

// resolve()'s seq entries carry `set`/`miss`/`sig`/`printed` alongside `owner`/`ret` — the client's
// own `_step()` animation reads all of these (turn-flags for veil/root, miss-flags for the gate/
// chamber/return, toast text, `printed` for the throne's reach fx). manzil-lobby.js's `move_confirmed`
// mapping must forward every one of these fields; dropping any silently breaks that signature's
// animation/state in a real PvP match without erroring.
function resolve(g, slotsIn, cardId, i, rev, side) {
  const lg = lodge(g, slotsIn, cardId, i, rev, side);
  const slots = lg.slots, soft = lg.soft, sigs = lg.sigs;
  if (lg.at != null) i = lg.at;
  const own = side || "you", me = cardById(g, cardId, own);
  const queue = [], seq = [];
  slots.forEach((x, xi) => {
    if (!x || !x.reArm || (x.ground || x.owner) !== own || (x.age || 0) < 1) return;
    slots[xi] = Object.assign({}, slots[xi], { reArm: false });
    seq.push({ from: xi, to: xi, dir: 1, miss: true, set: { reArm: false }, sig: "the return strikes again." });
    for (const d of [-1, 1]) { const k = nb(g, xi, d); if (k >= 0) queue.push({ from: xi, to: k, dir: d }); }
  });
  queue.push({ from: i, to: nb(g, i, -1), dir: -1 }, { from: i, to: nb(g, i, 1), dir: 1 });
  const opp = slots.length - 1 - i;
  if (on(g, me) && me.ab === "glance" && opp !== i) queue.push({ from: i, to: opp, dir: opp > i ? 1 : -1, sig: "the glance strikes across the road." });
  slots.forEach((x, xi) => {
    if (!x || xi === i) return;
    const xc = cardOf(g, x);
    if (xc.ab !== "glance" || !on(g, xc)) return;
    if (slots.length - 1 - xi !== i) return;
    queue.push({ from: xi, to: i, dir: i > xi ? 1 : -1, sig: "the glance was watching that ground." });
  });
  let heartFired = false;
  for (;;) {
    if (!queue.length) {
      if (heartFired || !slots.every(x => x)) break;
      heartFired = true;
      slots.forEach((x, xi) => {
        if (!x) return;
        const xc = cardOf(g, x);
        if (xc.ab !== "heart" || !on(g, xc)) return;
        for (const d of [-1, 1]) { const k = nb(g, xi, d); if (k >= 0) queue.push({ from: xi, to: k, dir: d, sig: "the heart strikes as the road fills." }); }
      });
      if (!queue.length) break;
    }
    const cur = queue.shift();
    const { from, to, dir } = cur;
    if (to < 0 || to >= slots.length || !slots[from] || !slots[to]) continue;
    const tgt = slots[to], tC = cardOf(g, tgt), tOwn = tgt.ground || tgt.owner;
    if (tC.ab === "chamber" && !tgt.struck) { slots[to] = Object.assign({}, slots[to], { struck: true }); seq.push({ from, to, dir, miss: true, set: { struck: true } }); }
    const res = tryFlip(g, slots, from, to, dir);
    if (res === "gate") { seq.push({ from, to, dir, miss: true, set: { gateUsed: true }, sig: "the gate turns the first strike aside." }); continue; }
    if (!res) continue;
    const fromC = cardOf(g, slots[from]) || {}, fromAb = fromC.ab;
    const set = {};
    if (on(g, fromC) && fromAb === "throne") set.boon = (slots[to].boon || 0) + 1;
    if (on(g, fromC) && fromAb === "crown") set.crowned = true;
    const hasSet = set.boon != null || set.crowned === true;
    if (hasSet) slots[to] = Object.assign({}, slots[to], set);
    seq.push({ from, to, dir, owner: slots[to].owner, sig: cur.sig, set: hasSet ? set : null });
    if (on(g, tC) && tC.ab === "ghost" && slots[from] && (slots[from].ground || slots[from].owner) !== tOwn) {
      slots[from] = Object.assign({}, slots[from], { owner: tOwn });
      seq.push({ from: to, to: from, dir: -dir, owner: tOwn, sig: "the ghost trades places with its taker." });
    }
    if (!slots[to].followed) for (const d of [-1, 1]) {
      const k = nb(g, to, d); if (k < 0 || k === from || !slots[k]) continue;
      const n = cardOf(g, slots[k]);
      if (n.ab === "follower" && on(g, n) && (slots[k].ground || slots[k].owner) === tOwn) {
        slots[to] = Object.assign({}, slots[to], { followed: true });
        queue.push({ from: k, to, dir: k > to ? -1 : 1, sig: "the follower answers for its neighbour." });
        break;
      }
    }
    if (fromAb === "mars") { const far = nb(g, to, dir); if (far >= 0) queue.push({ from: to, to: far, dir, sig: "mars carries the strike onward." }); }
    if (on(g, fromC) && fromAb === "turning") { const far = nb(g, to, dir); if (far >= 0) queue.push({ from: to, to: far, dir, sig: "the turning carries onward." }); }
    if (fromC.grantOn && fromC.quad === "suzaku") { const far = nb(g, to, dir); if (far >= 0) queue.push({ from: to, to: far, dir, sig: "the vermilion bird's strike carries two stations." }); }
  }
  if (on(g, me) && me.ab === "return" && slots[i] && !seq.some(x => x.from === i && !x.miss)) {
    slots[i] = Object.assign({}, slots[i], { reArm: true });
    seq.push({ from: i, to: i, dir: 1, miss: true, set: { reArm: true }, sig: "the return took nothing: it strikes again next turn." });
  }
  return { slots, seq, soft, sigs, at: i };
}

function slotW(g, slots, i, ctx) {
  const s = slots[i];
  if (!s) return { who: null, w: 0, silent: !!(ctx && ctx.sil && ctx.sil[i]) };
  const c = cardOf(g, s);
  if (c.grantOn && c.quad === "genbu" && s.by && s.by !== s.owner) return { who: null, w: 0, shell: true }; // the black tortoise's grant
  if (ctx && ctx.sil && ctx.sil[i]) return { who: null, w: 0, silent: true };
  if (s.spent) return { who: null, w: 0, silent: true };
  const home = isHome(g, s, i);
  let j = 0;
  if (c.ab === "jupiter") j = 1; // jupiterMode "always" — the locked default, the only mode that ever ships
  let w = 1 + j + (home ? 1 : 0);
  if (ctx && ctx.guide && ctx.guide[s.ground || s.owner] && home) w += 1;
  if (on(g, c)) {
    if (c.ab === "district") w += 1;
    if (c.ab === "void") w += 1;
    if (c.ab === "listener") for (const d of [-1, 1]) { const k = nb(g, i, d); if (k >= 0 && k !== i && slots[k]) w += 1; }
    if (c.ab === "hideaway") w = 0;
    if (c.ab === "chamber" && !(s.by && s.by !== s.owner)) w = (!s.struck && slots.every(x => x)) ? 4 : 2;
  }
  for (const d of [-1, 1]) {
    const k = nb(g, i, d); if (k < 0 || k === i || !slots[k]) continue;
    const n = cardOf(g, slots[k]); if (!on(g, n)) continue;
    if (n.ab === "hideaway") w += 1;
    if (n.ab === "void" && d === -1) w = Math.max(0, w - 1);
  }
  let who = s.ground || s.owner;
  const dl = nb(g, i, -1);
  if (dl >= 0 && dl !== i && slots[dl]) { const n = cardOf(g, slots[dl]); if (n.ab === "drum" && on(g, n)) who = slots[dl].ground || slots[dl].owner; }
  return { who, w };
}

function ctxOf(g, slots) {
  const sil = {}, guide = {};
  slots.forEach((s, i) => {
    if (!s) return;
    const c = cardOf(g, s); if (!on(g, c)) return;
    const own = s.ground || s.owner;
    if (c.ab === "district") for (const d of [-1, 1]) { const k = nb(g, i, d); if (k >= 0 && k !== i && slots[k] && (slots[k].ground || slots[k].owner) !== own) sil[k] = true; }
    if (c.ab === "guide") guide[own] = true;
  });
  return { sil, guide };
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
  const tr = g.tieRule || "a draw";
  if (tr === "a draw") return "draw";
  // "the defender": a level board goes to whichever side did NOT lead it. Ported 3 sep 2026 from
  // research/manzil-engine-current.cjs, which has had it since 28 aug — this file did not, and the
  // gap was not harmless. Design's note asked for "a one-word change to tieRule"; setting the
  // string alone against the OLD body would have fallen through the final `return "you"` and
  // handed every drawn board to seat "you" regardless of who led, which is worse than the draw it
  // replaced and would have looked like a rule rather than a bug. g.leader is who opened THIS
  // board (mkGame's cfg.leader), not a running match record.
  if (tr === "the defender") return g.leader === "you" ? "sky" : "you";
  if (tr === "tonight's holder") return slots[0] ? slots[0].owner : "sky";
  if (tr === "the sky") return "sky";
  return "you";
}

const API = { cards, deal, mkGame, faceOf, shielded, tryFlip, lodge, resolve, isHome, boardM, cardOf, cardById, slotW, ctxOf, counts, boardWinner, on, nb, POOL, QUAD_OF };
if (typeof module !== "undefined") module.exports = API;

// ---- self-checks: node starshard-api/lib/manzil-engine.js -----------------------------------
if (require.main === module) {
  const checks = [];
  const ok = (name, cond) => checks.push([name, !!cond]);

  // 1. a plain flip: 8 beats 6, higher takes it
  {
    const g = mkGame({ tonight: 1 });
    g.slots[0] = { id: 6, l: 6, r: 8, owner: "you", by: "you", age: 1 }; // storm, right face 8
    g.slots[1] = { id: 9, l: 5, r: 6, owner: "sky", by: "sky", age: 0 }; // glance, left face 5
    const r = tryFlip(g, g.slots, 0, 1, 1);
    ok("plain flip: 8 beats 5", r === true && g.slots[1].owner === "you");
  }
  // 2. a tie flips to the attacker (base rule)
  {
    const g = mkGame({ tonight: 1 });
    g.slots[0] = { id: 2, l: 6, r: 5, owner: "you", by: "you", age: 1 };
    g.slots[1] = { id: 4, l: 5, r: 7, owner: "sky", by: "sky", age: 0 };
    const r = tryFlip(g, g.slots, 0, 1, 1);
    ok("a tie flips to the attacker", r === "tie" && g.slots[1].owner === "you");
  }
  // 3. the storm cannot be tied
  {
    const g = mkGame({ tonight: 1, levels: { 6: 3 }, builds: { 6: { a: "g", b: "s" } } });
    const C = cards({ levels: { 6: 3 }, builds: { 6: { a: "g", b: "s" } } });
    g.C = C;
    g.slots[0] = { id: 2, l: 6, r: 5, owner: "you", by: "you", age: 1 };
    g.slots[1] = { id: 6, l: 5, r: 8, owner: "sky", by: "sky", age: 0 };
    const r = tryFlip(g, g.slots, 0, 1, 1);
    ok("the storm cannot be tied", r === false);
  }
  // 4. the gate turns the first strike aside, then stands open (build picks numbers at door 1 so
  // byakko's OWN grant — the gate happens to sit in byakko's quadrant — doesn't also shield it;
  // this isolates the gate's own ability from the quadrant grant it would otherwise also carry)
  {
    const g = mkGame({ tonight: 1 });
    g.C = cards({ levels: { 1: 3 }, builds: { 1: { a: "n", aS: "l", b: "s" } } });
    ok("the gate's own build carries no grant here (isolating its ability)", g.C[1].grantOn === false && g.C[1].ab === "gate");
    g.slots[0] = { id: 2, l: 9, r: 9, owner: "you", by: "you", age: 1 };
    g.slots[1] = { id: 1, l: 6, r: 6, owner: "sky", by: "sky", age: 0 };
    const r1 = tryFlip(g, g.slots, 0, 1, 1);
    ok("the gate turns the first strike aside", r1 === "gate" && g.slots[1].owner === "sky");
    const r2 = tryFlip(g, g.slots, 0, 1, 1);
    ok("the gate stands open after", r2 === true && g.slots[1].owner === "you");
  }
  // 5. dominion: a card on its own mansion, rotated by tonight, counts double
  {
    const g = mkGame({ tonight: 10 }); // station 0 == mansion 10 tonight
    g.C = cards({ levels: { 10: 3 }, builds: { 10: { a: "g", b: "s" } } });
    g.slots[0] = { id: 10, l: 7, r: 9, owner: "you", by: "you", age: 0 };
    const [you, sky] = counts(g, g.slots);
    ok("dominion doubles a card on its own (tonight-rotated) mansion", you === 2 && sky === 0);
  }
  {
    const g = mkGame({ tonight: 1 }); // station 0 == mansion 1 tonight, NOT the throne's home (10)
    g.C = cards({ levels: { 10: 3 }, builds: { 10: { a: "g", b: "s" } } });
    g.slots[0] = { id: 10, l: 7, r: 9, owner: "you", by: "you", age: 0 };
    const [you] = counts(g, g.slots);
    ok("dominion does NOT fire off tonight's rotation (regression check for the boardM fix)", you === 1);
  }
  // 6. jupiter counts two, always
  {
    const g = mkGame({ tonight: 1 });
    g.C = cards({});
    g.C[999] = { id: 999, name: "Jupiter", l: 7, r: 8, who: "sky", ab: "jupiter", homeM: 0 };
    g.slots[0] = { id: 999, l: 7, r: 8, owner: "you", by: "you", age: 0 };
    const [you] = counts(g, g.slots);
    ok("jupiter counts two", you === 2);
  }
  // 7. the black tortoise's grant: an empty shell once taken
  {
    const g = mkGame({ tonight: 1 });
    g.C = cards({ levels: { 21: 2 }, builds: { 21: { a: "g" } } }); // district is genbu-quadrant
    g.slots[0] = { id: 21, l: 3, r: 8, owner: "you", by: "you", age: 0 }; // by === owner: not yet taken
    let r = slotW(g, g.slots, 0, ctxOf(g, g.slots));
    ok("an untaken genbu-grant card counts normally (not yet a shell)", r.who === "you" && r.w > 0);
    g.slots[0] = { id: 21, l: 3, r: 8, owner: "sky", by: "you", age: 0 }; // taken: by !== owner
    r = slotW(g, g.slots, 0, ctxOf(g, g.slots));
    ok("the black tortoise's grant: taken counts for nobody", r.who === null && r.shell === true);
  }
  // 8. mane is owner-relative (symmetric), not hardcoded to "you"
  {
    const g = mkGame({ tonight: 1 });
    g.C = cards({ levels: { 11: 3 }, builds: { 11: { a: "g", b: "s" } } });
    g.slots[0] = { id: 11, l: 6, r: 6, owner: "sky", by: "sky", age: 1 }; // the mane, sky's
    g.slots[1] = { id: 2, l: 5, r: 5, owner: "sky", by: "sky", age: 0 }; // sky's own neighbour
    const fv = faceOf(g, g.slots, 1, 1);
    ok("the mane lifts its OWN side's neighbour (sky, here), not just \"you\"", fv === 6);
  }
  // 9. the throne raises what it takes, for good
  {
    const g = mkGame({ tonight: 1 });
    g.C = cards({ levels: { 10: 3 }, builds: { 10: { a: "g", b: "s" } } });
    g.slots[0] = { id: 10, l: 7, r: 9, owner: "you", by: "you", age: 1 };
    g.slots[1] = { id: 9, l: 5, r: 6, owner: "sky", by: "sky", age: 0 };
    const rr = resolve(g, g.slots, 10, 0, false, "you");
    ok("the throne raises what it takes", rr.slots[1].boon === 1 && rr.slots[1].owner === "you");
  }
  // 10. the heart strikes both neighbours "at the fill" — distinct from its own initial lodge
  // strike, which only ever attacks slots that are ALREADY occupied when it lodges. Lodge the
  // heart with both neighbours still empty (no initial attempt at all, nothing to fail), fill
  // them in later with weak cards, then confirm the heart gets a fresh attempt at both when a
  // final move fills the road.
  {
    const g = mkGame({ tonight: 1, len: 3 });
    g.C = cards({ levels: { 18: 3 }, builds: { 18: { a: "g", b: "s" } } }); // heart: l8 r7
    const r1 = resolve(g, g.slots, 18, 1, false, "you"); // lodges alone in the middle, both sides empty
    ok("the heart's initial lodge has no neighbours to strike yet", r1.seq.length === 0 && r1.slots[0] === null && r1.slots[2] === null);
    let s2 = r1.slots.slice();
    s2[0] = { id: 5, l: 1, r: 1, owner: "sky", by: "sky", age: 0 }; // a weak card fills in beside it later
    const r2 = resolve(g, s2, 15, 2, false, "sky"); // the veil (printed l3) — too weak to claim the heart (r7) on its own lodge strike
    const heartHits = r2.seq.filter(x => x.sig === "the heart strikes as the road fills.");
    ok("the heart gets a fresh strike at both neighbours when the road fills", heartHits.length === 2 && r2.slots[0].owner === "you" && r2.slots[2].owner === "you");
  }
  // 11. the return re-arms and strikes again on the OWNER's next lodge (not any lodge)
  {
    const g = mkGame({ tonight: 1, len: 5 });
    g.C = cards({ levels: { 7: 3 }, builds: { 7: { a: "g", b: "s" } } });
    const r1 = resolve(g, g.slots, 7, 2, false, "you"); // nothing beside it: took nothing
    ok("the return arms itself when it takes nothing", r1.slots[2].reArm === true);
    let slots2 = r1.slots.slice();
    slots2[0] = { id: 5, l: 1, r: 1, owner: "sky", by: "sky", age: 0 }; // not adjacent — sky's move, ages the return to 1
    const rSky = resolve(g, slots2, 5, 0, false, "sky");
    ok("a different side's lodge does not trigger the return's re-arm", rSky.slots[2].reArm === true);
    let slots3 = rSky.slots.slice();
    slots3[1] = { id: 4, l: 1, r: 1, owner: "sky", by: "sky", age: 0 }; // a weak card beside the armed return
    const r3 = resolve(g, slots3, 12, 4, false, "you"); // YOUR next lodge — the return's own side — fires it
    ok("the return strikes again on the owner's next turn and claims the low card", r3.slots[1].owner === "you" && r3.slots[2].reArm === false);
  }
  // 12. door-based levels: grant off without the "g" pick even at high level
  {
    const C = cards({ levels: { 1: 4 }, builds: { 1: { a: "n", aS: "l", b: "n", bS: "r", c: "l" } } });
    ok("level 4 with numbers picked at every door: no grant, no signature", C[1].grantOn === false && C[1].ab === null);
    ok("door bonuses land on the picked faces", C[1].l === 6 + 2 + 1 && C[1].r === 6 + 1);
  }
  // 13. door-based levels: grant AND signature both on when both doors picked
  {
    const C = cards({ levels: { 18: 4 }, builds: { 18: { a: "g", b: "s", c: "r" } } });
    ok("grant + signature both wake on their own doors", C[18].grantOn === true && C[18].ab === "heart");
  }
  // 14. the two-seat card table — the same id (the storm, 6) at different real levels for each
  // player at once, the exact collision a single flat table cannot represent.
  {
    const g = mkGame({
      tonight: 1,
      C: {
        you: cards({ levels: { 6: 3 }, builds: { 6: { a: "g", b: "s" } } }), // storm awake
        sky: cards({ levels: { 6: 1 }, builds: {} }), // sky's own storm, still asleep
      },
    });
    g.slots[0] = { id: 6, l: 6, r: 8, owner: "you", by: "you", age: 1 }; // your storm: awake, can't be tied
    g.slots[1] = { id: 6, l: 6, r: 8, owner: "sky", by: "sky", age: 1 }; // sky's own storm: asleep
    ok("your storm (by:you) reads your real level", cardOf(g, g.slots[0]).ab === "storm" && cardOf(g, g.slots[0]).lvl === 3);
    ok("sky's storm (by:sky) reads THEIR real level, same card id", cardOf(g, g.slots[1]).ab === null && cardOf(g, g.slots[1]).lvl === 1);
    const g2 = mkGame({ tonight: 1, C: g.C });
    g2.slots[0] = { id: 2, l: 5, r: 5, owner: "sky", by: "sky", age: 1 };
    g2.slots[1] = { id: 6, l: 5, r: 8, owner: "you", by: "you", age: 0 }; // your awake storm, defending
    const r = tryFlip(g2, g2.slots, 0, 1, 1); // 5 vs 5 would tie anywhere else — your storm can't be tied
    ok("a tie against your awake storm still doesn't take it", r === false);
  }

  const fails = checks.filter(([, c]) => !c);
  checks.forEach(([name, c]) => console.log((c ? "✓" : "✗") + " " + name));
  console.log(fails.length ? ("\n" + fails.length + " FAILED") : ("\nall " + checks.length + " passed"));
  process.exitCode = fails.length ? 1 : 0;
}
