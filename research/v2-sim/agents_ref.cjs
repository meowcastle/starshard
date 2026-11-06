// agents_ref.js: the v6 JS reference's answers for the three agent vectors
// (youMove, skyMove, playBoard), written to vectors_agents.json for vectors_agents.py.
//
//     node research/v2-sim/agents_ref.cjs
//
// Positions are scripted with resolve (itself covered by the 33 vectors), never with an
// agent, so each vector tests one agent and not the other. Every card owned at level 2
// (makeCards({lvl:2}), the bands' table), the twelve dealt with seed = night, her hand
// Saturn to Jupiter.
const path = require("path"), fs = require("fs");
// the repo's package.json is "type": "module", so the engine is loaded by hand as CommonJS
const src = fs.readFileSync(path.join(__dirname, "base", "manzil-engine-v6.js"), "utf8");
const mod = { exports: {} }; new Function("module", "exports", src)(mod, mod.exports);
const E = mod.exports;
const TWELVE = [6, 10, 17, 18, 5, 4, 3, 19, 7, 26, 12, 14], SKY = [101, 102, 103, 104, 105];
const mv = m => m ? `${m.id}@${m.i}${m.rev ? "r" : ""}:${m.score}` : "none";

function scripted(C, n) {
  // you: hand[0]; sky: Saturn; you: hand[1]; each at a slot from the night, next free if taken
  const hand = E.deal(TWELVE, n, n, true);
  const g = E.mkGame({ C, you: hand, sky: SKY, tonight: n, leader: "you", depth: 8 });
  g.youDepth = 8;
  const place = (id, side, pref) => {
    let i = pref; while (g.slots[i]) i = (i + 1) % 9;
    const r = E.resolve(g, g.slots, id, i, false, side);
    g.slots = r.slots;
    if (side === "you") g.you = g.you.filter(x => x !== id); else g.sky = g.sky.filter(x => x !== id);
    if (r.ret && r.ret.length) { g.you = g.you.concat(r.ret); g.retUsed = true; }
  };
  place(hand[0], "you", (n * 2) % 9);
  place(101, "sky", (n * 5 + 1) % 9);
  place(hand[1], "you", (n * 7 + 2) % 9);
  return g;
}

const C = E.makeCards({ lvl: 2 });
const you = [], sky = [], board = [];
for (let n = 1; n <= 28; n++) {
  let g = scripted(C, n);
  g.youDepth = 8; const a = E.youMove(g); g.youDepth = 0; const b = E.youMove(g);
  you.push(`n${n}=${mv(a)}/${mv(b)}`);
  g = scripted(C, n);
  g.depth = 8; const c = E.skyMove(g); g.depth = 0; const d = E.skyMove(g);
  sky.push(`n${n}=${mv(c)}/${mv(d)}`);
  const hand = E.deal(TWELVE, n, n, true), cells = [];
  for (const leader of ["you", "sky"]) for (const youDepth of [8, 0]) {
    const r = E.playBoard({ C, you: hand.slice(), sky: SKY.slice(), tonight: n, leader, depth: 8, youDepth });
    cells.push(`${r.winner} ${r.you}-${r.sky} f${r.flips}`);
  }
  board.push(`n${n}=${cells.join(",")}`);
}
const out = {
  source: "base/manzil-engine-v6.js", made: new Date().toISOString().slice(0, 10),
  config: "makeCards({lvl:2}); twelve [6,10,17,18,5,4,3,19,7,26,12,14] dealt with seed = night; sky 101..105; scripted: hand[0]@(2n%9), Saturn@((5n+1)%9), hand[1]@((7n+2)%9), next free if taken",
  youMove: you.join(";"), skyMove: sky.join(";"), playBoard: board.join(";"),
};
fs.writeFileSync(path.join(__dirname, "vectors_agents.json"), JSON.stringify(out, null, 1) + "\n");
console.log("vectors_agents.json: youMove %d nights, skyMove %d nights, playBoard %d nights x 4 cells", you.length, sky.length, board.length);
