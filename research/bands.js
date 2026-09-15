// BANDS on the rebased engine (generation D). Careful vs casual, both levels, both rankings.
const E = require("/tmp/now2/ref.js");
const fs = require("fs");

const D = JSON.parse(fs.readFileSync("/tmp/now2/sig28-D.json", "utf8"));
const OLD = JSON.parse(fs.readFileSync("/tmp/sim/cardstrength.json", "utf8"));

// ranking A: the stale one ladder-spec.js currently uses (generation B)
const RANK_STALE = Array.from({length:28},(_,i)=>i+1).sort((a,b)=>OLD.awake[a].strong-OLD.awake[b].strong);
// ranking B: rebuilt from the generation-D measurement. strongest-for-her first.
const worth = {}; for (const r of D) worth[r.id] = r.worth;
const RANK_FRESH = Array.from({length:28},(_,i)=>i+1).sort((a,b)=>worth[b]-worth[a]);

const HAND_SIZE = {1:5, 2:6};
const RUNG = [[0,0],[1,0],[1,1],[2,1],[2,2],[3,2],[3,3],[4,4],[9,9]];

function hash(a,b,c){let h=(a*73856093 ^ b*19349663 ^ c*83492791)>>>0;
  h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h>>>0;}

function buildHand(RANK, mansion, level, rung){
  const STRONG = RANK.slice(0,10), WEAK = RANK.slice(14);
  const size = HAND_SIZE[level];
  let [nStrong, nAwake] = RUNG[rung-1];
  if (nStrong === 9) { nStrong = size; nAwake = size; }
  nStrong = Math.min(nStrong, size); nAwake = Math.min(nAwake, nStrong);
  const h = hash(mansion, level, rung);
  const take = (pool, count, used) => {
    const out = [], p = pool.filter(x => !used.has(x));
    for (let i = 0; i < count && p.length; i++) { const k = (h>>>(i*3)) % p.length; out.push(p[k]); used.add(p[k]); p.splice(k,1); }
    return out;
  };
  const used = new Set([mansion]);
  const sc = take(STRONG, Math.max(0, nStrong-1), used);
  const wc = take(WEAK, size-1-sc.length, used);
  const ids = [mansion, ...sc, ...wc];
  const awakeIds = new Set([mansion, ...sc].slice(0, nAwake));
  return ids.map(id => ({ id, awake: awakeIds.has(id) }));
}

const CHART5 = [5,6,10,17,18];
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}

function cardsFor(hand){
  const C = E.makeCards({lvl:2});
  for (const h of hand) C[200+h.id] = {...C[h.id], id:200+h.id, who:"sky",
    lvl: h.awake?2:1, ab: h.awake?C[h.id].ab:null, twoFaced:false, homeM:h.id};
  return C;
}

const REPS = 14;
function curve(RANK, level, youDepth){
  const means = [];
  for (let rung = 1; rung <= 9; rung++){
    let acc = 0;
    for (let m = 1; m <= 28; m++){
      const hand = buildHand(RANK, m, level, rung);
      const C = cardsFor(hand), skyHand = hand.map(h => 200+h.id);
      let w = 0, t = 0;
      for (let tr = 0; tr < REPS; tr++){
        const r1 = rng(9001 + tr*7919);
        const rest = Array.from({length:28},(_,i)=>i+1).filter(x=>!CHART5.includes(x));
        for (let i = rest.length-1; i > 0; i--){ const j = Math.floor(r1()*(i+1)); [rest[i],rest[j]]=[rest[j],rest[i]]; }
        const pack = CHART5.concat(rest.slice(0,1));
        for (const L of ["you","sky"]){
          const h2 = E.deal(pack, 7000 + tr*100 + m, m, true);
          const r = E.playBoard({C, you:h2.slice(), sky:skyHand.slice(), tonight:m, leader:L, depth:8, youDepth});
          t++; if (r.winner === "you") w++;
        }
      }
      acc += 100*w/t;
    }
    means.push(acc/28);
  }
  return means;
}

function show(label, RANK){
  console.log("\n=== " + label + " ===");
  console.log("            level 1              level 2");
  console.log("rung     careful  casual  gap  careful  casual  gap");
  const c1 = curve(RANK,1,8), k1 = curve(RANK,1,0);
  const c2 = curve(RANK,2,8), k2 = curve(RANK,2,0);
  for (let r = 0; r < 9; r++){
    const g1 = c1[r]-k1[r], g2 = c2[r]-k2[r];
    console.log("  " + String(r+1===9?"9(sky)":r+1).padEnd(7)
      + c1[r].toFixed(1).padStart(6) + k1[r].toFixed(1).padStart(8) + g1.toFixed(1).padStart(6)
      + c2[r].toFixed(1).padStart(8) + k2[r].toFixed(1).padStart(8) + g2.toFixed(1).padStart(6));
  }
  const mono = a => a.every((v,i)=> i===0 || v <= a[i-1]+0.5);
  console.log("  monotone:  L1 careful " + (mono(c1)?"YES":"NO") + "   L2 careful " + (mono(c2)?"YES":"NO"));
  return {c1,k1,c2,k2};
}

show("ranking rebuilt from generation D (what the ladder SHOULD use)", RANK_FRESH);
show("stale generation-B ranking (what ladder-spec.js reads today)", RANK_STALE);
