// manzil-engine-current.cjs — extracted 28 aug 2026 from
// "Star Shard v3 Build Plan/Manzil - Game Prototype V1.dc.html" (the currently-deployed/canon
// Manzil file per the repo's CLAUDE.md canon flip, 27 aug 2026 rewrite).
//
// WHY THIS FILE EXISTS: V1's real engine lives INLINE in that .dc.html's <script type="text/x-dc">
// block, as ~178 `_`-prefixed methods on the page's React component, reading `this.state`/
// `this.props` directly. The dc-runtime forbids top-level `import` in that script block (see the
// repo CLAUDE.md's Runtime constraints), so the live page cannot require() a shared module — its
// inline copy is not optional. This file is a MANUAL, point-in-time PORT of that inline logic into
// a plain, `require()`-able CommonJS module, for anything that wants to simulate Manzil outside the
// browser (an external ML platform, a script, a test). It is NOT live-synced: if Manzil's rules
// change in the .dc.html again, this file goes stale until someone re-ports it by hand. Diff this
// file's card table / resolve logic against the .dc.html before trusting a long-running sim.
//
// THIS IS THE ONE TO USE. Every other Manzil "engine" file in this repo is either stale (superseded
// by the 27 aug rewrite) or serves a different, disconnected purpose:
//   - starshard-api/lib/manzil-engine.js + manzil-lobby.js: real, deployed server-side infra for a
//     Socket.io PvP lobby. Not stale exactly, but ORPHANED — V1's .dc.html has no PvP/socket wiring
//     at all, so nothing currently connects this pair to what players actually play. Its tieRule
//     defaults to "you" (pre-27-aug), not "a draw". Do not use it as "the current engine."
//   - Every other research/*.js engine snapshot (v6, v7-tiebreak, v2, ref-*, tapvec, etc.) predates
//     the 27 aug rewrite and has been deleted from this repo for that reason, 28 aug 2026 — they
//     were the exact stale files an external ML platform was found defaulting to, which is what
//     prompted this extraction. Only "Star Shard v3 Build Plan/research/manzil-engine-v6.js" was
//     ever committed to git (recoverable from history); the rest were untracked local scratch files
//     and are gone for good — which is fine, this file supersedes all of them.
//
// SCOPE — deliberate simplifications from the full .dc.html, documented rather than silently guessed:
//   - This ports the BASE MATCH ruleset only: a plain 9-station match, her hand the seven classical
//     "planets" (Saturn/Mars/Venus/Mercury/Jupiter/Sun/Moon, ids 101-107), your hand seven cards
//     dealt from a 28-card pack. It does NOT port road-mode's per-mansion special grounds (the
//     hashed "remedy"/"kiln"/"cross"/"rope"/"reson" stations tied to mansions 21/23/25/26/27/28 -
//     _remedy/_kiln/_cross/_rope/_reson in the source), the walker-ladder AI-strength ramp, or the
//     road/duel/practice/ascent meta-state machine. Those are progression/UI layers on top of the
//     board mechanic, not the mechanic itself. The ONE exception, added 28 aug 2026: playMatch()
//     implements just the best-of-three-walker/best-of-five-mansion, loser-leads-next-board loop
//     the "draw to the defender" sim proposed — a minimal multi-board wrapper around playBoard(),
//     not a port of V1's actual road/ascent state machine (levels, ladder difficulty, per-mansion
//     progression are still out of scope; see MATCH_FORMATS for exactly what it does implement).
//   - It does NOT port the per-card "build" system (the two/three upgrade doors a player spends
//     currency on, which can add +1/+2 to a face instead of waking the signature). Numbers are the
//     card sheet's printed numbers, unmodified. A card's ability is simply "on" once its level is
//     >=2 (this collapses the source's two-gate sigOn+build/onGate check into one, which is a real
//     simplification: in the live game a player CAN choose numbers over a signature at door two).
//   - Quadrant grants (the four passive grants: byakko/suzaku/seiryuu/genbu) ARE ported (shielded
//     ground, strike-carries-two, two-faced, "empty shell" respectively) but gated by cfg.grants
//     ("none" default, or "all") rather than per-card build state, for the same reason.
//   - Dominion (a card counting double on its own mansion) uses the sky planets' FALLBACK positions
//     from the source (saturn 26, mars 14, venus 22, mercury 8, jupiter 2, sun/moon 0 = inactive) -
//     the values V1 itself falls back to when no live ephemeris is wired in. A real per-birth-chart
//     dominion set is a UI/save-data concern, not the engine's.
//   - Temper (her five planet "moods," a tie-break nudge) is ported (temperFeat) but OFF by default
//     (cfg.temper = null), matching the single most common in-game case: a regular night against a
//     walker has temper disabled in the source (`(st.road || st.nightWalker || st.duel) ? null : ...`).
//
// TIE RULE, updated 28 aug 2026 — this module now ships tieRule "the defender" as the default,
// NOT "a draw". Context: V1's live .dc.html locked flat "a draw" on 27 aug. An external sim
// (28 aug, methodology used a since-deleted stale engine copy) proposed "the defender" instead —
// a level board goes to whoever did NOT lead it, rather than to neither side — and was
// independently re-verified against THIS canonical engine before being adopted: single-board seat
// advantage (win rate leading minus win rate following) measured 20.0 points under a flat draw,
// 6.9 under "the defender", roughly a 3x cut, same direction and rough scale as the external
// numbers even though the exact magnitudes don't match (different methodology: single board here
// vs. their walker-best-of-three/mansion-best-of-five match structure). Card-vs-card ties (two
// faces meeting at the same value on a flip attempt, in tryFlip) are UNCHANGED — the attacker
// still takes it, as always; that's a different rule from a board-level tie and the sim confirmed
// it should stay that way. "a draw" is still a selectable tieRule for comparison, just not the
// default. THIS DEFAULT CHANGE IS NOT YET PORTED TO V1's LIVE .dc.html — that file still hardcodes
// "a draw" inline (see its own tieRule prop default, ~L5963) pending a Design handoff to carry the
// change into the live game. If a sim run through this file or a predecessor reports a different
// tie resolution than what's described here, it is reading a stale copy or an unported live page.
//
// EXTENSION: .cjs, not .js — the repo root's package.json sets "type": "module", so a plain .js
// file here would load as an ES module and module.exports/require() would throw. Keep this as
// .cjs (Node always treats that extension as CommonJS regardless of the nearest package.json).
// Run self-checks: node research/manzil-engine-current.cjs

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
]; // card sheet, research/mansions-table.json-derived faces as shipped 27 aug 2026 (docs/handoffs/CARDS-27AUG.md)

// mansion id -> quadrant (research/mansions-table.json's fy_god column; mansion 2 belongs to byakko by position)
const QUAD_OF = {};
[["byakko", [1, 2, 3, 4, 5, 6, 28]], ["suzaku", [7, 8, 9, 10, 11, 12, 13]],
 ["seiryuu", [14, 15, 16, 17, 18, 19, 20]], ["genbu", [21, 22, 23, 24, 25, 26, 27]]]
  .forEach(([q, ids]) => ids.forEach(id => { QUAD_OF[id] = q; }));

// { id: { nm: quadrant } } — same shape older research scripts read as `Q[id].nm`
const QUADRANT = {};
Object.keys(QUAD_OF).forEach(id => { QUADRANT[id] = { nm: QUAD_OF[id] }; });

// her fallback dominion (source: _cards()'s `else` branch when window.ManzilEphem is absent)
const PLANET_HOME_FALLBACK = { saturn: 26, mars: 14, venus: 22, mercury: 8, jupiter: 2, sun: 0 };

const DEFAULT_SKY_HAND = [101, 102, 103, 104, 105, 106, 107];
const BOARD_LEN = 9;

// A CARD WITH NO QUARTER HAS NO QUARTER (3 sep 2026, Measurement's general fix, adopted).
// This used to fall through to "byakko" for anything unmapped, which is a SILENT GRANT: her
// planets came back as tiger cards, and every law that reads a quarter then treated them as
// standing on tiger ground. That is the same failure twice already (the guide's door, then
// Uranus/Neptune slipping past a 101..107 range check). Returning null makes "no quarter" a
// value a caller has to handle rather than a default it cannot see. Every law that reads a
// quarter treats null as "not this one".
function quadOf(id) { return QUAD_OF[id] || null; }

// cfg.levels: {id: 1-4}, default 3 (signature awake) for player cards 1-28. cfg.grants: "none" | "all".
function cards(cfg) {
  cfg = cfg || {};
  const levels = cfg.levels || {};
  const grants = cfg.grants === "all";
  const C = {};
  POOL.forEach((p, idx) => {
    const id = idx + 1;
    const lvl = levels[id] != null ? levels[id] : 3;
    const q = quadOf(id);
    // grants require lvl>=2 (V1's own "the grant comes at the second door"), same gate as the
    // signature (ab). Fixed 28 aug 2026: this was previously ungated (grantOn = grants alone),
    // which meant a level-1 "numbers only" card silently carried a grant whenever cfg.grants was
    // "all" — dormant until the ladder started calling cards({grants:"all"}) for real, at which
    // point a fresh/mostly-level-1 collection got every card granted and swung wildly stronger
    // than intended (surfaced by manzil-acceptance-checks.cjs's check 5/7 blowing out to ~100%).
    const grantOn = grants && lvl >= 2; // simplification stands: still all-or-nothing ACROSS cards, not per-card build state
    C[id] = {
      id, name: p[0], l: p[1], r: p[2], who: "you", lvl, loan: false,
      ab: lvl >= 2 ? p[3] : null, sig: p[3], quad: q, grantOn,
      homeM: id, // your own mansion cards' dominion ground is themselves
      twoFaced: grantOn && q === "seiryuu",
    };
  });
  const PH = Object.assign({}, PLANET_HOME_FALLBACK, cfg.planetHomes || {});
  C[101] = { id: 101, name: "Saturn", l: 9, r: 5, who: "sky", ab: "saturn", homeM: PH.saturn };
  C[102] = { id: 102, name: "Mars", l: 8, r: 6, who: "sky", ab: "mars", homeM: PH.mars };
  C[103] = { id: 103, name: "Venus", l: 4, r: 7, who: "sky", ab: "venus", homeM: PH.venus };
  C[104] = { id: 104, name: "Mercury", l: 6, r: 5, who: "sky", ab: "mercury", homeM: PH.mercury, twoFaced: true };
  C[105] = { id: 105, name: "Jupiter", l: 7, r: 8, who: "sky", ab: "jupiter", homeM: PH.jupiter };
  C[106] = { id: 106, name: "Sun", l: 9, r: 6, who: "sky", ab: null, homeM: 0 };
  C[107] = { id: 107, name: "Moon", l: 6, r: 6, who: "sky", ab: null, homeM: 0 };
  return C;
}

// deterministic xorshift32, matching the source's _nightSeed/_deal/_seven hashing shape, but seeded
// explicitly rather than off the wall-clock date, so a sim run is reproducible.
function seededRand(seed) {
  let h = (seed >>> 0) || 1;
  return function rnd() {
    h ^= h << 13; h >>>= 0; h ^= h >>> 17; h >>>= 0; h ^= h << 5; h >>>= 0;
    return h / 4294967296;
  };
}

// pack: array of card ids to deal from (default: all 28). n: hand size (source deals 7 a board).
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
  const C = cfg.C || cards(cfg);
  const len = cfg.len || BOARD_LEN;
  return {
    C, len,
    slots: Array.from({ length: len }, () => null),
    you: (cfg.you || deal(null, cfg.seed || 1)).slice(),
    sky: (cfg.sky || DEFAULT_SKY_HAND).slice(),
    turn: cfg.leader || "you",
    leader: cfg.leader || "you",
    tieRule: cfg.tieRule || "the defender", // relocked 28 aug 2026: a level board goes to whoever didn't lead it (see header)
    replyWeight: cfg.replyWeight == null ? 10 : cfg.replyWeight, // 10 = the common "walker night" case
    temper: cfg.temper || null, // off by default: matches the common walker-night case in the source
    round: cfg.round || 1,
    roundWins: [],
    roadBoss: !!cfg.roadBoss, // is this specific board the mansion match, vs. a walker board tonight
    tonight: cfg.tonight || null, // which mansion's road this is — lawAt() and moveKey()'s tiebreak both key on this
  };
}

// PER-MANSION STATION LAWS (29-30 aug 2026, corrected heart's-law work order + the 30 aug
// WORKORDER-LAWS-AND-THRONE-30AUG.md/WORKORDER-THRONE-LAW-30AUG.md/THE-TENTS-LAW-SHIPPED-30AUG.md
// trio) — whole-night scope, NOT gated on roadBoss: each law is a property of tonight's road, so
// it fires on every battle played under it, walkers and the mansion match alike. `station` is the
// 0-based slot index the law lives on for that mansion's night (mostly the mansion's own ground,
// station 0 — the exception is mansion 25, see below).
//   - 18, "beat": once when the road fills, whoever holds station 0 strikes station 1 once more,
//     regardless of whether that side's own card carries an ability — see resolve()'s "when the
//     road fills" gate. No onward chain: that clause belonged to the rejected board-wide form
//     (allBeat in the design reference engine) and was ported in error on 28 Aug, corrected 29 Aug.
//   - 25, "shell": station 4 (NOT 0 — the client slides the whole nine-station road window on m25's
//     own night, `_boardM(i)=((t-1+i-4+28)%28)+1`, so her own ground stands mid-road; this engine
//     doesn't model that road-window slide at all, per the scope note atop this file, so `station:4`
//     is simply hardcoded as the law's home rather than derived). Whatever lodges there counts
//     normally; the moment it is ever taken (owner differs from whoever lodged it — reusing the
//     existing `by` field, same test the genbu grant's own "empty shell" already uses in slotW()
//     below), it counts for nobody, either side, for the rest of the board. The Genbu quadrant
//     grant, moved to a place.
//   - 10, "reach": station 0. Whatever lodges there ALSO strikes two stations away (crossing an
//     empty middle station), using its PRINTED pool faces at the far station — a pumped/boon'd/
//     blazed live face does not carry. Side-neutral. Ported to match the client's own documented
//     scope: fires at LODGE TIME ONLY (the initial strike-queue push below), not from a strike that
//     merely originates from station 0 by some other cause (a heart fill-strike, a follower answer,
//     a return re-arm) — the 30 Aug work order flags that gap explicitly and calls the reference
//     engine "the truth" if the acceptance vectors ever require the wider form, but wardvec.js's own
//     three reach vectors test the mechanic in isolation (direct strikes, not resolve()'s full
//     lodge/re-arm/chain machinery) and don't actually pin that timing question down either way, so
//     this port matches the client rather than guessing past what's tested.
// The one chain that can still occur on ANY of these is a winning card's OWN ability (mars/turning/
// suzaku's reach) firing as it normally would — that's card behavior inside the strike, not law
// behavior, and needs no special-casing. Structured as a map, per the work order's own template, so
// the other 25 mansions' station laws can land as entries here.
//   - 12, "turn" (31 aug measured, shipped 2 sep): station 0. Whatever LODGES there turns the next
//     station to face the other way — its l/r swap and stay swapped for the rest of the board,
//     applied BEFORE the strike queue so the turned faces are the ones that fight. A swap conserves
//     both faces exactly, which is why it moves no totals; the nine symmetric cards (the 6/6s and
//     7/7s) are provably immune, so the sweep finds nothing to turn. Not a strike: no comparison,
//     no take, no chain.
//   - 19, "plant" (2 sep, measurement's 1a', `plantOnTake`): station 4. A slot at the law station
//     that has ALREADY changed hands is untakeable for the rest of the board, both sides. The
//     conditional IS the law: the opening lodge never roots (a leader cannot plant by arriving
//     first, only by taking back). `by !== owner` is that test — the same one the shell law and the
//     genbu grant already use. The unconditional form (measurement's 1a, "any card here is safe")
//     FAILED (+20.2 fresh seat, spread +37.6) and must never ship; the client shipped it by
//     accident on 2 Sep, testing `t.by` alone, and was corrected the same day.
//   - 21, "hush": station 4. While the law station is FILLED, the station on either side of it
//     counts for nobody, both sides, until the board ends. A count-path law only: nothing about
//     striking or taking changes, and the hushed pair are silenced exactly the way the empty
//     district silences its neighbours (the same `sil` map in ctxOf).
//   - 23, "reson": station 4. A strike whose origin OR target is the law station carries one
//     further — from the victim, one extra hop, not recursive. Fires only on a strike that actually
//     took (it sits in the post-flip success block, beside mars/turning), same as the client.
//   - 26, "guest" (2 sep, measurement's `guestStrip`): station 0. Whatever lodges in the doorway is
//     a guest under this roof and loses its OWN quarter's grant while it stands there — whoever
//     played it. Strip only, never granted the other way (`guestBoth` widened the board and is
//     dead). The client's own conformance covers the byakko hold ALONE, by Design's explicit scope
//     note; this engine strips all four, per the same note's "the engine should strip all four
//     quadrant grants at that station": byakko's ground-hold (shielded), suzaku's two-station reach
//     (resolve's lodge-time push), genbu's empty shell (slotW), and seiryuu's either-way face (the
//     rev choice is refused at lodge). That is a KNOWN, deliberate client/engine divergence on the
//     other three, not drift — flag it if a `gueststrip.js` acceptance ever lands, since
//     research/gueststrip.js was named as the acceptance but did not ship with the 2 Sep delivery.
//   - 28, "rope": station 4. What lodges there hauls one enemy card beside it onto the rope: the
//     first neighbour (checked -1 then +1) owned by the other side changes hands outright. No
//     comparison, no faces, no deny rules — it is not a strike, so shielded() never runs.
//   - 27, "stranger" (2 sep 2026, measured on m27's own night: spread 46.0 -> 41.3, seat -2.7
//     fresh, 51 vectors green): station 4. A card whose quarter is NOT that station's GROUND
//     quarter counts one more, both sides; a card on its own quarter's ground counts as it always
//     did. This is the FIRST law that reads the ground it stands on rather than just the slot, and
//     that changes what this module has to model — see boardM() below. Three traps, all named in
//     Design's own work order and all carried here deliberately:
//       * Her seven planets (ids 101-107) are QUARTERLESS and take no bonus. quadOf() has a byakko
//         catch-all and never returns undefined, so a `if (q && ...)` guard is dead code and the
//         planets silently come back as tiger cards. The id range is the only honest test.
//       * `c.quad` must stay FIRST in the fallback: quadOf() is only valid for ids 1-27, so
//         quadOf(215) is "byakko" while C[215].quad is "seiryuu" — dropping the `c.quad ||` half
//         misclassifies the whole ladder mirror deck as tiger.
//       * The ground quarter is COMPUTED, never a table. Design nearly shipped this law at the
//         wrong station by reasoning about the geography from memory.
//   - 2, "toll" (3 sep 2026, measured the best-behaved law yet: spread 39.2 -> 31.1, the largest
//     narrowing any law has produced, seat -0.3 fresh, skill +0.0): station 4. A card standing on
//     the law station that CANNOT BE TAKEN AT ALL counts one less, both sides. Sheltered ground
//     pays for its shelter. Implemented as one predicate evaluated at count time, never a flag
//     written at lodge, and it reuses shielded() so the card the toll charges is by construction
//     the card tryFlip() refuses. shielded() is attacker-independent (its `ai` is never read), so
//     a count-time caller can pass anything; this one passes -1. The GATE is added explicitly on
//     top, because its first-miss lives in tryFlip() and is stateful (`gateUsed`) — a predicate
//     built from shielded() alone would silently under-charge by one of the four denials, and it
//     correctly stops paying once the gate is spent. Planets pay nothing: quarterless, unmeasured.
//   - 4, "crow" (3 sep 2026, narrows 16.7 — twice the toll's record): station 4. The card at the
//     law station counts one MORE, and the chargeable neighbour worth most counts one LESS. "the
//     crow takes the bright thing." Both sides, all night. Two things make this delicate and both
//     are ported deliberately: the neighbour comparison is made on PLAIN worth (a `noLaw` ctx flag,
//     so slotW cannot recurse into its own law), and the two clauses are ONE TRANSACTION — a point
//     MOVES from the richest neighbour to the perch, net zero. So the planet guard covers the whole
//     transaction, never one clause of it: exempting the +1 alone would DESTROY a point, which is
//     the rear spout's measured failure shape. A planet at the perch switches the law off entirely;
//     a planet beside it is never the one charged. Ties go to the neighbour NEARER THE DOOR (the
//     lower index), via a strict `>` in a left-then-right walk.
const LAW_AT = {
  2: { kind: "toll", station: 4 },
  4: { kind: "crow", station: 4 },
  10: { kind: "reach", station: 0 },
  12: { kind: "turn", station: 0 },
  18: { kind: "beat", station: 0 },
  19: { kind: "plant", station: 4 },
  21: { kind: "hush", station: 4 },
  23: { kind: "reson", station: 4 },
  25: { kind: "shell", station: 4 },
  26: { kind: "guest", station: 0 },
  27: { kind: "stranger", station: 4 },
  28: { kind: "rope", station: 4 },
};
function lawAt(m) { return LAW_AT[m] || null; }

// Which MANSION's ground a station stands on tonight — the client's own _boardOff/_boardM pair.
// This module still does not model the road window as a road concept (see the scope note at the
// top): the other laws hardcode their station index and are right to, because none of them reads
// the ground. The stranger's law (m27) does, so it needs the real mapping — and the mapping is
// exactly where that law can be got wrong. Design measured both forms: on m27's own DOOR-FIRST
// window (no offset: road 27, 28, 1...7) station 4 is mansion 3, byakko ground, and the law pays
// the three non-tiger quarters and NARROWS the board 46.0 -> 41.3. Slide m27 back four "for
// consistency" with the other station-4 laws and station 4 becomes m27 itself, tortoise ground,
// where the tiger is the stranger: byakko +14.7, spread 46.0 -> 59.6, WIDENS, fails. Same
// sentence, same index, inverted law. So: m27 takes no BOARD_OFF entry, deliberately, and the
// general rule is that a window slide is only free for a law that does not read its own ground.
// m2 slides; m4 deliberately does NOT — the crow was measured on the standard window (road m4...m12).
// Design's note added `4: 4` in one section and removed it in a later one the same day; the shipped
// client has 2 and not 4, which is what this mirrors. Checked against the file, not the prose.
const BOARD_OFF = { 2: 4, 19: 4, 21: 4, 23: 4, 25: 4, 28: 4 };
function boardM(g, i) {
  const t = g.tonight; if (!t) return null;
  const off = BOARD_OFF[t] || 0;
  return ((t - 1 + i - off + 28) % 28) + 1;
}

function nb(g, i, dir) { const k = i + dir; return k >= 0 && k < g.len ? k : -1; }
function legalSlot(g, slots, i) { return true; } // "contiguous" road shape was retired; the road is always open
// sky's fixed 7 planets always have a real .ab (or null for sun/moon, which have none to gate on
// anyway — every on()-gated check elsewhere is paired with a specific .ab match, so this was
// always behaviorally equivalent to "sky's ability is on iff it has one"). Spelled out explicitly,
// 28 aug 2026 pt.2, because the difficulty ladder's mirror deck (ladderOpponentCards, below) needs
// a level-1 opponent card's ability to actually be off — the old blanket "sky is always on" would
// have silently defeated the whole point of scaling an opponent down.
function on(g, c) { return c.who === "sky" ? !!c.ab : (c.lvl >= 2 && !c.loan); }

function faceOf(g, slots, i, dir) {
  const s = slots[i]; if (!s) return 0;
  const c = g.C[s.id];
  let v = dir === 1 ? s.r : s.l, d = 0;
  if (s.boon) d += s.boon;
  if (s.blazed) d -= 2;
  const own = s.ground || s.owner;
  for (const dd of [-1, 1]) {
    const k = nb(g, i, dd); if (k < 0 || !slots[k]) continue;
    const n = g.C[slots[k].id]; if (!on(g, n)) continue;
    if (n.ab === "thread") d -= 1;
    if (n.ab === "mane" && (slots[k].ground || slots[k].owner) === own) d += 1;
  }
  return Math.max(1, v + d);
}

function shielded(g, slots, ti) {
  const t = slots[ti]; if (!t) return true;
  const tC = g.C[t.id];
  const law = lawAt(g.tonight);
  // the chamber's law (mansion 26): a card standing in the doorway is a guest and loses its own
  // quarter's grant, so the tiger's ground-hold is off at exactly that station.
  const guestSt = !!(law && law.kind === "guest" && ti === law.station);
  if (t.spent || t.crowned) return true;
  if (!guestSt && tC.grantOn && tC.quad === "byakko") return true; // white tiger's grant: the ground holds
  if (tC.ab === "saturn") return true;
  // the root's law (mansion 19): what has already changed hands at the road's middle takes root.
  // `by !== owner` is the has-it-changed-hands test — `by` is set at lodge and never moves.
  if (law && law.kind === "plant" && ti === law.station && t.by && t.by !== t.owner) return true;
  if (tC.ab === "gathered" && on(g, tC)) {
    const own = t.ground || t.owner;
    for (const d of [-1, 1]) { const k = nb(g, ti, d); if (k >= 0 && slots[k] && (slots[k].ground || slots[k].owner) === own) return true; }
  }
  return false;
}

// The toll's predicate (mansion 2). "Cannot be taken at all" = shielded() PLUS the gate's stateful
// first miss, which lives in tryFlip() rather than shielded() in this module exactly as it does in
// the client — so neither side holds the gate in shielded(), and the two predicates agree. Adding
// the gate here rather than moving it into shielded() keeps the strike path untouched; if "cannot
// be taken" ever wants one definition, that is a shielded()/tryFlip() change and a bigger call.
// QUARTERLESS = any of her sky cards. Three laws (stranger, toll, crow) must exempt them, and the
// test is deliberately "id >= 101" rather than the client's "101..107".
//
// THE CLIENT'S RANGE IS TOO NARROW AND IT MATTERS (found 3 sep 2026, reported to Design). Her hand
// on the MANSION BOSS BOARD is `[101,102,103,104,105,108,109]` — Uranus (108) and Neptune (109) sit
// outside 101..107, so all four of the client's guards miss them, and quadOf()'s byakko catch-all
// then reports them as TIGER cards. That is precisely the failure Design caught and fixed for
// 101..107; these two were left behind. It bites only on the boss board, because every walker hand
// is 2xx mirror mansion cards — which is also why it is easy to miss in play.
//
// This module's own deck stops at 107, so the wider test changes nothing here today; it is written
// this way so a future port of the outer planets cannot silently reintroduce the bug.
function isQuarterless(id) { return id >= 101; }

function tollOn(g, slots, i) {
  const st = slots && slots[i]; if (!st) return false;
  if (isQuarterless(st.id)) return false; // her planets are quarterless and unmeasured
  const c = g.C[st.id];
  const gateHold = !!(c && c.ab === "gate" && on(g, c) && !st.gateUsed);
  return gateHold || shielded(g, slots, i); // shielded() never reads an attacker
}

// The crow's chargeable neighbour (mansion 4): the one worth most on PLAIN worth, planets never
// charged, ties to the lower index — a strict `>` in a left-then-right walk gives that for free.
function crowPays(g, slots, L, plainCtx) {
  let best = -1, bw = -Infinity;
  for (const k of [nb(g, L, -1), nb(g, L, 1)]) {
    if (k < 0 || !slots[k]) continue;
    if (isQuarterless(slots[k].id)) continue;
    const w = slotW(g, slots, k, plainCtx).w;
    if (w > bw) { bw = w; best = k; }
  }
  return best;
}

function tryFlip(g, slots, ai, ti, dir, printed) {
  const a = slots[ai], t = slots[ti];
  if (!t || t.spent || t.owner === a.owner) return false;
  const tC = g.C[t.id];
  let av = faceOf(g, slots, ai, dir), tv = faceOf(g, slots, ti, -dir);
  // the throne's law (mansion 10): the far strike reads the attacker's PRINTED pool face — the
  // card table's own l/r, not the slot's live (boon/blaze/neighbour-modified) face. Reads g.C, not
  // slots[ai], so it's unaffected by rev too, matching the client's own _tryFlip(..., printed).
  if (printed) { const aC = g.C[a.id]; av = dir === 1 ? aC.r : aC.l; }
  for (const d of [-1, 1]) {
    const k = nb(g, ti, d); if (k < 0 || k === ai || !slots[k]) continue;
    const n = g.C[slots[k].id]; if (n.ab === "bearer" && on(g, n)) { av = Math.max(1, av - 2); break; }
  }
  const tie = av === tv && !(tC.ab === "storm" && on(g, tC));
  if (!(av > tv || tie)) return false;
  if (shielded(g, slots, ti)) return false;
  if (tC.ab === "gate" && on(g, tC) && !t.gateUsed) { t.gateUsed = true; return "gate"; }
  t.owner = a.owner;
  return tie ? "tie" : true;
}

function lodge(g, slotsIn, cardId, i, rev, side) {
  const c = g.C[cardId], own = side || c.who, sigs = [];
  // the chamber's law (mansion 26) strips SEIRYUU's grant at the doorway: the either-way face is a
  // grant, so a guest cannot choose which way round it stands. Only the grant is refused — mercury
  // carries twoFaced as its own ability and keeps it, since the law takes quarters' grants, not
  // cards' signatures.
  {
    const law0 = lawAt(g.tonight);
    if (law0 && law0.kind === "guest" && i === law0.station && c.grantOn && c.quad === "seiryuu") rev = false;
  }
  const slots = slotsIn.slice().map(x => x ? Object.assign({}, x, { age: (x.age || 0) + 1 }) : x);
  const first = !slotsIn.some(x => x && x.owner === own);
  slots[i] = { id: cardId, l: rev ? c.r : c.l, r: rev ? c.l : c.r, owner: own, by: own, age: 0, first };
  let at = i;
  if (on(g, c) && c.ab === "flock") {
    const ns = [-1, 1].map(d => nb(g, i, d)).filter(k => k >= 0 && slots[k]);
    const k = ns.find(x => (slots[x].ground || slots[x].owner) !== own);
    const pick = k != null ? k : ns[0];
    if (pick != null) {
      const mine = Object.assign({}, slots[i]), theirs = Object.assign({}, slots[pick]);
      slots[pick] = Object.assign({}, mine, { age: 0 }); slots[i] = theirs;
      at = pick; sigs.push("the flock trades places.");
    }
  } else for (const d of [-1, 1]) {
    const k = nb(g, i, d); if (k < 0 || !slots[k]) continue;
    const n = g.C[slots[k].id];
    if (n.ab !== "claws" || !on(g, n) || (slots[k].ground || slots[k].owner) === own) continue;
    const away = i + (i > k ? 1 : -1);
    if (away < 0 || away >= slots.length || slots[away]) continue;
    slots[away] = Object.assign({}, slots[i], { age: 0 }); slots[i] = null; at = away;
    sigs.push("the claws shove it along one station."); break;
  }
  for (const d of [-1, 1]) {
    const k = nb(g, at, d); if (k < 0 || k === at || !slots[k]) continue;
    const n = g.C[slots[k].id]; if (!on(g, n)) continue;
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
  if (c.ab === "venus") {
    [-1, 1].forEach(d => {
      const t = nb(g, at, d); if (t < 0 || !slots[t]) return;
      const key = d === 1 ? "l" : "r";
      if (slots[t][key] > 1) { slots[t] = Object.assign({}, slots[t], { [key]: slots[t][key] - 1 }); soft.push(t); }
    });
  }
  if (soft.length) sigs.push("venus softens her neighbors.");
  return { slots, soft, sigs, at };
}

function resolve(g, slotsIn, cardId, i, rev, side) {
  const lg = lodge(g, slotsIn, cardId, i, rev, side);
  const slots = lg.slots, soft = lg.soft, sigs = lg.sigs;
  if (lg.at != null) i = lg.at;
  const own = side || g.C[cardId].who, me = g.C[cardId];
  const queue = [], seq = [];
  slots.forEach((x, xi) => {
    if (!x || !x.reArm || (x.ground || x.owner) !== own || (x.age || 0) < 1) return;
    slots[xi] = Object.assign({}, slots[xi], { reArm: false });
    seq.push({ from: xi, to: xi, dir: 1, miss: true, sig: "the return strikes again." });
    for (const d of [-1, 1]) { const k = nb(g, xi, d); if (k >= 0) queue.push({ from: xi, to: k, dir: d }); }
  });
  const law = lawAt(g.tonight);
  // the turning's law (mansion 12, station 0): whatever lodges at the door turns the NEXT station to
  // face the other way — l and r swap and stay swapped. Inserted BEFORE the near-strike push so the
  // turned faces are the ones that fight. A symmetric card (l === r) refuses: the sweep happens and
  // finds nothing, which is a real beat in the client and a no-op here.
  if (law && law.kind === "turn" && i === law.station) {
    const kt = nb(g, i, 1);
    if (kt >= 0 && slots[kt] && slots[kt].l !== slots[kt].r) {
      const n = slots[kt];
      slots[kt] = Object.assign({}, n, { l: n.r, r: n.l });
      seq.push({ from: i, to: kt, dir: 1, miss: true, turn: true, sig: "the turn: the next station faces the other way." });
    }
  }
  queue.push({ from: i, to: nb(g, i, -1), dir: -1 }, { from: i, to: nb(g, i, 1), dir: 1 });
  // the throne's law (mansion 10, station 0): lodging there also strikes two stations away, printed
  // faces, crossing an empty middle — see the LAW_AT comment above for the lodge-time-only scope.
  if (law && law.kind === "reach" && i === law.station) {
    [-1, 1].forEach(d => {
      const far = i + 2 * d;
      if (far >= 0 && far < slots.length) queue.push({ from: i, to: far, dir: d, printed: true, sig: "the throne's law: the strike carries to the far station, as printed." });
    });
  }
  // THE VERMILION BIRD'S GRANT, realigned 2 sep 2026 with the client's 31 aug staging-audit fix.
  // It used to sit in the post-flip success block below, so it struck FROM THE VICTIM's slot, only
  // after a near strike had already landed, and carried no `printed` flag — three faults from one
  // bug. It is a lodge-time strike from the granted card's own position with printed faces, in both
  // directions, exactly like the throne's law above. Stripped at a guest station (mansion 26).
  if (me.grantOn && me.quad === "suzaku" && !(law && law.kind === "guest" && i === law.station)) {
    [-1, 1].forEach(d => {
      const far = i + 2 * d;
      if (far >= 0 && far < slots.length) queue.push({ from: i, to: far, dir: d, printed: true, sig: "the vermilion bird's strike carries two stations, as printed." });
    });
  }
  // the well-rope (mansion 28, station 4): what lodges there hauls one enemy card beside it onto the
  // rope and it changes hands outright. Not a strike — no faces are compared, so no deny rule runs.
  if (law && law.kind === "rope" && i === law.station) {
    for (const d of [-1, 1]) {
      const k = nb(g, i, d);
      if (k >= 0 && slots[k] && slots[k].owner !== own) {
        slots[k] = Object.assign({}, slots[k], { owner: own });
        seq.push({ from: i, to: k, dir: d, owner: own, sig: "the rope hauls it in." });
        break;
      }
    }
  }
  const opp = slots.length - 1 - i;
  if (on(g, me) && me.ab === "glance" && opp !== i) queue.push({ from: i, to: opp, dir: opp > i ? 1 : -1, sig: "the glance strikes across the road." });
  slots.forEach((x, xi) => {
    if (!x || xi === i || g.C[x.id].ab !== "glance" || !on(g, g.C[x.id])) return;
    if (slots.length - 1 - xi !== i) return;
    queue.push({ from: xi, to: i, dir: i > xi ? 1 : -1, sig: "the glance was watching that ground." });
  });
  let heartFired = false;
  for (;;) {
    if (!queue.length) {
      if (heartFired || !slots.every(x => x)) break;
      heartFired = true;
      slots.forEach((x, xi) => {
        if (!x || g.C[x.id].ab !== "heart" || !on(g, g.C[x.id])) return;
        for (const d of [-1, 1]) { const k = nb(g, xi, d); if (k >= 0) queue.push({ from: xi, to: k, dir: d, sig: "the heart strikes as the road fills." }); }
      });
      if (law && law.kind === "beat") {
        queue.push({ from: law.station, to: law.station + 1, dir: 1, sig: "the heart beats once more, as the road fills." });
      }
      if (!queue.length) break;
    }
    const cur = queue.shift();
    const { from, to, dir } = cur;
    if (to < 0 || to >= slots.length || !slots[from] || !slots[to]) continue;
    const tgt = slots[to], tC = g.C[tgt.id], tOwn = tgt.ground || tgt.owner;
    if (tC.ab === "chamber" && !tgt.struck) { slots[to] = Object.assign({}, slots[to], { struck: true }); seq.push({ from, to, dir, miss: true }); }
    const res = tryFlip(g, slots, from, to, dir, cur.printed);
    if (res === "gate") { seq.push({ from, to, dir, miss: true, sig: "the gate turns the first strike aside." }); continue; }
    if (!res) continue;
    const fromC = g.C[slots[from].id] || {}, fromAb = fromC.ab;
    const set = {};
    if (on(g, fromC) && fromAb === "throne") set.boon = (slots[to].boon || 0) + 1;
    if (on(g, fromC) && fromAb === "crown") set.crowned = true;
    if (set.boon != null || set.crowned) slots[to] = Object.assign({}, slots[to], set);
    seq.push({ from, to, dir, owner: slots[to].owner, sig: cur.sig });
    if (on(g, tC) && tC.ab === "ghost" && slots[from] && (slots[from].ground || slots[from].owner) !== tOwn) {
      slots[from] = Object.assign({}, slots[from], { owner: tOwn });
      seq.push({ from: to, to: from, dir: -dir, owner: tOwn, sig: "the ghost trades places with its taker." });
    }
    if (!slots[to].followed) for (const d of [-1, 1]) {
      const k = nb(g, to, d); if (k < 0 || k === from || !slots[k]) continue;
      const n = g.C[slots[k].id];
      if (n.ab === "follower" && on(g, n) && (slots[k].ground || slots[k].owner) === tOwn) {
        slots[to] = Object.assign({}, slots[to], { followed: true });
        queue.push({ from: k, to, dir: k > to ? -1 : 1, sig: "the follower answers for its neighbour." });
        break;
      }
    }
    // the drum's law (mansion 23): a strike whose origin OR target is the resonant station carries
    // one further — from the victim, one extra hop, not recursive.
    if (law && law.kind === "reson" && (to === law.station || from === law.station)) {
      const far = nb(g, to, dir); if (far >= 0) queue.push({ from: to, to: far, dir, reson: true, sig: "the hour-drum rings: the beat carries onward." });
    }
    if (fromAb === "mars") { const far = nb(g, to, dir); if (far >= 0) queue.push({ from: to, to: far, dir, sig: "mars carries the strike onward." }); }
    if (on(g, fromC) && fromAb === "turning") { const far = nb(g, to, dir); if (far >= 0) queue.push({ from: to, to: far, dir, sig: "the turning carries onward." }); }
  }
  if (on(g, me) && me.ab === "return" && slots[i] && !seq.some(x => x.from === i && !x.miss)) {
    slots[i] = Object.assign({}, slots[i], { reArm: true });
    seq.push({ from: i, to: i, dir: 1, miss: true, sig: "the return took nothing: it strikes again next turn." });
  }
  return { slots, seq, soft, sigs, at: i };
}

function isHome(g, cardId, slotIdx) { return (g.C[cardId].homeM || cardId) === (slotIdx + 1); }

function slotW(g, slots, i, ctx) {
  const s = slots[i];
  if (!s) return { who: null, w: 0, silent: !!(ctx && ctx.sil && ctx.sil[i]) };
  const c0 = g.C[s.id];
  const law = lawAt(g.tonight);
  const guestSt = !!(law && law.kind === "guest" && i === law.station);
  // the chamber's law strips genbu's grant at the doorway the same way it strips the tiger's
  if (!guestSt && c0.grantOn && c0.quad === "genbu" && s.by && s.by !== s.owner) return { who: null, w: 0, shell: true }; // black tortoise's grant
  // the hideaway's law (mansion 25): the same "empty shell" test as the genbu grant above, just
  // keyed to the law's fixed station instead of a specific card's grant — see the LAW_AT comment.
  if (law && law.kind === "shell" && i === law.station && s.by && s.by !== s.owner) return { who: null, w: 0, shell: true };
  if (ctx && ctx.sil && ctx.sil[i]) return { who: null, w: 0, silent: true };
  if (s.spent) return { who: null, w: 0, silent: true };
  const c = g.C[s.id];
  const home = isHome(g, s.id, i);
  let j = 0;
  if (c.ab === "jupiter") j = 1; // jupiterMode "always" — the locked base-layer default
  let w = 1 + j + (home ? 1 : 0);
  // the toll (mansion 2): sheltered ground on the law station pays a point for its shelter.
  if (law && law.kind === "toll" && i === law.station && tollOn(g, slots, i)) w -= 1;
  // the crow (mansion 4): the perch counts one more and the richest chargeable neighbour one less,
  // as ONE transaction — hence the single planet guard on the perch rather than one per clause.
  if (law && law.kind === "crow" && !(ctx && ctx.noLaw)) {
    const L = law.station, plain = Object.assign({}, ctx || {}, { noLaw: true });
    const perch = slots[L];
    if (!(perch && isQuarterless(perch.id))) {
      if (i === L) w += 1;
      else if (i === crowPays(g, slots, L, plain)) w -= 1;
    }
  }
  // the stranger's law (mansion 27, station 4): a card whose quarter is not this ground's quarter
  // counts one more, both sides. Her planets are quarterless and take no bonus; `c.quad` leads the
  // fallback because quadOf() is only valid for ids 1-27. See the LAW_AT comment for all three.
  if (law && law.kind === "stranger" && i === law.station && !isQuarterless(s.id)) {
    const gm = boardM(g, i);
    const cq = c.quad || quadOf(s.id), gq = gm ? quadOf(gm) : null;
    // null on either side means "no quarter to compare", so the law simply does not apply —
    // never "different, therefore pay". A default quarter here is what caused the planet bug.
    if (cq && gq && cq !== gq) w += 1;
  }
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
    const n = g.C[slots[k].id]; if (!on(g, n)) continue;
    if (n.ab === "hideaway") w += 1;
    if (n.ab === "void" && d === -1) w = Math.max(0, w - 1);
  }
  let who = s.ground || s.owner;
  const dl = nb(g, i, -1);
  if (dl >= 0 && dl !== i && slots[dl]) { const n = g.C[slots[dl].id]; if (n.ab === "drum" && on(g, n)) who = slots[dl].ground || slots[dl].owner; }
  return { who, w };
}

function ctxOf(g, slots) {
  const sil = {}, guide = {};
  // the quiet middle (mansion 21): whatever lodges at the law station quiets the station on either
  // side of it, both sides, until the board ends. Folded into the district's own `sil` map so the
  // count path itself is unchanged — the hush is a silencing, not a new kind of nothing.
  const law = lawAt(g.tonight);
  if (law && law.kind === "hush" && slots[law.station]) {
    for (const k of [law.station - 1, law.station + 1]) if (k >= 0 && k < slots.length) sil[k] = true;
  }
  slots.forEach((s, i) => {
    if (!s) return;
    const c = g.C[s.id]; if (!on(g, c)) return;
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

// THE FACT THIS FILE EXISTS TO FIX: boardWinner()'s tie rule.
function boardWinner(g, slots) {
  const [you, sky] = counts(g, slots);
  if (you !== sky) return you > sky ? "you" : "sky";
  const tr = g.tieRule || "the defender"; // matches mkGame's default; only bites g objects built by hand
  if (tr === "a draw") return "draw";
  // "the defender": a level board goes to whichever side did NOT lead it — proposed 27 aug 2026
  // (external sim, re-verified against this canonical engine 28 aug 2026, see manzil-loop.md).
  // g.leader is who opened THIS board (mkGame's cfg.leader), not a running match record.
  if (tr === "the defender") return g.leader === "you" ? "sky" : "you";
  if (tr === "tonight's holder") return slots[0] ? slots[0].owner : "sky";
  if (tr === "the sky") return "sky";
  return "you";
}

// bestReply/pickMove take an explicit `side` rather than hardcoding "you"/"sky" literals — the
// same owner-relative-literal bug class the live game's duel mode was bitten by twice (see the
// repo CLAUDE.md's "Recently fixed" notes on _cards()/_heartAt/_commitHeart and the card-rewrite
// sweep). One code path for both sides means there's nothing to drift out of sync by hand.
function bestReply(g, slots, hand, side) {
  let best = null;
  hand.forEach(id => {
    const revOpts = g.C[id].twoFaced ? [false, true] : [false];
    slots.forEach((s, i) => {
      if (s || !legalSlot(g, slots, i)) return;
      revOpts.forEach(rev => {
        const s2 = resolve(g, slots, id, i, rev, side).slots;
        const [you, sky] = counts(g, s2);
        const score = side === "you" ? you - sky : sky - you;
        if (best === null || score > best) best = score;
      });
    });
  });
  return best;
}
function bestYouReply(g, slots, hand) { return bestReply(g, slots, hand, "you"); }
// her best reply, used inside youMove's own lookahead — the mirror bestYouReply already played
// inside skyMove. Neither existed before this file only had a "you" opponent to model against
// (the live game is always human-vs-sky); this is new for standalone self-play simulation.
function bestSkyReply(g, slots, hand) { return bestReply(g, slots, hand, "sky"); }

function diffFor(g, slots, side) {
  const [you, sky] = counts(g, slots);
  return side === "you" ? you - sky : sky - you;
}
function legalMoves(g, slots, hand) {
  const out = [];
  hand.forEach(id => {
    const revOpts = g.C[id].twoFaced ? [false, true] : [false];
    slots.forEach((s, i) => { if (!s) revOpts.forEach(rev => out.push({ id, i, rev })); });
  });
  return out;
}

// THE LADDER'S ACTUAL AI, verbatim per the report's correction (28 aug 2026 pt.4) — a one-ply
// weighted evaluator, not a tree search. `caution` is a MULTIPLIER on a single ply of lookahead
// (the opponent's single best reply, scored by resolve()+counts()), not a recursion depth: caution
// 0 plays purely greedy (grabs the best board this turn, ignores the reply entirely); caution 8
// weights that one reply eight times, so a high-caution mover declines a grab that hands the other
// side a bigger one back. This reads as caution, not calculation — and it's what every pt.3
// difficulty number was actually measured against. Cost: at most hand(7) x slots(9) x revs(2) x
// replyHand(7) x replySlots(9) resolve-and-count pairs (~8,000, falling as the road fills) — no
// recursion, no beam, no worker needed; see the header note above BEAM for why those were the
// wrong fix for a problem this function doesn't have.
//
// resolve()'s own end-of-board loop already fires the heart's last beat before returning when a
// move fills the board (verified by this file's own self-checks), so counts() on its output is
// already the report's "finalCounts" — no separate function needed here the way the report's
// reference engine required one.
function replyCost(g, slots, side, caution) {
  if (caution <= 0) return 0;
  const foe = side === "you" ? "sky" : "you";
  const foeHand = foe === "sky" ? (g.sky || []) : (g.you || []);
  let worst = null;
  foeHand.forEach(fid => {
    const revOpts = g.C[fid].twoFaced ? [false, true] : [false];
    slots.forEach((s, i) => {
      if (s) return;
      revOpts.forEach(rev => {
        const r2 = resolve(g, slots, fid, i, rev, foe);
        const [y2, k2] = counts(g, r2.slots);
        const v = side === "you" ? (k2 - y2) : (y2 - k2);
        if (worst === null || v > worst) worst = v;
      });
    });
  });
  return worst === null ? 0 : worst * caution;
}

// deterministic tie-break so equal-scoring candidates don't depend on hand/array iteration order —
// without this the opponent's behavior would silently depend on deal order and stop reproducing.
function moveKey(g, id, i) {
  let h = ((id * 73856093) ^ (i * 19349663) ^ ((g.tonight || 1) * 2654435761)) >>> 0;
  h ^= h << 13; h >>>= 0; h ^= h >>> 17; h >>>= 0; h ^= h << 5; h >>>= 0;
  return h >>> 0;
}

// every candidate goes through replyCost, including a move that would otherwise look free of any
// answer — scoring a move without one makes it look better than it is purely because nobody
// answered it (the report's own note: a real bug in an earlier pass that moved several cards).
function bestMove(g, slots, hand, side, caution) {
  let best = null;
  hand.forEach(id => {
    const revOpts = g.C[id].twoFaced ? [false, true] : [false];
    slots.forEach((s, i) => {
      if (s) return;
      revOpts.forEach(rev => {
        const r = resolve(g, slots, id, i, rev, side);
        const [y, k] = counts(g, r.slots);
        let score = (side === "you" ? (y - k) : (k - y)) * 10;
        score -= replyCost(g, r.slots, side, caution);
        const key = moveKey(g, id, i) ^ (rev ? 7919 : 0);
        if (best === null || score > best.score || (score === best.score && key > best.key)) best = { id, i, rev, score, r, key };
      });
    });
  });
  return best;
}

// CORRECTED 28 aug 2026 pt.4: "opponent thinking depth" is NOT a tree-search ply count. It's a
// MULTIPLIER on a single ply of lookahead — see bestMove()/replyCost() below, which is the actual
// evaluator every pt.3 difficulty number was measured against. "depth" was a naming mistake in
// every document including this file; the report's own correction renamed it `caution`
// (cautionsFor()/CAUTION_BANDS/playBoardWeighted()/playMatchWeighted(), below), and playPush() now
// uses that, not this search. searchMove()/playBoardSearch()/playMatchSearch() and BEAM are KEPT,
// not deleted — a real negamax search is plausibly a stronger and better-feeling opponent, but
// it's a genuinely different algorithm from the one-ply evaluator every number in this file was
// calibrated against, so it needs its own calibration pass before it ships anywhere (the report's
// suggestion: the mansion alone, as a deliberately slower, "obviously thinking" final boss). Do
// not wire this into playPush without re-measuring against it first.

// how many top candidates (by immediate 1-ply value, already sorted) get RECURSED into at each
// ply; the rest are still considered at the root/this ply using only their immediate value, never
// discarded outright, just not searched deeper. Exhaustive search (no beam) was measured
// intractable: one root-level depth-8 decision from an opening 9-slot board took ~88.5s with full
// branching (~7 hand cards x 9 slots) even with alpha-beta and move ordering — nowhere near fast
// enough for hundreds of simulated boards. BEAM=10 is a standard game-AI tradeoff (not a hack):
// it trades provable optimality for tractability, on the reasoning that a move already ranked
// outside the top 10 by immediate value is a poor bet to become the best move after more search.
// (That performance wall was real, but solving a problem the ladder doesn't actually have — see
// the correction above. BEAM stays relevant only if/when searchMove ever gets its own ship date.)
const BEAM = 10;

// genuine depth-limited game-tree search (negamax + alpha-beta + beam pruning), new 28 aug 2026
// pt.3, for the external sim's "opponent thinking depth" difficulty lever — a real, different
// mechanism from pickMove()'s fixed heuristic (a single best-reply term at a constant weight).
// `hands` carries BOTH sides' remaining cards ({you:[...], sky:[...]}), since a real search has to
// know what the opponent could do back, several plies deep, not just score one candidate reply.
// depth 0 = pure greedy: no lookahead at all, just the best immediate count differential after
// this move (matches the report's own "d0" column). depth N recurses N further plies, both sides
// maximizing their OWN differential — equivalent to a classic zero-sum negamax, since you-sky and
// sky-you are exact negations of each other for the same board, so no separate "minimize the
// opponent" bookkeeping is needed. Returns { move, value } — move is null only when `mover` has no
// legal move (empty hand or a full board).
function searchMove(g, slots, hands, mover, depth, alpha, beta) {
  alpha = alpha == null ? -Infinity : alpha;
  beta = beta == null ? Infinity : beta;
  if (slots.every(Boolean)) return { move: null, value: diffFor(g, slots, mover) };
  const opp = mover === "you" ? "sky" : "you";
  const hand = hands[mover];
  if (!hand.length) {
    if (!hands[opp].length) return { move: null, value: diffFor(g, slots, mover) };
    const sub = searchMove(g, slots, hands, opp, depth, -beta, -alpha);
    return { move: null, value: -sub.value };
  }
  const scored = legalMoves(g, slots, hand).map(m => {
    const rr = resolve(g, slots, m.id, m.i, m.rev, mover);
    return { m, rr, val0: diffFor(g, rr.slots, mover) };
  }).sort((a, b) => b.val0 - a.val0); // best immediate value first: for pruning AND the beam cutoff
  let best = null, bestVal = -Infinity;
  for (let idx = 0; idx < scored.length; idx++) {
    const cand = scored[idx];
    let value;
    if (depth <= 0 || idx >= BEAM || cand.rr.slots.every(Boolean)) {
      value = cand.val0; // beyond the beam width, or no lookahead requested: use the immediate value only
    } else {
      const nextHands = Object.assign({}, hands, { [mover]: hand.filter(id => id !== cand.m.id) });
      const sub = searchMove(g, cand.rr.slots, nextHands, opp, depth - 1, -beta, -Math.max(alpha, bestVal));
      value = -sub.value;
    }
    if (value > bestVal) { bestVal = value; best = { id: cand.m.id, i: cand.m.i, rev: cand.m.rev, r: cand.rr }; }
    if (bestVal > alpha) alpha = bestVal;
    if (alpha >= beta) break; // alpha-beta cutoff
  }
  return { move: best, value: bestVal };
}

// her five-planet "moods" — a tie-break feature above her greedy/2-ply eval. cfg.temper opts in.
function temperFeat(g, temper, id, i, preSlots, s2) {
  if (temper === "mars") {
    let press = 0;
    [-1, 1].forEach(d => { const k = nb(g, i, d); if (k >= 0 && preSlots[k] && preSlots[k].owner === "you") press += d === 1 ? preSlots[k].l : preSlots[k].r; });
    return press;
  }
  if (temper === "jupiter") return g.C[id].l + g.C[id].r;
  const adj = [nb(g, i, -1), nb(g, i, 1)].filter(k => k >= 0 && preSlots[k]).length;
  if (temper === "venus") return adj;
  if (temper === "mercury") return -adj;
  let exp = 0; // saturn: fewest of her lodged faces left open
  s2.forEach((c, k) => { if (!c || c.owner !== "sky") return; [-1, 1].forEach(d => { const q = nb(g, k, d); if (q >= 0 && !s2[q]) exp++; }); });
  return -exp;
}

// the shared mover core: greedy on the count plus a two-ply reply term, deterministic tiebreak on
// lowest (id,slot,rev). `side` picks whose move this is; the opponent hand/reply and the temper
// mood (her feature only — "you" is the human seat and never carries one) are derived from `side`
// rather than duplicated per-side, again to avoid a hand-copied "you"/"sky" drifting out of sync.
function pickMove(g, slots, hand, side) {
  const oppHand = side === "sky" ? (g.you || []) : (g.sky || []);
  const weight = side === "sky" ? (g.replyWeight == null ? 10 : g.replyWeight)
    : (g.youReplyWeight == null ? (g.replyWeight == null ? 10 : g.replyWeight) : g.youReplyWeight);
  const temper = side === "sky" ? g.temper : null;
  const moves = [];
  hand.forEach(id => {
    const revOpts = g.C[id].twoFaced ? [false, true] : [false]; // mercury already carries twoFaced:true in cards()
    slots.forEach((s, i) => {
      if (s || !legalSlot(g, slots, i)) return;
      revOpts.forEach(rev => {
        const rr = resolve(g, slots, id, i, rev, side);
        const s2 = rr.slots;
        const [you, sky] = counts(g, s2);
        const mine = side === "you" ? you : sky, theirs = side === "you" ? sky : you;
        let base;
        if (hand.length > 1 && !s2.every(x => x)) {
          const reply = bestReply(g, s2, oppHand, side === "you" ? "sky" : "you");
          base = (mine - theirs) * 10 - (reply === null ? 0 : reply) * weight;
        } else {
          base = (mine - theirs) * 10;
        }
        const f = temper ? temperFeat(g, temper, id, i, slots, s2) : 0;
        moves.push({ id, i, rev, base: base + (temper === "jupiter" ? 30 * f : 0), f, r: rr });
      });
    });
  });
  if (!moves.length) return null;
  const top = Math.max(...moves.map(m => m.base));
  let cands = moves.filter(m => m.base === top);
  if (temper && temper !== "jupiter" && cands.length > 1) {
    const fx = Math.max(...cands.map(m => m.f));
    cands = cands.filter(m => m.f === fx);
  }
  cands.sort((a, b) => a.id - b.id || a.i - b.i || (a.rev ? 1 : 0) - (b.rev ? 1 : 0));
  return cands[0];
}
function skyMove(g, slots, hand) { return pickMove(g, slots, hand, "sky"); }
// the careful player, same shape as skyMove so "skill" is one dial (g.youReplyWeight, default
// mirrors g.replyWeight) — new for standalone self-play; the live game never needed this because
// "you" is the human at the keyboard.
function youMove(g, slots, hand) { return pickMove(g, slots, hand, "you"); }

// a full automated match: alternates skyMove/youMove until the board fills or both hands empty.
// New for standalone self-play sims — the live .dc.html never runs a full match without a human
// in the loop, so nothing upstream needed this. guard caps a runaway loop at 80 plies (9 slots
// can never take more than 9 real placements, so this only fires if something is actually stuck).
function playBoard(cfg) {
  const g = mkGame(cfg);
  let flips = 0, guard = 0;
  while (g.slots.some(s => !s) && (g.you.length || g.sky.length) && guard++ < 80) {
    const side = g.turn;
    const hand = side === "you" ? g.you : g.sky;
    if (!hand.length) { g.turn = side === "you" ? "sky" : "you"; continue; }
    const mv = pickMove(g, g.slots, hand, side);
    if (!mv) { g.turn = side === "you" ? "sky" : "you"; continue; }
    flips += (mv.r.seq || []).filter(x => !x.miss).length;
    g.slots = mv.r.slots;
    g[side] = hand.filter(id => id !== mv.id);
    g.turn = side === "you" ? "sky" : "you";
  }
  return { winner: boardWinner(g, g.slots), flips, slots: g.slots, you: g.you, sky: g.sky };
}

const MATCH_FORMATS = { walker: { need: 2, maxBoards: 3 }, mansion: { need: 3, maxBoards: 5 } };

// a full match: repeated playBoard() calls, LOSER leads the next board, first to the majority
// wins the match. "walker" = best of three (first to 2). "mansion" = best of five (first to 3).
// New 28 aug 2026, alongside the "draw to the defender" tie rule — this IS the reason that rule
// matters: it's the corrective rebate paid on the level boards this loop otherwise produces a lot
// of. Each board deals "you" a fresh 7-card hand from cfg.pack (default: the full 28); "sky" is
// the fixed seven planets every board (cfg.sky, default DEFAULT_SKY_HAND) — the same "who plays
// what" split as a single playBoard(), just repeated. A literal "draw" board (only reachable under
// a non-default tieRule, e.g. "a draw" itself) has no loser to hand the lead to, so the same side
// leads again and neither score moves — this can't happen under the shipped default, where a
// level board always resolves to a real winner.
function playMatch(cfg) {
  cfg = cfg || {};
  const format = MATCH_FORMATS[cfg.format] ? cfg.format : "walker";
  const { need, maxBoards } = MATCH_FORMATS[format];
  const baseSeed = cfg.seed == null ? 1 : cfg.seed;
  let leader = cfg.leader || "you";
  let youWins = 0, skyWins = 0;
  const boards = [];
  for (let n = 0; n < maxBoards && youWins < need && skyWins < need; n++) {
    const you = (cfg.you || deal(cfg.pack || null, baseSeed + n * 97, 7)).slice();
    // cfg.skyPack (28 aug 2026 pt.2): deal sky a fresh hand each board too, from its own pool —
    // the difficulty ladder's mirror-deck opponent (see ladderOpponentCards) draws fresh like the
    // player does. Omitted, this is unchanged: sky plays the same fixed cfg.sky/DEFAULT_SKY_HAND
    // every board, exactly as before.
    const sky = cfg.skyPack ? deal(cfg.skyPack, baseSeed + n * 251, 7) : (cfg.sky || DEFAULT_SKY_HAND).slice();
    const boardCfg = Object.assign({}, cfg, { you, sky, leader, seed: baseSeed + n });
    const r = playBoard(boardCfg);
    boards.push({ winner: r.winner, leader, flips: r.flips });
    if (r.winner === "you") { youWins++; leader = "sky"; }       // loser leads next
    else if (r.winner === "sky") { skyWins++; leader = "you"; }
    // else: a literal draw — no loser, same leader carries forward, nobody's score moves.
  }
  const winner = youWins >= need ? "you" : skyWins >= need
    ? "sky" : youWins > skyWins ? "you" : skyWins > youWins ? "sky" : "draw"; // only the tie fallback can produce "draw" here
  return { winner, youWins, skyWins, boards, format, length: boards.length };
}

// ---- the difficulty ladder (28 aug 2026 pt.2) ------------------------------------------------
// The opponent is a scaled MIRROR of the player's own 28-card save, never a hardcoded progression
// (report §1). This is a genuinely different opponent shape from the base game's "sky plays her
// seven fixed planets" (still the default everywhere above) — the ladder's opponent instead plays
// a shadow of the SAME 28 mansion cards the player owns, at ids 200+i (matching the convention
// research/sig28all.js already used for a single-card isolation test), so it can sit in the same
// card table `C` alongside the player's own 1-28 without colliding.

// how many of the player's cards are awake (level >= 2) — the one number both the deck-scaling
// step and the depth lookup are keyed on.
function awakeCount(playerLevels) {
  return Object.values(playerLevels || {}).filter(lvl => lvl >= 2).length;
}

// SUPERSEDED 28 aug 2026 pt.3, same day: deck-weakening alone (playPush pt.2's ladderScale/
// stageScale/DEPTH_TABLE/ladderLevels, a scale-the-opponent's-deck-strength approach) does not
// scale — the external report itself reversed its own morning recommendation after finding that
// weakening the opponent's deck means something completely different at different collection
// depths (worth 1 point to a fresh player, 28 points to a deep one, since the cards being removed
// at the margin are grants/face-points rather than plain signatures), while THIS engine's own
// re-simulation of pt.2 independently found the same wall from the other direction: no
// deck-scale-only formula could reproduce the pt.2 report's own claimed 89-91.5% push-clear rate
// for deep collections. Both findings point the same way. Replaced by: the opponent's deck is
// ALWAYS a full mirror of the player's real levels, with only a shrinking HANDICAP (a fraction of
// the mirror's awake cards knocked down to level 1) and the opponent's SEARCH DEPTH doing the
// difficulty work — see handicapFor()/handicapLevels()/cautionsFor() and bestMove(), below.

// the report's handicap bands, by the player's awake count: the fraction of the player's OWN
// awake cards the opponent's mirror deck has knocked down to level 1 (weakest-first — see
// handicapLevels()). 0 at 22-28 awake is "none, a true mirror" (report's own words) — deliberately
// NOT tapered further at the very top; the report's whole point is that weakening a deep opponent
// past a true mirror barely moves its result while costing a fresh player almost nothing, so
// there's no value left to extract there.
const HANDICAP_BANDS = [[8, 0.75], [14, 0.5], [21, 0.25], [28, 0]]; // [maxAwakeInclusive, fractionKnockedDown]
function handicapFor(awake) {
  for (const [max, h] of HANDICAP_BANDS) if (awake <= max) return h;
  return HANDICAP_BANDS[HANDICAP_BANDS.length - 1][1];
}

// the report's opponent CAUTION bands (renamed from "depth" 28 aug 2026 pt.4 — see bestMove()'s
// header: this is a reply-cost multiplier, not a search-ply count), one value per road stage
// (walker 1-8, then the mansion), by the player's awake count. The numbers themselves are
// unchanged from pt.3's original table — only the name was wrong.
const CAUTION_BANDS = [
  [8, [0, 0, 0, 1, 1, 2, 2, 2, 2]],
  [14, [0, 0, 1, 1, 2, 2, 4, 4, 4]],
  [21, [0, 1, 1, 2, 2, 4, 4, 6, 6]],
  [28, [0, 1, 2, 2, 4, 4, 6, 8, 8]],
];
function cautionsFor(awake) {
  for (const [max, arr] of CAUTION_BANDS) if (awake <= max) return arr;
  return CAUTION_BANDS[CAUTION_BANDS.length - 1][1];
}

// the opponent's 28-card level map: a full mirror of the player's real levels, then the weakest
// `handicap` fraction of the player's own AWAKE cards (level >= 2) — not the full 28 — get knocked
// to level 1. Restricting the knockdown to the awake subset is a judgment call the report leaves
// implicit ("knock the handicap fraction of [the mirror's cards] to level 1, weakest first"):
// knocking an already-level-1 card to level 1 is a no-op, so reading "the mirror's cards" as "all
// 28 regardless of level" would barely touch a fresh player's already-mostly-level-1 opponent —
// the opposite of what a "handicap" should do. Reading it as "the awake subset" makes the fraction
// actually bite, and reproduces the report's own "22-28 awake: none, a true mirror" edge case
// exactly (handicap 0 -> nothing knocked down regardless of interpretation). Non-awake cards
// (already level 1) are left alone either way.
function handicapLevels(playerLevels, handicap) {
  const awakeIds = Object.keys(playerLevels).map(Number).filter(id => (playerLevels[id] || 1) >= 2);
  const drop = Math.round(handicap * awakeIds.length);
  const weakestFirst = awakeIds.slice().sort((a, b) => (playerLevels[a] || 1) - (playerLevels[b] || 1) || a - b);
  const dropSet = new Set(weakestFirst.slice(0, drop));
  const out = {};
  for (let id = 1; id <= 28; id++) out[id] = dropSet.has(id) ? 1 : (playerLevels[id] || 1);
  return out;
}

// merges a mirror 28-card opponent deck (ids 200+i) into a base card table built from the
// player's own real levels (baseC = cards({levels: playerLevels, grants: "all"})). Ability gating
// (lvl>=2) works correctly here because of the on() fix above. Grants WIRED 28 aug 2026 (report
// checklist item 6, closed): a shadow card carries the grant only if the base deck has grants
// enabled at all (baseC[i].grantOn — cards()'s own whole-table on/off simplification, not a
// per-card build choice) AND the shadow card's own level survived the handicap knockdown
// (lvl>=2) — a knocked-down card is level 1 regardless of what the player's real card carries, so
// its grant has to be off too, the same way its signature already is. `shielded()`/the
// strike-carry checks read `.grantOn`/`.quad` directly, unlike ability text which gates through
// on()/`.ab`, so grantOn has to be computed here rather than just copied via the `...baseC[i]`
// spread (which would otherwise hand a level-1 shadow card a grant its own level doesn't support).
function ladderOpponentCards(baseC, opponentLevels) {
  const C = Object.assign({}, baseC);
  for (let i = 1; i <= 28; i++) {
    const lvl = opponentLevels[i] || 1;
    const grantOn = !!(baseC[i].grantOn && lvl >= 2);
    C[200 + i] = { ...baseC[i], id: 200 + i, who: "sky", lvl, ab: lvl >= 2 ? baseC[i].sig : null,
      grantOn, twoFaced: grantOn && baseC[i].quad === "seiryuu", homeM: i };
  }
  return C;
}
const SHADOW_PACK = Array.from({ length: 28 }, (_, i) => 200 + i + 1); // the mirror deck's own id range

const ROAD_STAGES = [1, 2, 3, 4, 5, 6, 7, 8, "mansion"];

// playBoard()/playMatch()'s one-ply-evaluator counterparts, using bestMove() — THIS is what
// actually drives the difficulty ladder (28 aug 2026 pt.4). cfg.youCaution/cfg.skyCaution (both
// default 8) replace playBoardSearch's youDepth/skyDepth naming for the same reason bestMove()
// exists at all: these are reply-cost weights, not search depths.
//
// MUTATES g.you/g.sky/g.slots in place as the board plays out (matching playBoard()'s own
// convention) rather than tracking hands in a separate local object — this is load-bearing, not
// stylistic: bestMove()/replyCost() read the opponent's hand straight off g.sky/g.you (verbatim
// per the report's reference implementation), so if g itself is never updated, replyCost sees the
// foe's FULL ORIGINAL 7-card hand all game, including cards already played — a real bug caught by
// the report's own acceptance check 7 (the seat gap came out at 22 points against a ~1-point
// target before this fix), not by code review. playBoardSearch()/searchMove() don't have this
// problem because searchMove() takes a `hands` object as an explicit parameter instead.
function playBoardWeighted(cfg) {
  cfg = cfg || {};
  const g = mkGame(cfg);
  const youCaution = cfg.youCaution == null ? 8 : cfg.youCaution;
  const skyCaution = cfg.skyCaution == null ? 8 : cfg.skyCaution;
  let flips = 0, guard = 0;
  while (g.slots.some(s => !s) && (g.you.length || g.sky.length) && guard++ < 20) {
    const side = g.turn, caution = side === "you" ? youCaution : skyCaution;
    const hand = side === "you" ? g.you : g.sky;
    if (!hand.length) { g.turn = side === "you" ? "sky" : "you"; continue; }
    const mv = bestMove(g, g.slots, hand, side, caution);
    if (!mv) { g.turn = side === "you" ? "sky" : "you"; continue; }
    flips += (mv.r.seq || []).filter(x => !x.miss).length;
    g.slots = mv.r.slots;
    g[side] = hand.filter(id => id !== mv.id);
    g.turn = side === "you" ? "sky" : "you";
  }
  return { winner: boardWinner(g, g.slots), flips, slots: g.slots, you: g.you, sky: g.sky };
}
function playMatchWeighted(cfg) {
  cfg = cfg || {};
  const format = MATCH_FORMATS[cfg.format] ? cfg.format : "walker";
  const { need, maxBoards } = MATCH_FORMATS[format];
  const baseSeed = cfg.seed == null ? 1 : cfg.seed;
  let leader = cfg.leader || "you";
  let youWins = 0, skyWins = 0;
  const boards = [];
  for (let n = 0; n < maxBoards && youWins < need && skyWins < need; n++) {
    const you = (cfg.you || deal(cfg.pack || null, baseSeed + n * 97, 7)).slice();
    const sky = cfg.skyPack ? deal(cfg.skyPack, baseSeed + n * 251, 7) : (cfg.sky || DEFAULT_SKY_HAND).slice();
    const boardCfg = Object.assign({}, cfg, { you, sky, leader, seed: baseSeed + n });
    const r = playBoardWeighted(boardCfg);
    boards.push({ winner: r.winner, leader, flips: r.flips });
    if (r.winner === "you") { youWins++; leader = "sky"; }
    else if (r.winner === "sky") { skyWins++; leader = "you"; }
  }
  const winner = youWins >= need ? "you" : skyWins >= need
    ? "sky" : youWins > skyWins ? "you" : skyWins > youWins ? "sky" : "draw";
  return { winner, youWins, skyWins, boards, format, length: boards.length };
}

// playBoard()/playMatch()'s search-driven counterparts, using searchMove() (real depth-limited
// lookahead) instead of pickMove()'s fixed heuristic — the difficulty ladder's opponent needs a
// configurable THINKING DEPTH, not just a weaker deck. Kept separate from playBoard/playMatch
// rather than folded in: those still faithfully mirror V1's actual live single-player AI
// (pickMove/skyMove/youMove), which this report does not touch — only the ladder's opponent AI is
// in scope here.
function playBoardSearch(cfg) {
  cfg = cfg || {};
  const g = mkGame(cfg);
  const youDepth = cfg.youDepth == null ? 8 : cfg.youDepth;
  const skyDepth = cfg.skyDepth == null ? 8 : cfg.skyDepth;
  const hands = { you: g.you.slice(), sky: g.sky.slice() };
  let slots = g.slots.slice(), turn = g.turn, flips = 0, guard = 0;
  while (slots.some(s => !s) && (hands.you.length || hands.sky.length) && guard++ < 20) {
    const mover = turn, depth = mover === "you" ? youDepth : skyDepth;
    if (!hands[mover].length) { turn = mover === "you" ? "sky" : "you"; continue; }
    const { move } = searchMove(g, slots, hands, mover, depth);
    if (!move) { turn = mover === "you" ? "sky" : "you"; continue; }
    flips += (move.r.seq || []).filter(x => !x.miss).length;
    slots = move.r.slots;
    hands[mover] = hands[mover].filter(id => id !== move.id);
    turn = mover === "you" ? "sky" : "you";
  }
  return { winner: boardWinner(g, slots), flips, slots, you: hands.you, sky: hands.sky };
}
function playMatchSearch(cfg) {
  cfg = cfg || {};
  const format = MATCH_FORMATS[cfg.format] ? cfg.format : "walker";
  const { need, maxBoards } = MATCH_FORMATS[format];
  const baseSeed = cfg.seed == null ? 1 : cfg.seed;
  let leader = cfg.leader || "you";
  let youWins = 0, skyWins = 0;
  const boards = [];
  for (let n = 0; n < maxBoards && youWins < need && skyWins < need; n++) {
    const you = (cfg.you || deal(cfg.pack || null, baseSeed + n * 97, 7)).slice();
    const sky = cfg.skyPack ? deal(cfg.skyPack, baseSeed + n * 251, 7) : (cfg.sky || DEFAULT_SKY_HAND).slice();
    const boardCfg = Object.assign({}, cfg, { you, sky, leader, seed: baseSeed + n });
    const r = playBoardSearch(boardCfg);
    boards.push({ winner: r.winner, leader, flips: r.flips });
    if (r.winner === "you") { youWins++; leader = "sky"; }
    else if (r.winner === "sky") { skyWins++; leader = "you"; }
  }
  const winner = youWins >= need ? "you" : skyWins >= need
    ? "sky" : youWins > skyWins ? "you" : skyWins > youWins ? "sky" : "draw";
  return { winner, youWins, skyWins, boards, format, length: boards.length };
}

// ONE push up the shortened road (report §3) with three lives (report §2) — a single attempt,
// start to finish. Stages 1-4 are a single board; 5-8 are best-of-three (loser leads); the mansion
// is best-of-five and leads its OWN board one. A loss costs one life; losing WITHOUT using the
// last life means facing the same stage again (report's own wording, not "move on regardless").
// The THIRD loss ends the push right there as a failure (`cleared: false, wiped: true`) — it does
// NOT reset and keep retrying inside this function (see the note on this from pt.2: "boards a
// push" being a constant 18.6 across every collection tier only makes sense if a push is a
// bounded, single attempt that can fail). cfg.playerLevels: {id: 1-4-ish level} for the player's
// real 28-card save — the ONLY per-player input (report checklist items 3-4): handicap and
// opponent caution are both derived live from awakeCount(playerLevels), nothing hardcoded.
// cfg.youCaution (default 8, "careful") lets a caller simulate a careless player instead
// (caution 0), matching the report's own "careful minus careless" comparison. Uses
// playBoardWeighted/playMatchWeighted (the one-ply evaluator, pt.4) — NOT the negamax search;
// see bestMove()'s header for why. baseC is built with grants:"all" — cards()'s whole-table grant
// simplification, matching the assumption every ladder acceptance check makes about the player's
// own deck (see ladderOpponentCards()'s header for how that then mirrors into the opponent).
function playPush(cfg) {
  cfg = cfg || {};
  const playerLevels = cfg.playerLevels || {};
  const lives = cfg.lives == null ? 3 : cfg.lives;
  const baseSeed = cfg.seed == null ? 1 : cfg.seed;
  const youCaution = cfg.youCaution == null ? 8 : cfg.youCaution;
  const awake = awakeCount(playerLevels);
  const handicap = handicapFor(awake);
  const cautions = cautionsFor(awake);
  const C = ladderOpponentCards(cards({ levels: playerLevels, grants: "all" }), handicapLevels(playerLevels, handicap));
  let livesLeft = lives, stageIdx = 0, boardsPlayed = 0;
  const log = [];
  while (stageIdx < ROAD_STAGES.length && livesLeft > 0) {
    const stage = ROAD_STAGES[stageIdx];
    const skyCaution = cautions[stageIdx]; // ROAD_STAGES and the caution bands share the same 9-entry order
    const seed = baseSeed + stageIdx * 977 + (lives - livesLeft) * 7919 + log.length;
    let result;
    if (stage === "mansion") {
      result = playMatchWeighted({ C, format: "mansion", leader: "sky", pack: null, skyPack: SHADOW_PACK, seed, youCaution, skyCaution });
    } else if (stage >= 5) {
      result = playMatchWeighted({ C, format: "walker", leader: "you", pack: null, skyPack: SHADOW_PACK, seed, youCaution, skyCaution });
    } else {
      const you = deal(null, seed, 7), sky = deal(SHADOW_PACK, seed + 1, 7);
      const r = playBoardWeighted({ C, you, sky, leader: "you", seed, youCaution, skyCaution });
      result = { winner: r.winner, length: 1 };
    }
    boardsPlayed += result.length;
    log.push({ stage, handicap, opponentCaution: skyCaution, winner: result.winner, boardsThisStage: result.length, livesLeft });
    if (result.winner === "you") stageIdx++;
    else livesLeft--; // a loss that doesn't empty the lives just repeats the same stage (report §2)
  }
  const cleared = stageIdx >= ROAD_STAGES.length;
  return { cleared, wiped: !cleared, boardsPlayed, log, livesLeft };
}

module.exports = { cards, mkGame, deal, seededRand, nb, legalSlot, on, faceOf, shielded, tryFlip,
  lodge, resolve, isHome, slotW, ctxOf, counts, boardWinner, bestReply, bestYouReply, bestSkyReply,
  temperFeat, pickMove, skyMove, youMove, playBoard, playMatch, MATCH_FORMATS,
  diffFor, legalMoves, replyCost, moveKey, bestMove, playBoardWeighted, playMatchWeighted,
  searchMove, BEAM, playBoardSearch, playMatchSearch,
  awakeCount, HANDICAP_BANDS, handicapFor, CAUTION_BANDS, cautionsFor, handicapLevels, ladderOpponentCards,
  playPush, ROAD_STAGES, SHADOW_PACK, LAW_AT, lawAt, BOARD_OFF, boardM, quadOf, tollOn, crowPays, isQuarterless,
  POOL, QUAD_OF, QUADRANT, DEFAULT_SKY_HAND, BOARD_LEN };

// ---- self-checks ----------------------------------------------------------------------------
if (require.main === module) {
  const E = module.exports;
  const VECTORS = [
    ["a tied board defaults to the defender (28 aug 2026 lock, supersedes the 27 aug flat draw)", () => {
      const g = E.mkGame({ tieRule: undefined }); // leader defaults to "you"
      // a 9-station board where every count comes out even is contrived by hand: two cards of
      // equal worth on two stations, everything else empty (slotW gives w=0 to unclaimed slots).
      const slots = Array.from({ length: g.len }, () => null);
      slots[0] = { id: 106, l: 9, r: 6, owner: "you", by: "you", age: 0 }; // sun, no ability
      slots[8] = { id: 107, l: 6, r: 6, owner: "sky", by: "sky", age: 0 }; // moon, no ability
      return E.boardWinner(g, slots); // "you" led by default, so the level board goes to "sky"
    }, "sky"],
    ["boardWinner respects an explicit tieRule override", () => {
      const g = E.mkGame({ tieRule: "the sky" });
      const slots = Array.from({ length: g.len }, () => null);
      slots[0] = { id: 106, l: 9, r: 6, owner: "you", by: "you", age: 0 };
      slots[8] = { id: 107, l: 6, r: 6, owner: "sky", by: "sky", age: 0 };
      return E.boardWinner(g, slots);
    }, "sky"],
    ["tieRule 'the defender' gives a level board to whoever did NOT lead it", () => {
      const slots = Array.from({ length: 9 }, () => null);
      slots[0] = { id: 106, l: 9, r: 6, owner: "you", by: "you", age: 0 };
      slots[8] = { id: 107, l: 6, r: 6, owner: "sky", by: "sky", age: 0 };
      const gYouLed = E.mkGame({ tieRule: "the defender", leader: "you" });
      const gSkyLed = E.mkGame({ tieRule: "the defender", leader: "sky" });
      return E.boardWinner(gYouLed, slots) + ":" + E.boardWinner(gSkyLed, slots);
    }, "sky:you"],
    ["cards() builds 28 mansion cards + 7 sky planets", () => {
      const C = E.cards({});
      return Object.keys(C).filter(k => C[k].id <= 28).length + ":" + [101, 102, 103, 104, 105, 106, 107].every(id => !!C[id]);
    }, "28:true"],
    ["cards(): grants require lvl>=2, same gate as the signature — a level-1 card gets no grant even with grants:'all'", () => {
      const C = E.cards({ levels: { 1: 1, 2: 3 }, grants: "all" });
      return C[1].grantOn === false && C[2].grantOn === true;
    }, true],
    ["deal() returns the requested hand size from a 28-card pack", () => E.deal(null, 42, 7).length, 7],
    ["deal() is deterministic for a given seed", () => JSON.stringify(E.deal(null, 42, 7)) === JSON.stringify(E.deal(null, 42, 7)), true],
    ["resolve() places a card and returns a full slot array", () => {
      const g = E.mkGame({ seed: 1 });
      const rr = E.resolve(g, g.slots, 106, 4, false, "you");
      return rr.slots.filter(Boolean).length + ":" + rr.slots[4].id;
    }, "1:106"],
    ["a higher face claims a lower one on lodge", () => {
      const g = E.mkGame({});
      let slots = Array.from({ length: g.len }, () => null);
      slots[4] = { id: 107, l: 2, r: 2, owner: "sky", by: "sky", age: 1 }; // moon, weak, no ability
      const rr = E.resolve(g, slots, 106, 3, false, "you"); // sun (9|6) lodges beside it
      return rr.slots[4].owner;
    }, "you"],
    ["youMove picks a real, legal placement from the hand it's given", () => {
      const g = E.mkGame({ seed: 7 });
      const mv = E.youMove(g, g.slots, g.you);
      return !!mv && g.you.includes(mv.id) && mv.i >= 0 && mv.i < g.len && !g.slots[mv.i];
    }, true],
    ["temper is her mood only — setting g.temper must not change youMove's pick", () => {
      const g1 = E.mkGame({ seed: 7, temper: null });
      const g2 = E.mkGame({ seed: 7, temper: "mars" });
      const m1 = E.youMove(g1, g1.slots, g1.you), m2 = E.youMove(g2, g2.slots, g2.you);
      return m1.id + "@" + m1.i + (m1.rev ? "r" : "") === m2.id + "@" + m2.i + (m2.rev ? "r" : "");
    }, true],
    ["playBoard runs a full automated match to a filled board and a valid winner", () => {
      const r = E.playBoard({ seed: 3 });
      return r.slots.filter(Boolean).length + ":" + ["you", "sky", "draw"].includes(r.winner);
    }, "9:true"],
    ["playMatch: walker is best of three (max 3 boards, first to 2 wins the match)", () => {
      const r = E.playMatch({ format: "walker", seed: 11 });
      return r.length <= 3 && (r.youWins >= 2 || r.skyWins >= 2) && ["you", "sky", "draw"].includes(r.winner);
    }, true],
    ["playMatch: mansion is best of five (max 5 boards, first to 3 wins the match)", () => {
      const r = E.playMatch({ format: "mansion", seed: 11 });
      return r.length <= 5 && (r.youWins >= 3 || r.skyWins >= 3) && ["you", "sky", "draw"].includes(r.winner);
    }, true],
    ["playMatch: the loser of a board leads the next one", () => {
      const r = E.playMatch({ format: "mansion", seed: 11, leader: "you" });
      let ok = r.boards[0].leader === "you";
      for (let i = 1; i < r.boards.length; i++) {
        const prevWinner = r.boards[i - 1].winner;
        const prevLoser = prevWinner === "you" ? "sky" : prevWinner === "sky" ? "you" : r.boards[i - 1].leader;
        if (r.boards[i].leader !== prevLoser) ok = false;
      }
      return ok;
    }, true],
    ["handicapFor / cautionsFor basics", () => {
      const h8 = E.handicapFor(6) === 0.75, h28 = E.handicapFor(28) === 0, hMid = E.handicapFor(14) === 0.5;
      const d0 = E.cautionsFor(6)[0] === 0 && E.cautionsFor(6)[8] === 2; // walker 1 + mansion, 0-8 band
      const d28 = E.cautionsFor(28)[0] === 0 && E.cautionsFor(28)[8] === 8; // 22-28 band
      const lens = E.cautionsFor(6).length === 9 && E.cautionsFor(28).length === 9;
      return h8 && h28 && hMid && d0 && d28 && lens;
    }, true],
    ["bestMove: caution 0 is pure greedy (ignores the reply, picks the best immediate score)", () => {
      const g = E.mkGame({ seed: 3 });
      const mv = E.bestMove(g, g.slots, g.you, "you", 0);
      const best = Math.max(...g.you.map(id => {
        const revOpts = g.C[id].twoFaced ? [false, true] : [false];
        let m = -Infinity;
        g.slots.forEach((s, i) => { if (s) return; revOpts.forEach(rev => {
          const [y, k] = E.counts(g, E.resolve(g, g.slots, id, i, rev, "you").slots);
          m = Math.max(m, (y - k) * 10);
        }); });
        return m;
      }));
      return !!mv && mv.score === best;
    }, true],
    ["replyCost: scales linearly with caution, and 0 caution costs nothing", () => {
      const g = E.mkGame({ seed: 5 });
      const c0 = E.replyCost(g, g.slots, "you", 0);
      const c1 = E.replyCost(g, g.slots, "you", 1);
      const c4 = E.replyCost(g, g.slots, "you", 4);
      return c0 === 0 && c4 === c1 * 4;
    }, true],
    ["moveKey is deterministic for the same inputs", () => {
      const g = E.mkGame({ seed: 1 });
      return E.moveKey(g, 5, 3) === E.moveKey(g, 5, 3);
    }, true],
    ["playBoardWeighted/playMatchWeighted: fast, and structurally sane", () => {
      const r = E.playBoardWeighted({ seed: 2, youCaution: 8, skyCaution: 8 });
      const m = E.playMatchWeighted({ format: "walker", seed: 2, youCaution: 8, skyCaution: 8 });
      return r.slots.filter(Boolean).length === 9 && ["you", "sky", "draw"].includes(r.winner)
        && m.length <= 3 && (m.youWins >= 2 || m.skyWins >= 2);
    }, true],
    ["handicapLevels: knocks the weakest `handicap` fraction of the player's OWN AWAKE cards to 1", () => {
      const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = i <= 10 ? (i <= 3 ? 4 : 3) : 1; // A=10: ids 1-3 @ lvl4, ids 4-10 @ lvl3
      const opp = E.handicapLevels(levels, 0.5); // drop = round(0.5*10) = 5, weakest-first: lvl3 group (ids 4-10) before lvl4 (ids 1-3)
      const dropped = [4, 5, 6, 7, 8].every(id => opp[id] === 1); // the weakest 5 by level, tie-broken by id ascending
      const kept = [1, 2, 3].every(id => opp[id] === 4) && [9, 10].every(id => opp[id] === 3);
      const untouched = [11, 28].every(id => opp[id] === 1); // never-awake cards, unaffected either way
      return dropped && kept && untouched;
    }, true],
    ["handicapLevels: handicap 0 is a true mirror (nothing knocked down)", () => {
      const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = i <= 15 ? 3 : 1;
      const opp = E.handicapLevels(levels, 0);
      return Object.keys(levels).every(id => opp[id] === levels[id]);
    }, true],
    ["ladderOpponentCards + the on() fix: a level-1 ladder opponent card's ability is actually off", () => {
      const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = 3;
      const baseC = E.cards({ levels });
      const opp = E.handicapLevels(levels, 1); // handicap 1 -> every awake card knocked to level 1
      const C = E.ladderOpponentCards(baseC, opp);
      return E.on({}, C[201]) === false && C[201].ab === null;
    }, true],
    ["ladderOpponentCards: a kept (handicap 0, mirror) opponent card's ability is on", () => {
      const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = 3;
      const baseC = E.cards({ levels });
      const opp = E.handicapLevels(levels, 0); // true mirror
      const C = E.ladderOpponentCards(baseC, opp);
      return E.on({}, C[201]) === true && C[201].ab === baseC[1].sig;
    }, true],
    ["ladderOpponentCards: grants mirror onto a kept card when the base deck has grants on", () => {
      const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = 3;
      const baseC = E.cards({ levels, grants: "all" }); // card 14 is seiryuu (QUAD_OF)
      const opp = E.handicapLevels(levels, 0); // true mirror -> all 28 kept
      const C = E.ladderOpponentCards(baseC, opp);
      const allGranted = Array.from({ length: 28 }, (_, i) => C[201 + i].grantOn).every(Boolean);
      return allGranted && C[214].twoFaced === true; // seiryuu's grant carries twoFaced
    }, true],
    ["ladderOpponentCards: a knocked-down (level 1) card gets NO grant even if the base deck has grants on", () => {
      const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = 3;
      const baseC = E.cards({ levels, grants: "all" });
      const opp = E.handicapLevels(levels, 1); // handicap 1 -> every card knocked to level 1
      const C = E.ladderOpponentCards(baseC, opp);
      return C[201].grantOn === false && C[214].twoFaced === false;
    }, true],
    ["searchMove: depth 0 is pure greedy (no lookahead) and picks a legal move", () => {
      const g = E.mkGame({ seed: 3 });
      const hands = { you: g.you.slice(), sky: g.sky.slice() };
      const { move } = E.searchMove(g, g.slots, hands, "you", 0);
      return !!move && hands.you.includes(move.id) && !g.slots[move.i];
    }, true],
    ["searchMove: depth 0 picks the true best immediate move (checked against an independent scan)", () => {
      const g = E.mkGame({ seed: 3 });
      const hands = { you: g.you.slice(), sky: g.sky.slice() };
      const { value } = E.searchMove(g, g.slots, hands, "you", 0);
      const best = Math.max(...E.legalMoves(g, g.slots, hands.you).map(m =>
        E.diffFor(g, E.resolve(g, g.slots, m.id, m.i, m.rev, "you").slots, "you")));
      return value === best;
    }, true],
    ["on(): the fixed planets are unaffected by the sky-ability fix", () => {
      const g = E.mkGame({});
      return E.on(g, g.C[101]) === true && E.on(g, g.C[106]) === false; // saturn has an ability; sun never did
    }, true],
    ["playPush: runs the shortened road end to end with a consistent log", () => {
      const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = 3; // maxed: fast, near-certain clears
      const r = E.playPush({ playerLevels: levels, seed: 4, lives: 3 });
      const stagesOk = r.log.every(e => E.ROAD_STAGES.includes(e.stage));
      const livesOk = r.log.every(e => e.livesLeft >= 0 && e.livesLeft <= 3);
      const boardsOk = r.boardsPlayed > 0 && r.boardsPlayed === r.log.reduce((s, e) => s + e.boardsThisStage, 0);
      return stagesOk && livesOk && boardsOk && typeof r.cleared === "boolean";
    }, true],
    ["playPush: a loss that doesn't wipe repeats the same stage next", () => {
      const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = 1; // 0 awake: opponent forced level 1 too
      const r = E.playPush({ playerLevels: levels, seed: 9, lives: 3 });
      let ok = true;
      for (let i = 1; i < r.log.length; i++) {
        const prev = r.log[i - 1];
        if (prev.winner !== "you" && prev.livesLeft > 1 && r.log[i].stage !== prev.stage) ok = false;
      }
      return ok;
    }, true],
    // THE HEART'S LAW (29 aug 2026, corrected work order, Form C) — station 0 strikes station 1
    // once more, whole-night scope (any board tonight, not just the mansion match), the moment the
    // board fills. Uses sun(106)/moon(107) as ability-less filler (both have ab:null) so slot faces
    // are the only thing under test; faceOf()/tryFlip() read a slot's OWN l/r, not the card table's,
    // so a filler slot's numbers can be set freely regardless of what sun/moon "really" print.
    ["the heart's law: fires on a WALKER board for mansion 18 (whole-night scope, not roadBoss-gated), station 0 takes station 1", () => {
      const g = E.mkGame({ roadBoss: false, tonight: 18 });
      const slots = Array.from({ length: 9 }, (_, k) => k === 8 ? null : { id: 106, l: 1, r: 1, owner: "you", by: "you", age: 1 });
      slots[0] = { id: 106, l: 1, r: 5, owner: "you", by: "you", age: 1 }; // station 0's right face (attacker) = 5
      slots[1] = { id: 107, l: 3, r: 1, owner: "sky", by: "sky", age: 1 }; // station 1's left face (defender) = 3
      const rr = E.resolve(g, slots, 107, 8, false, "sky"); // fills the last slot; triggers "road fills"
      return rr.slots.every(Boolean) && rr.slots[1].owner === "you";
    }, true],
    ["the heart's law: does NOT fire for a mansion other than 18, on either a walker or the boss board", () => {
      const mk = (roadBoss, tonight) => {
        const g = E.mkGame({ roadBoss, tonight });
        const slots = Array.from({ length: 9 }, (_, k) => k === 8 ? null : { id: 106, l: 1, r: 1, owner: "you", by: "you", age: 1 });
        slots[0] = { id: 106, l: 1, r: 5, owner: "you", by: "you", age: 1 };
        slots[1] = { id: 107, l: 3, r: 1, owner: "sky", by: "sky", age: 1 };
        return E.resolve(g, slots, 107, 8, false, "sky").slots[1].owner;
      };
      return mk(false, 21) === "sky" && mk(true, 21) === "sky";
    }, true],
    ["the heart's law respects deny rules: the ground-lock family still holds against the beat (saturn here; the live build's byakko grant uses the same shielded() gate)", () => {
      const g = E.mkGame({ roadBoss: false, tonight: 18 });
      const slots = Array.from({ length: 9 }, (_, k) => k === 8 ? null : { id: 106, l: 1, r: 1, owner: "you", by: "you", age: 1 });
      slots[0] = { id: 106, l: 1, r: 9, owner: "you", by: "you", age: 1 }; // overwhelming attacker face
      slots[1] = { id: 101, l: 1, r: 1, owner: "sky", by: "sky", age: 1 }; // saturn: locked regardless of numbers
      const rr = E.resolve(g, slots, 107, 8, false, "sky");
      return rr.slots[1].owner === "sky"; // unchanged: the deny rule held
    }, true],
    ["the heart's law does NOT chain onward: a taken station 1 does not itself strike station 2 (that clause belonged to the rejected board-wide form)", () => {
      const g = E.mkGame({ roadBoss: false, tonight: 18 });
      const slots = Array.from({ length: 9 }, (_, k) => k === 8 ? null : { id: 106, l: 1, r: 1, owner: "you", by: "you", age: 1 });
      slots[0] = { id: 106, l: 1, r: 9, owner: "you", by: "you", age: 1 }; // beats station 1 easily
      slots[1] = { id: 107, l: 2, r: 8, owner: "sky", by: "sky", age: 1 }; // taken; its own right face (8) would beat station 2 IF it chained
      slots[2] = { id: 106, l: 3, r: 1, owner: "sky", by: "sky", age: 1 }; // left face 3 < 8, but sun/moon carry no chaining ability
      const rr = E.resolve(g, slots, 107, 8, false, "sky");
      return rr.slots[1].owner === "you" && rr.slots[2].owner === "sky"; // station 1 taken by the beat; station 2 untouched
    }, true],
    // THE HIDEAWAY'S LAW (30 aug 2026, THE-TENTS-LAW-SHIPPED-30AUG.md) — mansion 25's station 4
    // (not station 0: the client slides the road window so her own ground stands mid-road, a
    // theater-layer concept this base-match engine doesn't model — see the LAW_AT comment). Reuses
    // the same `by !== owner` "has this station ever changed hands" test the genbu grant's own
    // "empty shell" already uses in slotW(), so these vectors also incidentally cover that reuse.
    ["the hideaway's law: an untaken tent (mansion 25, station 4) counts normally", () => {
      const g = E.mkGame({ tonight: 25 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[4] = { id: 106, l: 5, r: 5, owner: "you", by: "you", age: 1 };
      const [you, sky] = E.counts(g, slots);
      return you === 1 && sky === 0;
    }, true],
    ["the hideaway's law: a taken tent counts for nobody, either side", () => {
      const g = E.mkGame({ tonight: 25 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[4] = { id: 106, l: 5, r: 5, owner: "you", by: "sky", age: 1 }; // by !== owner: it changed hands
      const [you, sky] = E.counts(g, slots);
      return you === 0 && sky === 0;
    }, true],
    ["the hideaway's law: the shell does not touch a neighbouring station", () => {
      const g = E.mkGame({ tonight: 25 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[4] = { id: 106, l: 5, r: 5, owner: "you", by: "sky", age: 1 }; // taken tent: counts for nobody
      slots[5] = { id: 107, l: 5, r: 5, owner: "sky", by: "sky", age: 1 }; // untouched neighbour, counts as ever
      const [you, sky] = E.counts(g, slots);
      return you === 0 && sky === 1;
    }, true],
    ["the hideaway's law does NOT fire on a different mansion's night", () => {
      const g = E.mkGame({ tonight: 5 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[4] = { id: 106, l: 5, r: 5, owner: "you", by: "sky", age: 1 }; // "taken", but no law active tonight
      const [you, sky] = E.counts(g, slots);
      return you === 1 && sky === 0;
    }, true],
    // THE THRONE'S LAW (30 aug 2026, WORKORDER-THRONE-LAW-30AUG.md) — mansion 10, station 0. A card
    // lodging there also strikes two stations away, crossing an empty middle, printed pool faces.
    ["the throne's law: her station's strike carries two stations, over an empty middle (mansion 10, station 0)", () => {
      const g = E.mkGame({ tonight: 10 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[2] = { id: 107, l: 3, r: 3, owner: "sky", by: "sky", age: 1 }; // an easy target, two stations away
      const rr = E.resolve(g, slots, 106, 0, false, "you"); // sun (9/6) lodges at station 0
      return rr.slots[2].owner === "you";
    }, true],
    ["the throne's law: side-neutral, her card reaches the same way", () => {
      const g = E.mkGame({ tonight: 10 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[2] = { id: 106, l: 3, r: 3, owner: "you", by: "you", age: 1 };
      const rr = E.resolve(g, slots, 107, 0, false, "sky"); // moon (6/6) lodges at station 0 for sky
      return rr.slots[2].owner === "sky";
    }, true],
    ["the throne's law: printed faces at the far station — a boon'd live face does not carry", () => {
      const g = E.mkGame({ tonight: 10 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[1] = { id: 13, l: 5, r: 7, owner: "you", by: "you", age: 1 }; // the hand: boons its new neighbour +1
      slots[2] = { id: 107, l: 7, r: 7, owner: "sky", by: "sky", age: 1 }; // printed 6 fails v 7; a boon'd 7 would tie and take it
      const rr = E.resolve(g, slots, 106, 0, false, "you"); // sun (9/6) lodges at station 0, boon'd to 7 by the hand
      return rr.slots[0].boon === 1 && rr.slots[2].owner === "sky"; // the near boon lands; the reach's far strike still reads printed 6 and fails
    }, true],
    ["the throne's law does NOT fire on a different mansion's night", () => {
      const g = E.mkGame({ tonight: 5 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[2] = { id: 107, l: 3, r: 3, owner: "sky", by: "sky", age: 1 };
      const rr = E.resolve(g, slots, 106, 0, false, "you");
      return rr.slots[2].owner === "sky"; // untouched: no law active tonight, so no reach
    }, true],
    // THE TURNING'S LAW (2 sep 2026, WHATS-NEW.md §1) — mansion 12, station 0. A lodge at the door
    // swaps the NEXT station's two faces, permanently, before the strike queue runs.
    ["the turning's law: a lodge at the door turns the next station's faces (mansion 12, station 0)", () => {
      const g = E.mkGame({ tonight: 12 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[1] = { id: 101, l: 2, r: 8, owner: "sky", by: "sky", age: 1 }; // saturn: locked, so it cannot be taken and its faces are all we read
      const rr = E.resolve(g, slots, 107, 0, false, "you");
      return rr.slots[1].l === 8 && rr.slots[1].r === 2;
    }, true],
    ["the turning's law: the turn happens BEFORE the strike, so the turned face is the one that fights", () => {
      const g = E.mkGame({ tonight: 12 });
      const slots = Array.from({ length: 9 }, () => null);
      // station 1 defends leftward with its `l`. Printed l=9 would hold off the moon's r=6; turned,
      // l becomes 2 and the strike lands. If the turn ran after the strike, this slot stays sky's.
      slots[1] = { id: 106, l: 9, r: 2, owner: "sky", by: "sky", age: 1 };
      const rr = E.resolve(g, slots, 107, 0, false, "you"); // moon 6/6
      return rr.slots[1].owner === "you";
    }, true],
    ["the turning's law: a symmetric card refuses the turn (nine cards are provably immune)", () => {
      const g = E.mkGame({ tonight: 12 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[1] = { id: 101, l: 6, r: 6, owner: "sky", by: "sky", age: 1 };
      const rr = E.resolve(g, slots, 107, 0, false, "you");
      return rr.slots[1].l === 6 && rr.slots[1].r === 6 && !rr.seq.some(x => x.turn);
    }, true],
    ["the turning's law does NOT fire on a different mansion's night", () => {
      const g = E.mkGame({ tonight: 5 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[1] = { id: 101, l: 2, r: 8, owner: "sky", by: "sky", age: 1 };
      const rr = E.resolve(g, slots, 107, 0, false, "you");
      return rr.slots[1].l === 2 && rr.slots[1].r === 8;
    }, true],
    // THE ROOT'S LAW (2 sep 2026, WHATS-NEW.md §2) — mansion 19, station 4, `plantOnTake`. Only a
    // station that has ALREADY changed hands roots; the opening lodge never does. The unconditional
    // form is measurement's 1a, which failed and must never ship.
    ["the root's law: an opening lodge at the law station is still takeable (the leader cannot plant by arriving first)", () => {
      const g = E.mkGame({ tonight: 19 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[4] = { id: 107, l: 2, r: 2, owner: "sky", by: "sky", age: 1 }; // lodged by sky, never taken
      const rr = E.resolve(g, slots, 106, 3, false, "you"); // sun 9/6: r=6 strikes station 4's l=2
      return rr.slots[4].owner === "you";
    }, true],
    ["the root's law: a station that has changed hands cannot be taken back", () => {
      const g = E.mkGame({ tonight: 19 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[4] = { id: 107, l: 2, r: 2, owner: "you", by: "sky", age: 1 }; // by !== owner: it already changed hands
      const rr = E.resolve(g, slots, 106, 3, false, "sky");
      return rr.slots[4].owner === "you"; // rooted: sky cannot take it back
    }, true],
    ["the root's law does not root a neighbouring station", () => {
      const g = E.mkGame({ tonight: 19 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[5] = { id: 107, l: 2, r: 2, owner: "you", by: "sky", age: 1 }; // changed hands, but not at station 4
      const rr = E.resolve(g, slots, 106, 4, false, "sky"); // sun r=6 v station 5's l=2
      return rr.slots[5].owner === "sky";
    }, true],
    ["the root's law does NOT fire on a different mansion's night", () => {
      const g = E.mkGame({ tonight: 5 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[4] = { id: 107, l: 2, r: 2, owner: "you", by: "sky", age: 1 };
      const rr = E.resolve(g, slots, 106, 3, false, "sky");
      return rr.slots[4].owner === "sky";
    }, true],
    // THE QUIET MIDDLE (mansion 21, station 4) — a count-path law: the two stations beside a filled
    // law station count for nobody, both sides.
    ["the hush: the two stations beside a filled law station count for nobody (mansion 21, station 4)", () => {
      const g = E.mkGame({ tonight: 21 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[3] = { id: 106, l: 5, r: 5, owner: "you", by: "you", age: 1 };
      slots[4] = { id: 106, l: 5, r: 5, owner: "you", by: "you", age: 1 };
      slots[5] = { id: 107, l: 5, r: 5, owner: "sky", by: "sky", age: 1 };
      const [you, sky] = E.counts(g, slots);
      return you === 1 && sky === 0; // only the law station itself counts; 3 and 5 are quiet
    }, true],
    ["the hush does nothing while the law station stands empty", () => {
      const g = E.mkGame({ tonight: 21 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[3] = { id: 106, l: 5, r: 5, owner: "you", by: "you", age: 1 };
      slots[5] = { id: 107, l: 5, r: 5, owner: "sky", by: "sky", age: 1 };
      const [you, sky] = E.counts(g, slots);
      return you === 1 && sky === 1;
    }, true],
    ["the hush does NOT fire on a different mansion's night", () => {
      const g = E.mkGame({ tonight: 5 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[3] = { id: 106, l: 5, r: 5, owner: "you", by: "you", age: 1 };
      slots[4] = { id: 106, l: 5, r: 5, owner: "you", by: "you", age: 1 };
      slots[5] = { id: 107, l: 5, r: 5, owner: "sky", by: "sky", age: 1 };
      const [you, sky] = E.counts(g, slots);
      return you === 2 && sky === 1;
    }, true],
    // THE DRUM'S LAW (mansion 23, station 4) — a strike whose origin or target is the law station
    // carries one further, from the victim. One extra hop, not recursive.
    ["the drum's law: a strike landing ON the law station carries one further (mansion 23, station 4)", () => {
      const g = E.mkGame({ tonight: 23 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[4] = { id: 107, l: 2, r: 9, owner: "sky", by: "sky", age: 1 }; // taken, then its own r=9 carries on
      slots[5] = { id: 107, l: 3, r: 3, owner: "sky", by: "sky", age: 1 }; // l=3 loses to the carried 9
      const rr = E.resolve(g, slots, 106, 3, false, "you"); // sun r=6 v station 4's l=2
      return rr.slots[4].owner === "you" && rr.slots[5].owner === "you";
    }, true],
    ["the drum's law is bounded: it carries while an endpoint is the law station, and stops the moment neither is", () => {
      // The chain that actually occurs, and its floor: 3→4 lands ON the station, so it carries to 5;
      // 4→5 comes FROM the station, so it carries to 6; 5→6 touches the station at neither end and
      // is the last hop. Two carries, then it dies — matching the client's own `to === reson ||
      // from === reson` test exactly, which is the thing this vector is pinning down.
      const g = E.mkGame({ tonight: 23 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[4] = { id: 107, l: 2, r: 9, owner: "sky", by: "sky", age: 1 };
      slots[5] = { id: 107, l: 3, r: 9, owner: "sky", by: "sky", age: 1 };
      slots[6] = { id: 107, l: 3, r: 9, owner: "sky", by: "sky", age: 1 };
      slots[7] = { id: 107, l: 3, r: 3, owner: "sky", by: "sky", age: 1 }; // would fall too if it carried a third time
      const rr = E.resolve(g, slots, 106, 3, false, "you");
      return [4, 5, 6].every(k => rr.slots[k].owner === "you") && rr.slots[7].owner === "sky";
    }, true],
    ["the drum's law does NOT fire on a different mansion's night", () => {
      const g = E.mkGame({ tonight: 5 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[4] = { id: 107, l: 2, r: 9, owner: "sky", by: "sky", age: 1 };
      slots[5] = { id: 107, l: 3, r: 3, owner: "sky", by: "sky", age: 1 };
      const rr = E.resolve(g, slots, 106, 3, false, "you");
      return rr.slots[4].owner === "you" && rr.slots[5].owner === "sky";
    }, true],
    // THE WELL-ROPE (mansion 28, station 4) — what lodges there hauls one enemy neighbour in. Not a
    // strike: no faces are compared, so the deny rules never run.
    ["the rope: a lodge at the law station hauls one enemy neighbour in (mansion 28, station 4)", () => {
      const g = E.mkGame({ tonight: 28 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[3] = { id: 107, l: 9, r: 9, owner: "sky", by: "sky", age: 1 }; // unbeatable by faces; the rope takes it anyway
      const rr = E.resolve(g, slots, 107, 4, false, "you");
      return rr.slots[3].owner === "you";
    }, true],
    ["the rope hauls exactly ONE neighbour, checking -1 before +1", () => {
      const g = E.mkGame({ tonight: 28 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[3] = { id: 101, l: 9, r: 9, owner: "sky", by: "sky", age: 1 }; // saturn: locked to strikes, hauled regardless
      slots[5] = { id: 101, l: 9, r: 9, owner: "sky", by: "sky", age: 1 };
      const rr = E.resolve(g, slots, 107, 4, false, "you");
      return rr.slots[3].owner === "you" && rr.slots[5].owner === "sky";
    }, true],
    ["the rope leaves a friendly neighbour alone", () => {
      const g = E.mkGame({ tonight: 28 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[3] = { id: 107, l: 9, r: 9, owner: "you", by: "you", age: 1 };
      slots[5] = { id: 107, l: 9, r: 9, owner: "sky", by: "sky", age: 1 };
      const rr = E.resolve(g, slots, 107, 4, false, "you");
      return rr.slots[3].owner === "you" && rr.slots[5].owner === "you"; // the friendly one skipped, the enemy hauled
    }, true],
    ["the rope does NOT fire on a different mansion's night", () => {
      const g = E.mkGame({ tonight: 5 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[3] = { id: 107, l: 9, r: 9, owner: "sky", by: "sky", age: 1 };
      const rr = E.resolve(g, slots, 107, 4, false, "you");
      return rr.slots[3].owner === "sky";
    }, true],
    // GUEST-RIGHT (mansion 26, station 0) — the doorway strips its occupant's OWN quarter's grant.
    // All four, per the delivery's own engine-conformance note; the client strips byakko alone.
    ["guest-right strips byakko's ground-hold at the doorway (mansion 26, station 0)", () => {
      const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = 3;
      const g = E.mkGame({ tonight: 26, levels, grants: "all" });
      const slots = Array.from({ length: 9 }, () => null);
      // card 5 (blaze) is byakko and carries no deny rule of its own, so the tiger's grant is the
      // only thing that could hold this ground — card 1's gate would turn the first strike aside
      // and mask the result.
      slots[0] = { id: 5, l: 1, r: 1, owner: "sky", by: "sky", age: 1 };
      const rr = E.resolve(g, slots, 106, 1, false, "you"); // sun l=9 strikes leftward into station 0
      return g.C[5].grantOn === true && rr.slots[0].owner === "you";
    }, true],
    ["guest-right does not strip byakko's hold at any other station", () => {
      const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = 3;
      const g = E.mkGame({ tonight: 26, levels, grants: "all" });
      const slots = Array.from({ length: 9 }, () => null);
      slots[2] = { id: 5, l: 1, r: 1, owner: "sky", by: "sky", age: 1 };
      const rr = E.resolve(g, slots, 106, 1, false, "you");
      return rr.slots[2].owner === "sky";
    }, true],
    ["guest-right strips genbu's empty shell at the doorway", () => {
      const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = 3;
      const g = E.mkGame({ tonight: 26, levels, grants: "all" });
      const slots = Array.from({ length: 9 }, () => null);
      // card 22 (listener) is genbu and, standing alone with no neighbour, adds nothing of its own,
      // so its plain weight of 1 is a clean read on whether the shell swallowed it.
      slots[0] = { id: 22, l: 5, r: 5, owner: "you", by: "sky", age: 1 }; // it has changed hands
      const [you, sky] = E.counts(g, slots);
      return g.C[22].grantOn === true && you === 1 && sky === 0; // it counts, instead of counting for nobody
    }, true],
    ["guest-right strips suzaku's two-station reach when the bird lodges in the doorway", () => {
      const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = 3;
      const g = E.mkGame({ tonight: 26, levels, grants: "all" });
      const slots = Array.from({ length: 9 }, () => null);
      slots[2] = { id: 107, l: 1, r: 1, owner: "sky", by: "sky", age: 1 }; // two stations away: only the reach could touch it
      const rr = E.resolve(g, slots, 7, 0, false, "you"); // card 7 is suzaku
      return g.C[7].grantOn === true && rr.slots[2].owner === "sky";
    }, true],
    ["suzaku's reach still fires from any other station, at lodge time, with printed faces", () => {
      const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = 3;
      const g = E.mkGame({ tonight: 26, levels, grants: "all" });
      const slots = Array.from({ length: 9 }, () => null);
      slots[3] = { id: 107, l: 1, r: 1, owner: "sky", by: "sky", age: 1 };
      const rr = E.resolve(g, slots, 7, 1, false, "you");
      return rr.slots[3].owner === "you";
    }, true],
    ["guest-right strips seiryuu's either-way face: a guest cannot choose which way round it stands", () => {
      const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = 3;
      const g = E.mkGame({ tonight: 26, levels, grants: "all" });
      const slots = Array.from({ length: 9 }, () => null);
      const c = g.C[14]; // card 14 is seiryuu, and twoFaced comes from its grant
      const rr = E.resolve(g, slots, 14, 0, true, "you"); // asks to stand reversed
      const other = E.resolve(g, slots, 14, 1, true, "you"); // the same ask, one station along
      return c.twoFaced === true && rr.slots[0].l === c.l && other.slots[1].l === c.r;
    }, true],
    ["guest-right does NOT fire on a different mansion's night", () => {
      const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = 3;
      const g = E.mkGame({ tonight: 5, levels, grants: "all" });
      const slots = Array.from({ length: 9 }, () => null);
      slots[0] = { id: 5, l: 1, r: 1, owner: "sky", by: "sky", age: 1 };
      const rr = E.resolve(g, slots, 106, 1, false, "you");
      return rr.slots[0].owner === "sky"; // the tiger's ground still holds
    }, true],
    // THE STRANGER'S STATION (2 sep 2026) — mansion 27, station 4. The first law that reads the
    // GROUND it stands on, so these vectors pin the geography as hard as the arithmetic.
    ["the stranger's law: m27's window is door-first, so station 4 stands on mansion 3, tiger ground", () => {
      const g = E.mkGame({ tonight: 27 });
      return E.BOARD_OFF[27] === undefined && E.boardM(g, 4) === 3 && E.quadOf(3) === "byakko";
    }, true],
    ["the stranger's law: a card off its ground's quarter counts one more", () => {
      const g = E.mkGame({ tonight: 27 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[4] = { id: 21, l: 5, r: 5, owner: "you", by: "you", age: 1 }; // 21 is genbu on byakko ground
      const plain = E.mkGame({ tonight: 5 });
      const [you] = E.counts(g, slots), [youPlain] = E.counts(plain, slots);
      return you === youPlain + 1;
    }, true],
    ["the stranger's law: a card on its own quarter's ground counts as it always did", () => {
      const g = E.mkGame({ tonight: 27 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[4] = { id: 5, l: 5, r: 5, owner: "you", by: "you", age: 1 }; // 5 is byakko, and so is the ground
      const plain = E.mkGame({ tonight: 5 });
      return E.counts(g, slots)[0] === E.counts(plain, slots)[0];
    }, true],
    ["the stranger's law: both sides, not just the player's", () => {
      const g = E.mkGame({ tonight: 27 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[4] = { id: 21, l: 5, r: 5, owner: "sky", by: "sky", age: 1 };
      const plain = E.mkGame({ tonight: 5 });
      return E.counts(g, slots)[1] === E.counts(plain, slots)[1] + 1;
    }, true],
    ["the stranger's law: HER PLANETS ARE QUARTERLESS and take no bonus (quadOf's byakko catch-all would have made them tiger cards)", () => {
      const g = E.mkGame({ tonight: 27 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[4] = { id: 101, l: 5, r: 5, owner: "sky", by: "sky", age: 1 }; // saturn: no quarter at all
      const plain = E.mkGame({ tonight: 5 });
      // quadOf() used to answer "byakko" here, which is exactly how a planet became a tiger card.
      // It now answers null, so the law has nothing to compare and correctly does not apply.
      return E.quadOf(101) === null && E.counts(g, slots)[1] === E.counts(plain, slots)[1];
    }, true],
    ["the stranger's law: c.quad leads the fallback, so the ladder's mirror deck is not misread as tiger", () => {
      const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = 3;
      const baseC = E.cards({ levels, grants: "all" });
      const C = E.ladderOpponentCards(baseC, levels);
      // 214 mirrors card 14 (seiryuu). quadOf(214) knows nothing about mirror ids and answers null,
      // so c.quad must still lead the fallback — null would otherwise read as "no quarter" for a
      // card that certainly has one. The ordering is the fix; null is what makes it visible.
      return C[214] && C[214].quad === "seiryuu" && E.quadOf(214) === null;
    }, true],
    ["the stranger's law does not touch a neighbouring station", () => {
      const g = E.mkGame({ tonight: 27 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[3] = { id: 21, l: 5, r: 5, owner: "you", by: "you", age: 1 };
      const plain = E.mkGame({ tonight: 5 });
      return E.counts(g, slots)[0] === E.counts(plain, slots)[0];
    }, true],
    ["the stranger's law does NOT fire on a different mansion's night", () => {
      const g = E.mkGame({ tonight: 26 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[4] = { id: 21, l: 5, r: 5, owner: "you", by: "you", age: 1 };
      const plain = E.mkGame({ tonight: 5 });
      return E.counts(g, slots)[0] === E.counts(plain, slots)[0];
    }, true],
    ["THE TRAP: sliding m27's window four (the 'consistency' fix) inverts the law — the tiger becomes the stranger", () => {
      // Not a behaviour test: a guard on the constant. Design measured the slid form at byakko
      // +14.7 and spread 46.0 -> 59.6, a fail, and nearly shipped it by copying the other
      // station-4 laws. If someone adds BOARD_OFF[27] = 4 for tidiness, this vector fails loudly.
      const g = E.mkGame({ tonight: 27 });
      if (E.BOARD_OFF[27] !== undefined) return false;
      const slid = ((27 - 1 + 4 - 4 + 28) % 28) + 1; // what station 4 would stand on if slid
      return E.boardM(g, 4) === 3 && E.quadOf(3) === "byakko"
        && slid === 27 && E.quadOf(slid) === "genbu"; // the ground's quarter flips, so the law flips
    }, true],
    // THE TOLL (mansion 2, station 4) — sheltered ground pays a point. The vectors pin the denial
    // set, because "cannot be taken at all" is the whole law and it is assembled from two places.
    // NOTE ON FILLER, learned the hard way: sun(106)/moon(107) are the usual inert filler in these
    // vectors, but the toll and the crow both EXEMPT ids 101-107, so planet filler silently switches
    // the law off and the vector passes for the wrong reason (or fails confusingly). Both laws' tests
    // use level-1 mansion cards instead — abilities off, plain worth 1 — and avoid id === slot+1 so
    // no card lands on its own dominion.
    ["the toll: a card that cannot be taken counts one less (a crowned card here)", () => {
      const lv1 = {}; for (let i = 1; i <= 28; i++) lv1[i] = 1;
      const g = E.mkGame({ tonight: 2, levels: lv1 }), plain = E.mkGame({ tonight: 5, levels: lv1 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[4] = { id: 9, l: 5, r: 5, owner: "you", by: "you", age: 1, crowned: true };
      return E.shielded(g, slots, 4) === true
        && E.counts(g, slots)[0] === E.counts(plain, slots)[0] - 1;
    }, true],
    ["the toll: an ordinary takeable card pays nothing", () => {
      const lv1 = {}; for (let i = 1; i <= 28; i++) lv1[i] = 1;
      const g = E.mkGame({ tonight: 2, levels: lv1 }), plain = E.mkGame({ tonight: 5, levels: lv1 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[4] = { id: 9, l: 5, r: 5, owner: "you", by: "you", age: 1 };
      return E.counts(g, slots)[0] === E.counts(plain, slots)[0];
    }, true],
    ["the toll charges THE GATE, which shielded() alone would miss — and stops once the gate is spent", () => {
      const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = 3;
      const g = E.mkGame({ tonight: 2, levels });
      const fresh = Array.from({ length: 9 }, () => null);
      fresh[4] = { id: 1, l: 5, r: 5, owner: "you", by: "you", age: 1 }; // card 1 is the gate
      const spent = Array.from({ length: 9 }, () => null);
      spent[4] = { id: 1, l: 5, r: 5, owner: "you", by: "you", age: 1, gateUsed: true };
      // shielded() does NOT hold the gate in this module (it lives in tryFlip), so this is exactly
      // the case a shielded()-only predicate would under-charge.
      return E.shielded(g, fresh, 4) === false
        && E.tollOn(g, fresh, 4) === true && E.tollOn(g, spent, 4) === false;
    }, true],
    ["the toll: her planets are quarterless and pay nothing", () => {
      const g = E.mkGame({ tonight: 2 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[4] = { id: 101, l: 5, r: 5, owner: "sky", by: "sky", age: 1 };
      return E.tollOn(g, slots, 4) === false; // saturn is locked, but it is also a planet
    }, true],
    ["the toll does not charge a neighbouring station, and does not fire on another night", () => {
      const lv1 = {}; for (let i = 1; i <= 28; i++) lv1[i] = 1;
      const g = E.mkGame({ tonight: 2, levels: lv1 }), off = E.mkGame({ tonight: 5, levels: lv1 });
      const side = Array.from({ length: 9 }, () => null);
      side[3] = { id: 9, l: 5, r: 5, owner: "you", by: "you", age: 1, crowned: true };
      const at = Array.from({ length: 9 }, () => null);
      at[4] = { id: 9, l: 5, r: 5, owner: "you", by: "you", age: 1, crowned: true };
      return E.counts(g, side)[0] === E.counts(off, side)[0]   // wrong station: no charge
        && E.counts(off, at)[0] === 1;                          // wrong night: no charge
    }, true],
    // THE CROW (mansion 4, station 4) — a point MOVES from the richest neighbour to the perch.
    ["the crow: the perch counts one more and the richest neighbour one less — net zero", () => {
      const lv1 = {}; for (let i = 1; i <= 28; i++) lv1[i] = 1;
      const g = E.mkGame({ tonight: 4, levels: lv1 }), off = E.mkGame({ tonight: 5, levels: lv1 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[3] = { id: 9, l: 5, r: 5, owner: "you", by: "you", age: 1 };
      slots[4] = { id: 10, l: 5, r: 5, owner: "you", by: "you", age: 1 };
      const [lawYou] = E.counts(g, slots), [plainYou] = E.counts(off, slots);
      return lawYou === plainYou; // one side holds both: the point moves within the same total
    }, true],
    ["the crow: the perch really does gain, and the neighbour really does pay", () => {
      const lv1 = {}; for (let i = 1; i <= 28; i++) lv1[i] = 1;
      const g = E.mkGame({ tonight: 4, levels: lv1 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[3] = { id: 9, l: 5, r: 5, owner: "sky", by: "sky", age: 1 };
      slots[4] = { id: 10, l: 5, r: 5, owner: "you", by: "you", age: 1 };
      const [you, sky] = E.counts(g, slots);
      return you === 2 && sky === 0; // perch 1+1, the lone neighbour 1-1
    }, true],
    ["the crow charges the RICHER neighbour, not the nearer one", () => {
      const g = E.mkGame({ tonight: 4 });
      const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = 3;
      const g2 = E.mkGame({ tonight: 4, levels });
      const slots = Array.from({ length: 9 }, () => null);
      slots[3] = { id: 107, l: 5, r: 5, owner: "sky", by: "sky", age: 1 }; // plain worth 1
      slots[4] = { id: 107, l: 5, r: 5, owner: "you", by: "you", age: 1 };
      slots[5] = { id: 21, l: 5, r: 5, owner: "sky", by: "sky", age: 1 };  // district: worth 2
      return E.crowPays(g2, slots, 4, { noLaw: true }) === 5;
    }, true],
    ["the crow's tie goes NEARER THE DOOR (the lower index)", () => {
      const lv1 = {}; for (let i = 1; i <= 28; i++) lv1[i] = 1;
      const g = E.mkGame({ tonight: 4, levels: lv1 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[3] = { id: 9, l: 5, r: 5, owner: "sky", by: "sky", age: 1 };
      slots[4] = { id: 10, l: 5, r: 5, owner: "you", by: "you", age: 1 };
      slots[5] = { id: 11, l: 5, r: 5, owner: "sky", by: "sky", age: 1 };
      return E.slotW(g, slots, 3, { noLaw: true }).w === E.slotW(g, slots, 5, { noLaw: true }).w
        && E.crowPays(g, slots, 4, { noLaw: true }) === 3;
    }, true],
    ["the crow: a planet AT THE PERCH switches the whole law off, both clauses", () => {
      const lv1 = {}; for (let i = 1; i <= 28; i++) lv1[i] = 1;
      const g = E.mkGame({ tonight: 4, levels: lv1 }), off = E.mkGame({ tonight: 5, levels: lv1 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[3] = { id: 9, l: 5, r: 5, owner: "sky", by: "sky", age: 1 };
      slots[4] = { id: 101, l: 5, r: 5, owner: "sky", by: "sky", age: 1 }; // planet on the perch
      // Exempting only the +1 would DESTROY a point — the rear spout's measured failure shape.
      return E.counts(g, slots)[1] === E.counts(off, slots)[1];
    }, true],
    ["the crow: a planet BESIDE the perch is never the one charged", () => {
      const lv1 = {}; for (let i = 1; i <= 28; i++) lv1[i] = 1;
      const g = E.mkGame({ tonight: 4, levels: lv1 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[3] = { id: 101, l: 5, r: 5, owner: "sky", by: "sky", age: 1 }; // planet: never charged
      slots[4] = { id: 10, l: 5, r: 5, owner: "you", by: "you", age: 1 };
      slots[5] = { id: 11, l: 5, r: 5, owner: "sky", by: "sky", age: 1 };
      return E.crowPays(g, slots, 4, { noLaw: true }) === 5; // the further, non-planet one pays
    }, true],
    ["the crow's neighbour comparison is made on PLAIN worth and cannot recurse into its own law", () => {
      const lv1 = {}; for (let i = 1; i <= 28; i++) lv1[i] = 1;
      const g = E.mkGame({ tonight: 4, levels: lv1 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[4] = { id: 10, l: 5, r: 5, owner: "you", by: "you", age: 1 };
      slots[5] = { id: 11, l: 5, r: 5, owner: "sky", by: "sky", age: 1 };
      // slotW under noLaw must not apply the crow again to the neighbour it is pricing.
      return E.slotW(g, slots, 5, { noLaw: true }).w === 1;
    }, true],
    ["the crow does NOT fire on a different mansion's night", () => {
      const lv1 = {}; for (let i = 1; i <= 28; i++) lv1[i] = 1;
      const g = E.mkGame({ tonight: 5, levels: lv1 }), off = E.mkGame({ tonight: 6, levels: lv1 });
      const slots = Array.from({ length: 9 }, () => null);
      slots[3] = { id: 9, l: 5, r: 5, owner: "sky", by: "sky", age: 1 };
      slots[4] = { id: 10, l: 5, r: 5, owner: "you", by: "you", age: 1 };
      return E.counts(g, slots)[0] === E.counts(off, slots)[0];
    }, true],
    ["m2 slides its window, m4 deliberately does not (the crow was measured on the standard road)", () => {
      return E.BOARD_OFF[2] === 4 && E.BOARD_OFF[4] === undefined;
    }, true],
    ["quarterless is `id >= 101`, NOT the client's 101..107 — Uranus and Neptune are on her boss hand", () => {
      // The live client's mansion-boss hand is [101,102,103,104,105,108,109]. All four of its
      // quarterless guards test `101..107`, so 108/109 fall through and quadOf()'s byakko catch-all
      // then calls them tiger cards. Reported to Design 3 sep; this module must not inherit it.
      return E.isQuarterless(101) && E.isQuarterless(107)
        && E.isQuarterless(108) && E.isQuarterless(109)
        && !E.isQuarterless(28) && !E.isQuarterless(1)
        && E.quadOf(108) === null && E.quadOf(109) === null; // no catch-all left to mislabel them
    }, true],
  ];
  let fails = 0;
  VECTORS.forEach(([name, fn, want]) => {
    let got;
    try { got = fn(); } catch (e) { got = "THREW: " + e.message; }
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (!ok) fails++;
    console.log((ok ? "ok  " : "FAIL") + " - " + name + (ok ? "" : " (want " + JSON.stringify(want) + ", got " + JSON.stringify(got) + ")"));
  });
  console.log(fails ? fails + " failing" : "all " + VECTORS.length + " pass");
  process.exitCode = fails ? 1 : 0;
}
