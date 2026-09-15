// A differential case set built to FAIL LOUDLY on seat-asymmetry bugs.
//
// Why this exists. bec8406's return-routing bug survived a differential run because that run
// used single-player-shaped hands — sky = the five fixed planets — which structurally cannot
// hold a "return"-ability card. No number of trials would have exposed it. Measured, level 2,
// pre-merge engine vs fixed engine, same 400 boards:
//
//     sky = the five planets     0/400   0.0%   <- structurally blind
//     general PvP-shaped         6/400   1.5%
//     seat-dense (this file)    15/400   3.8%
//
// So a clean differential is only as good as the hands it deals. Two rules follow:
//   1. never run a differential on planets-only sky hands alone
//   2. when reporting "N/N identical", say WHICH case file produced it
//
// The ten owner-relative abilities below are the ones the 24 August fix had to make seat-aware.
// Each is a place a "you"-hardcode can hide, and four such bugs have been found so far.
const OWNER_RELATIVE = {
  1: "gate", 2: "bearer", 5: "blaze", 7: "return", 8: "ghost",
  9: "glance", 12: "turning", 18: "heart", 22: "listener", 26: "chamber",
};
const IDS = Object.keys(OWNER_RELATIVE).map(Number);
const ALL = Array.from({ length: 28 }, (_, i) => i + 1);
const N = Number(process.argv[2] || 1500);

function rng(s) { let h = (s ^ 2166136261) >>> 0; return () => { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h >>>= 0; h ^= h << 5; h >>>= 0; return h / 4294967296; }; }

const cases = [];
const r = rng(20260826);
for (let n = 0; n < N; n++) {
  const pool = ALL.slice();
  const take = (arr) => arr.splice(Math.floor(r() * arr.length), 1)[0];
  const draw = (from) => { const v = take(from); const k = pool.indexOf(v); if (k >= 0) pool.splice(k, 1); return v; };

  // every board puts two owner-relative cards in EACH hand, so a seat bug has somewhere
  // to surface on both sides rather than only the player's.
  const rel = IDS.slice();
  const you = [draw(rel), draw(rel)];
  const sky = [draw(rel), draw(rel)];
  while (you.length < 6) you.push(take(pool));
  while (sky.length < 6) sky.push(take(pool));

  // half the boards put tonight's mansion in a hand, so home-gated abilities
  // (the return, the blaze, the heart) actually reach their condition.
  let tonight = 1 + Math.floor(r() * 28);
  if (r() < 0.5) {
    const held = (r() < 0.5 ? you : sky).filter(x => OWNER_RELATIVE[x]);
    if (held.length) tonight = held[Math.floor(r() * held.length)];
  }

  const d = [0, 4, 8][Math.floor(r() * 3)];
  cases.push({ tonight, you, sky, leader: r() < 0.5 ? "you" : "sky", depth: d === 0 ? 8 : d, youDepth: d });
}

require("fs").writeFileSync(__dirname + "/cases-seat.json", JSON.stringify(cases));
console.log("wrote " + cases.length + " boards to cases-seat.json");
console.log("  sky holds an owner-relative card: " + cases.filter(c => c.sky.some(id => OWNER_RELATIVE[id])).length + "/" + cases.length);
console.log("  tonight's mansion is in a hand:   " + cases.filter(c => c.sky.includes(c.tonight) || c.you.includes(c.tonight)).length + "/" + cases.length);
