const A = require("./manzil-engine-v6-AUG24.js");
const cases = JSON.parse(require("fs").readFileSync(process.argv[2], "utf8"));
const out = cases.map(c => {
  const C = A.makeCards({ lvl: 2 });
  const r = A.playBoard({ C, tonight: c.tonight, you: c.you, sky: c.sky,
                          leader: c.leader, depth: c.depth, youDepth: c.youDepth });
  return { win: r.winner, you: r.you, sky: r.sky, flips: r.flips };
});
console.log(JSON.stringify(out));
