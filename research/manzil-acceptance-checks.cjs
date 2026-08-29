// 28 aug 2026 — the external report's seven acceptance checks, run against the canonical engine
// (research/manzil-engine-current.cjs) BEFORE the ladder is ported into the live .dc.html, so any
// wiring bug is caught here where it's cheap, not after the port. Re-run this same file against
// whatever the live file's ladder implementation becomes once it exists, per the report's own
// point: "That is an easy divergence to create when two board functions exist side by side."
//
// Revised 28 aug 2026 (round 2), after: (a) the seat-gap investigation found the ~40-point
// decisive-board lead/follow gap is inherent to the base ruleset (last-placement advantage on a
// 9-station road), independently confirmed on this engine by comparing bestMove() against a
// uniform-random mover — NOT a bug in the ladder, and not fixable by touching the tie rule; (b)
// the sim side corrected check 7 from a single point target to a per-collection BAND, since the
// seat gap is dominated by collection depth (fresh ~1, deep ~27), not by anything the ladder wires
// right or wrong; (c) quadrant grants are now wired into ladderOpponentCards() — baseC is built
// with grants:"all" throughout this file to actually exercise that path.
const E = require("./manzil-engine-current.cjs");

function report(name, ok, detail) {
  console.log((ok ? "PASS" : "FAIL") + " - " + name + (detail ? "  (" + detail + ")" : ""));
}

console.log("=== the four cheap checks ===\n");

// 1. mirror-is-mirror: fully levelled collection (all 28 @ 3, grants on), handicap 0 -> opponent
//    identical to the player's deck on faces, signature, grant.
(function check1() {
  const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = 3;
  const baseC = E.cards({ levels, grants: "all" });
  const opp = E.handicapLevels(levels, E.handicapFor(28)); // handicapFor(28) should be 0
  const C = E.ladderOpponentCards(baseC, opp);
  let facesMatch = true, sigMatch = true, grantCount = 0;
  for (let i = 1; i <= 28; i++) {
    const you = baseC[i], sky = C[200 + i];
    if (you.l !== sky.l || you.r !== sky.r) facesMatch = false;
    if (you.ab !== sky.ab) sigMatch = false;
    if (sky.grantOn) grantCount++;
  }
  report("1. faces match on all 28", facesMatch);
  report("1. signatures match on all 28", sigMatch);
  report("2. grant count on a fully mirrored opponent", grantCount === 28, "got " + grantCount + "/28");
})();

// 3. does caution reach the evaluator? same seed/hands/leader, caution 0 vs 8, sequences must differ
(function check3() {
  const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = 3;
  const baseC = E.cards({ levels, grants: "all" });
  const opp = E.handicapLevels(levels, 0);
  const C = E.ladderOpponentCards(baseC, opp);
  const you = E.deal(null, 7, 7), sky = E.deal(E.SHADOW_PACK, 8, 7);
  const seqOf = (caution) => {
    const r = E.playBoardWeighted({ C, you: you.slice(), sky: sky.slice(), leader: "you", seed: 7, youCaution: caution, skyCaution: caution });
    return r.slots.map(s => s ? s.id : null).join(",");
  };
  const s0 = seqOf(0), s8 = seqOf(8);
  report("3. caution 0 vs caution 8 produce different move sequences", s0 !== s8, s0 === s8 ? "IDENTICAL — replyCost isn't reaching bestMove" : "sequences differ as expected");
})();

// 4. handicap knockdown count for a fresh (6-awake) collection
(function check4() {
  const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = i <= 6 ? 3 : 1; // 6 awake
  const handicap = E.handicapFor(E.awakeCount(levels));
  const opp = E.handicapLevels(levels, handicap);
  const level1Count = Object.values(opp).filter(l => l === 1).length;
  report("4. handicap for 6 awake", handicap === 0.75, "got " + handicap);
  report("4. level-1 count in the opponent deck", level1Count === 26 || level1Count === 27, "got " + level1Count + "/28, expected 26 or 27");
})();

console.log("\n=== the three short runs ===\n");

// 5. the acceptance table — TRUE MIRROR opponent (handicap 0), grants on, only caution varies.
//    player caution fixed at 8 ("careful"). best-of-three, player leads. 120 matches/cell.
const TIERS5 = [
  ["fresh: sun 3 / planets 2 / rest 1", () => {
    const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = 1;
    levels[1] = 3; [2, 3, 4, 5].forEach(id => levels[id] = 2); // sun's mansion + its 4 companions
    return levels;
  }, { 0: 63.3, 4: 47.5, 8: 49.2 }],
  ["a month: ten at 2", () => {
    const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = i <= 10 ? 2 : 1;
    return levels;
  }, { 0: 66.7, 4: 53.3, 8: 55.8 }],
  ["a season: ten at 3, ten at 2", () => {
    const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = i <= 10 ? 3 : i <= 20 ? 2 : 1;
    return levels;
  }, { 0: 84.2, 4: 60.0, 8: 50.0 }],
  ["deep: all at 3", () => {
    const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = 3;
    return levels;
  }, { 0: 80.0, 4: 65.0, 8: 60.0 }],
];
const N5 = process.argv[2] ? +process.argv[2] : 120;
console.log(N5 + " matches a cell, mirror opponent, grants on, player caution 8, best of three, player leads\n");
const table = [];
for (const [name, mkLevels, targets] of TIERS5) {
  const levels = mkLevels();
  const baseC = E.cards({ levels, grants: "all" });
  const opp = E.handicapLevels(levels, 0); // mirror, per the check's own spec
  const C = E.ladderOpponentCards(baseC, opp);
  const row = {};
  for (const caution of [0, 4, 8]) {
    let w = 0;
    for (let s = 0; s < N5; s++) {
      const r = E.playMatchWeighted({ C, format: "walker", leader: "you", pack: null, skyPack: E.SHADOW_PACK, seed: 20000 + s, youCaution: 8, skyCaution: caution });
      if (r.winner === "you") w++;
    }
    row[caution] = 100 * w / N5;
  }
  table.push([name, row, targets]);
  const within = c => Math.abs(row[c] - targets[c]) <= 9;
  console.log("  " + name);
  console.log("    caution 0: " + row[0].toFixed(1) + "%  (target " + targets[0] + "%, " + (within(0) ? "within ±9" : "MISS") + ")");
  console.log("    caution 4: " + row[4].toFixed(1) + "%  (target " + targets[4] + "%, " + (within(4) ? "within ±9" : "MISS") + ")");
  console.log("    caution 8: " + row[8].toFixed(1) + "%  (target " + targets[8] + "%, " + (within(8) ? "within ±9" : "MISS") + ")");
}
console.log();
for (const [name, row] of table) {
  const monotone = row[0] >= row[4] && row[4] >= row[8];
  report("5. monotone (falls left to right) — " + name, monotone, "0=" + row[0].toFixed(1) + " 4=" + row[4].toFixed(1) + " 8=" + row[8].toFixed(1));
}
const freshSpread = table[0][1][0] - table[0][1][8];
const seasonSpread = table[2][1][0] - table[2][1][8];
report("5. fresh row flat, season row steep (spreads should differ meaningfully)", Math.abs(freshSpread - seasonSpread) > 5,
  "fresh spread=" + freshSpread.toFixed(1) + " season spread=" + seasonSpread.toFixed(1));

// 6. level-board canary: 9-14% of boards should end level, across a mixed batch
(function check6() {
  const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = i <= 14 ? 2 : 1;
  const baseC = E.cards({ levels, grants: "all" });
  const opp = E.handicapLevels(levels, E.handicapFor(E.awakeCount(levels)));
  const C = E.ladderOpponentCards(baseC, opp);
  const N = 300;
  let level = 0;
  for (let s = 0; s < N; s++) {
    const you = E.deal(null, 30000 + s, 7), sky = E.deal(E.SHADOW_PACK, 40000 + s, 7);
    const r = E.playBoardWeighted({ C, you, sky, leader: s % 2 ? "you" : "sky", seed: 30000 + s, youCaution: 8, skyCaution: 8, tieRule: "a draw" });
    // tieRule "a draw" makes a level board identifiable as boardWinner()==="draw" without the
    // defender rule resolving it away — the canary is about DETECTION, not the shipped resolution.
    if (r.winner === "draw") level++;
  }
  const pct = 100 * level / N;
  report("6. level-board rate", pct >= 9 && pct <= 14, pct.toFixed(1) + "% of " + N + " boards, expected 9-14%");
})();

// 7. REVISED (round 2) — the seat gap is dominated by collection depth, so this is a band per
// collection, not one point target. Also carries the level-board-assignment column, which IS a
// clean pass/fail wiring check (0% to the leader, 100% to the follower, so it averages to 50.0).
(function check7() {
  const N = 300;
  function run(levels) {
    const baseC = E.cards({ levels, grants: "all" });
    const opp = E.handicapLevels(levels, 0); // mirror
    const C = E.ladderOpponentCards(baseC, opp);
    function stats(leader) {
      let w = 0, level = 0, levelToYou = 0;
      for (let s = 0; s < N; s++) {
        const you = E.deal(null, 50000 + s, 7), sky = E.deal(E.SHADOW_PACK, 60000 + s, 7);
        const g = E.mkGame({ C, you, sky, leader, tieRule: "the defender" });
        let guard = 0;
        while (g.slots.some(x => !x) && (g.you.length || g.sky.length) && guard++ < 20) {
          const side = g.turn, hand = side === "you" ? g.you : g.sky;
          if (!hand.length) { g.turn = side === "you" ? "sky" : "you"; continue; }
          const mv = E.bestMove(g, g.slots, hand, side, 8);
          if (!mv) { g.turn = side === "you" ? "sky" : "you"; continue; }
          g.slots = mv.r.slots; g[side] = hand.filter(id => id !== mv.id); g.turn = side === "you" ? "sky" : "you";
        }
        const [y, k] = E.counts(g, g.slots);
        if (y === k) { level++; if (E.boardWinner(g, g.slots) === "you") levelToYou++; continue; }
        if (y > k) w++;
      }
      return { rate: 100 * w / N, levelPct: level ? 100 * levelToYou / level : null };
    }
    const lead = stats("you"), follow = stats("sky");
    return { gap: lead.rate - follow.rate, leadRate: lead.rate, followRate: follow.rate, levelToYouAvg: (lead.levelPct + follow.levelPct) / 2, leadLevelPct: lead.levelPct, followLevelPct: follow.levelPct };
  }
  const freshLevels = {}; for (let i = 1; i <= 28; i++) freshLevels[i] = 1;
  freshLevels[1] = 3; [2, 3, 4, 5].forEach(id => freshLevels[id] = 2);
  const deepLevels = {}; for (let i = 1; i <= 28; i++) deepLevels[i] = 3;

  const fresh = run(freshLevels), deep = run(deepLevels);
  console.log("  fresh: gap=" + fresh.gap.toFixed(1) + " (target <5)   lead=" + fresh.leadRate.toFixed(1) + "% follow=" + fresh.followRate.toFixed(1) + "%   level-to-you: leading=" + fresh.leadLevelPct.toFixed(1) + "% following=" + fresh.followLevelPct.toFixed(1) + "% avg=" + fresh.levelToYouAvg.toFixed(1));
  console.log("  deep:  gap=" + deep.gap.toFixed(1) + " (target 22-32) lead=" + deep.leadRate.toFixed(1) + "% follow=" + deep.followRate.toFixed(1) + "%   level-to-you: leading=" + deep.leadLevelPct.toFixed(1) + "% following=" + deep.followLevelPct.toFixed(1) + "% avg=" + deep.levelToYouAvg.toFixed(1));
  report("7. fresh collection gap under 5", fresh.gap < 5, "got " + fresh.gap.toFixed(1));
  report("7. deep collection gap in 22-32", deep.gap >= 22 && deep.gap <= 32, "got " + deep.gap.toFixed(1));
  report("7. level-board-to-you wiring (0% leading, 100% following, both cells)", fresh.leadLevelPct === 0 && fresh.followLevelPct === 100 && deep.leadLevelPct === 0 && deep.followLevelPct === 100,
    "fresh: " + fresh.leadLevelPct + "/" + fresh.followLevelPct + "  deep: " + deep.leadLevelPct + "/" + deep.followLevelPct);
})();
