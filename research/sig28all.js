// updated 28 aug 2026 to run against research/manzil-engine-current.cjs (the canonical port of
// V1's live engine) — the old target, manzil-engine-v7-tiebreak.js, predated the 27 aug rewrite
// and has been deleted. See that file's header for what "current" means and what it deliberately
// doesn't port (road-mode grounds, the build/currency system, per-birth-chart dominion).
const E = require("./manzil-engine-current.cjs");
const CHART5 = [5, 6, 10, 17, 18];
function rng(s) { let h = (s ^ 2166136261) >>> 0; return () => { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; }; }
// X sits in HER hand with four asleep companions, so X's signature is the only variable.
function test(X, awake, trials) {
  const levels = {}; for (let i = 1; i <= 28; i++) levels[i] = 2; // baseline: every card's own signature awake
  const C = E.cards({ levels });
  for (let i = 1; i <= 28; i++) C[200 + i] = { ...C[i], id: 200 + i, who: "sky", lvl: 1, ab: null, twoFaced: false, homeM: i };
  if (awake) C[200 + X] = { ...C[200 + X], lvl: 2, ab: C[X].ab, twoFaced: C[X].twoFaced };
  let w = 0, t = 0;
  for (let tr = 0; tr < trials; tr++) {
    const r0 = rng(X * 104729 + tr * 7919);
    const others = Array.from({ length: 28 }, (_, i) => i + 1).filter(x => x !== X);
    for (let i = others.length - 1; i > 0; i--) { const j = Math.floor(r0() * (i + 1)); [others[i], others[j]] = [others[j], others[i]]; }
    const skyHand = [200 + X, ...others.slice(0, 4).map(x => 200 + x)];
    const r1 = rng(9001 + tr * 7919);
    const rest = Array.from({ length: 28 }, (_, i) => i + 1).filter(x => !CHART5.includes(x));
    for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(r1() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
    const pack = CHART5.concat(rest.slice(0, 2));           // a pack of seven, the new starter
    for (let n = 1; n <= 28; n++) for (const L of ["you", "sky"]) {
      const h2 = E.deal(pack, 7000 + tr * 100 + n, n);
      const r = E.playBoard({ C, you: h2.slice(), sky: skyHand.slice(), leader: L });
      t++; if (r.winner === "you") w++;
    }
  }
  return { win: 100 * w / t, n: t };
}
const TR = 14;   // 784 boards a cell
const nm = E.cards({});
const rows = [];
for (let X = 1; X <= 28; X++) {
  const a = test(X, false, TR), b = test(X, true, TR);
  const d = a.win - b.win;
  const se = Math.sqrt(a.win * (100 - a.win) / a.n + b.win * (100 - b.win) / b.n);
  rows.push({ id: X, name: nm[X].name, ab: nm[X].ab, asleep: a.win, awake: b.win, worth: d, sig: Math.abs(d) > 1.96 * se });
}
require("fs").writeFileSync("sig28-all.json", JSON.stringify(rows, null, 1));
rows.sort((a, b) => b.worth - a.worth);
console.log("ALL 28 SIGNATURES, measured one at a time (784 boards a cell, ~3.5pp noise)\n");
console.log("  #  card                 asleep  awake   worth   verdict");
for (const r of rows) {
  const v = !r.sig ? "INERT" : r.worth > 0 ? "works" : "HURTS ITS HOLDER";
  console.log(`  ${String(r.id).padStart(2)}  ${r.name.padEnd(20)} ${r.asleep.toFixed(1).padStart(6)} ${r.awake.toFixed(1).padStart(6)}  ${(r.worth >= 0 ? "+" : "")}${r.worth.toFixed(1).padStart(5)}   ${v}`);
}
const works = rows.filter(r => r.sig && r.worth > 0).length, inert = rows.filter(r => !r.sig).length, bad = rows.filter(r => r.sig && r.worth < 0).length;
console.log(`\n  ${works} work · ${inert} inert · ${bad} hurt their holder`);
