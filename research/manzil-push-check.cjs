// 28 aug 2026 pt.3 — validates playPush() against the external report's "what this does to the
// wipe" table (careful clears a push, three lives, by collection band). SUPERSEDES the pt.2
// comparison this file used to run (deck-scale-only ladder, since replaced — see
// manzil-engine-current.cjs's header on handicapFor()/depthsFor() for why).
//
// Performance note: playPush() now runs a real depth-limited search (searchMove(), up to depth 8
// at the deep-collection bands) instead of the old fixed heuristic. That's MUCH slower — a single
// depth-8 board can take several seconds — so the default N here is deliberately small (20, not
// pt.2's 150). Increase it via `node manzil-push-check.cjs <N>` if you have the time; a companion
// per-match check (not a push-level one) ran 25 matches/cell in about 15 minutes and landed within
// roughly 3-16 points of the report's own "opponent thinking depth, mirror deck" table at every
// cell — well within the noise band a sample that small implies (~10pp standard error at p~0.5,
// n=25), unlike pt.2's ladder, which was off by ~80 points in a way sample size could not explain.
// Not a pass/fail assertion — read this as "same ballpark," not "must match exactly."
const E = require("./manzil-engine-current.cjs");

function levelsFor(awake) {
  const levels = {};
  for (let i = 1; i <= 28; i++) levels[i] = i <= awake ? 3 : 1;
  return levels;
}

// report's "what this does to the wipe" table: careful clears a push, three lives, by band
const TIERS = [
  ["0-8 awake (fresh)", 6, 61.7],
  ["9-14 awake", 12, 37],
  ["15-21 awake", 18, 22],
  ["22-28 awake (full)", 26, 11.9],
];

const N = process.argv[2] ? +process.argv[2] : 20;
console.log(`${N} independent pushes a tier (this will take a while — playPush() now runs real search)\n`);
console.log("tier                  clear%  (report)   avg boards");
for (const [name, awake, reportPct] of TIERS) {
  const levels = levelsFor(awake);
  let clears = 0, totalBoards = 0;
  for (let s = 0; s < N; s++) {
    const r = E.playPush({ playerLevels: levels, seed: 100000 + s });
    if (r.cleared) clears++;
    totalBoards += r.boardsPlayed;
  }
  const pct = (100 * clears / N).toFixed(1);
  console.log(`  ${name.padEnd(20)} ${pct.padStart(5)}%  (${reportPct}%)    ${(totalBoards / N).toFixed(1).padStart(5)}`);
}
