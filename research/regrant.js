// updated 28 aug 2026 to run against research/manzil-engine-current.cjs (the canonical port of
// V1's live engine) — the old baseline row's target, manzil-engine-v7-tiebreak.js, predated the
// 27 aug rewrite and has been deleted.
//
// THREE OF THE FOUR ORIGINAL ROWS ARE STILL UNRUNNABLE, on purpose, not by oversight: this script
// used to A/B the shipped "home only" byakko/suzaku grant limiter against three alternative
// designs ("while young", "once a board", "no limit"), each living in its own engine fork
// (eng-young.js / eng-once.js / eng-open.js). None of those three files ever existed in this repo
// (they were untracked local scratch, already gone before the 28 Aug cleanup) and the current
// engine only implements the shipped "home only" behavior (cards()'s `grantOn` is all-or-nothing,
// gated by cfg.grants, not by a per-limiter-design switch) — see manzil-engine-current.cjs's
// header. Recreating the other three would mean inventing three new rule variants from scratch,
// which is a real game-design call, not a plumbing fix — flagging it rather than guessing. Only
// the shipped row runs below; ask before rebuilding the other three.
const E = require("./manzil-engine-current.cjs");
const CHART5 = [5, 6, 10, 17, 18], SKY = [101, 102, 103, 104, 105];
function rng(s) { let h = (s ^ 2166136261) >>> 0; return () => { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; }; }
const Q = E.QUADRANT;
function cardsFor(pack, l3) {
  const levels = {};
  for (const id of pack) levels[id] = l3.includes(id) ? 3 : (CHART5.includes(id) ? 2 : 1);
  const C = E.cards({ levels, grants: "all" }); // grants:"all" turns grantOn on wherever lvl>=2 would show a signature
  for (let i = 1; i <= 28; i++) if (!pack.includes(i)) C[i] = { ...C[i], lvl: 1, ab: null, twoFaced: false, grantOn: false };
  for (const id of pack) if (levels[id] === 1) C[id] = { ...C[id], lvl: 1, ab: null, twoFaced: false, grantOn: false };
  return C;
}
function run(sel, youReplyWeight, TR) {
  let w = 0, t = 0, fl = 0;
  for (let tr = 0; tr < TR; tr++) {
    const r0 = rng(4711 + tr * 7919);
    const rest = Array.from({ length: 28 }, (_, i) => i + 1).filter(x => !CHART5.includes(x));
    for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(r0() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
    const pack = CHART5.concat(rest.slice(0, 7));   // a twelve, mid game
    const C = cardsFor(pack, pack.filter(sel));
    for (let n = 1; n <= 28; n++) for (const L of ["you", "sky"]) {
      const hand = E.deal(pack, 7000 + tr * 100 + n, n);
      const r = E.playBoard({ C, you: hand.slice(), sky: SKY.slice(), leader: L, youReplyWeight });
      t++; fl += r.flips; if (r.winner === "you") w++;
    }
  }
  return { win: +(100 * w / t).toFixed(1), flips: +(fl / t).toFixed(2) };
}
const TR = 14, none = () => false, only = nm => id => Q[id] && Q[id].nm === nm;
// youReplyWeight 8 vs 0 stands in for the old depth/youDepth "careful vs casual player" dial —
// the current engine always looks two-ply ahead by default, gated by this weight instead.
const b = run(none, 8, TR), bc = run(none, 0, TR);
const g = run(only("byakko"), 8, TR), gc = run(only("byakko"), 0, TR);
const s = run(only("suzaku"), 8, TR), sc = run(only("suzaku"), 0, TR);
console.log("GRANT LIMITER CHECK — pack of twelve, 784 boards a cell\n");
console.log("limiter              guard worth  gap   flips    strike worth  gap   flips");
console.log(`  ${"home (shipped)".padEnd(18)} ${(g.win - b.win >= 0 ? "+" : "")}${(g.win - b.win).toFixed(1).padStart(5)}     ${(g.win - b.win - (gc.win - bc.win)).toFixed(1).padStart(5)}  ${g.flips.toFixed(2)}      ${(s.win - b.win >= 0 ? "+" : "")}${(s.win - b.win).toFixed(1).padStart(5)}     ${(s.win - b.win - (sc.win - bc.win)).toFixed(1).padStart(5)}  ${s.flips.toFixed(2)}`);
console.log("\n  (baseline gap and flips for reference are in the first row's own run)");
console.log("\n  \"while young\" / \"once a board\" / \"no limit\" rows: SKIPPED — their engine forks");
console.log("  don't exist in this repo. See this file's header before rebuilding them.");
