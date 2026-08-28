// 28 aug 2026 pt.3 — validates searchMove()/playMatchSearch() against the external report's
// "opponent thinking depth, careful player, mirror deck" table. This is the core empirical claim
// pt.3 rests on (depth, not deck-scale, drives difficulty); re-run after touching searchMove(),
// BEAM, or ladderOpponentCards() before trusting a new result. ~25 matches/cell took about 15
// minutes on this machine (depth-8 search is genuinely expensive — see manzil-engine-current.cjs's
// BEAM comment) — lower N trades accuracy for speed if you just need a smoke check.
const E = require("./manzil-engine-current.cjs");

function levelsFor(awake) {
  const levels = {};
  for (let i = 1; i <= 28; i++) levels[i] = i <= awake ? 3 : 1;
  return levels;
}

// report's "opponent thinking depth, careful player, mirror deck" table (d0 and d8 columns)
const TIERS = [
  ["fresh", 6, 63.3, 49.2],
  ["a month", 14, 66.7, 55.8],
  ["a season", 21, 84.2, 50.0],
  ["deep", 28, 80.0, 60.0],
];

const N = process.argv[2] ? +process.argv[2] : 25;
console.log(`${N} matches a cell, mirror deck (handicap 0), youDepth=8 (careful)\n`);
console.log("tier         d0 win%  (report)   d8 win%  (report)");
for (const [name, awake, reportD0, reportD8] of TIERS) {
  const levels = levelsFor(awake);
  const baseC = E.cards({ levels });
  const opp = E.handicapLevels(levels, 0); // mirror, handicap 0
  const C = E.ladderOpponentCards(baseC, opp);
  const rates = {};
  for (const depth of [0, 8]) {
    let w = 0;
    for (let s = 0; s < N; s++) {
      const r = E.playMatchSearch({ C, format: "walker", leader: s % 2 ? "you" : "sky", pack: null, skyPack: E.SHADOW_PACK, seed: 9000 + s, youDepth: 8, skyDepth: depth });
      if (r.winner === "you") w++;
    }
    rates[depth] = (100 * w / N).toFixed(1);
  }
  console.log(`  ${name.padEnd(10)} ${rates[0].padStart(5)}%  (${reportD0}%)     ${rates[8].padStart(5)}%  (${reportD8}%)`);
}
