// LEVEL 3 GRANTS — whose hand carries them, and what L4 should be.
// Engine: ref-l34.js (the generation-D reference + the quadrant grants). 60/60 vectors,
// 2000/2000 identical to the reference at level 2.
const E = require("/tmp/now2/ref-l34-fix.js");
const fs = require("fs");

const D = JSON.parse(fs.readFileSync("/tmp/now2/sig28-D.json", "utf8"));
const worth = {}; for (const r of D) worth[r.id] = r.worth;
const RANK = Array.from({length:28},(_,i)=>i+1).sort((a,b)=>worth[b]-worth[a]);
const STRONG = RANK.slice(0,10), WEAK = RANK.slice(14);

const HER_HAND = 7;                       // level 3 sets her hand to seven
const RUNG = [[0,0],[1,0],[1,1],[2,1],[2,2],[3,2],[3,3],[4,4],[9,9]];

function hash(a,b,c){let h=(a*73856093 ^ b*19349663 ^ c*83492791)>>>0;
  h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h>>>0;}

function buildHand(mansion, rung){
  let [nStrong,nAwake] = RUNG[rung-1];
  if (nStrong === 9) { nStrong = HER_HAND; nAwake = HER_HAND; }
  nStrong = Math.min(nStrong, HER_HAND); nAwake = Math.min(nAwake, nStrong);
  const h = hash(mansion, 3, rung);
  const take = (pool, count, used) => {
    const out = [], p = pool.filter(x => !used.has(x));
    for (let i=0;i<count && p.length;i++){ const k=(h>>>(i*3))%p.length; out.push(p[k]); used.add(p[k]); p.splice(k,1); }
    return out;
  };
  const used = new Set([mansion]);
  const sc = take(STRONG, Math.max(0,nStrong-1), used);
  const wc = take(WEAK, HER_HAND-1-sc.length, used);
  const ids = [mansion, ...sc, ...wc];
  const awake = new Set([mansion, ...sc].slice(0, nAwake));
  return ids.map(id => ({ id, awake: awake.has(id) }));
}

const CHART5 = [5,6,10,17,18];
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}

// everything the player owns is at level 3. her awake cards are level 3, her asleep ones level 1.
function cardsFor(hand){
  const C = E.makeCards({ lvl: 3 });
  for (const h of hand) C[200+h.id] = {...C[h.id], id:200+h.id, who:"sky",
    lvl: h.awake?3:1, ab: h.awake?C[h.id].ab:null, twoFaced: h.awake ? C[h.id].twoFaced : false, homeM:h.id};
  return C;
}

const REPS = 14;
function cell(rung, grantSides, youDepth, l4){
  let acc = 0;
  for (let m=1;m<=28;m++){
    const hand = buildHand(m, rung);
    const C = cardsFor(hand), skyHand = hand.map(h=>200+h.id);
    let w=0,t=0;
    for (let tr=0; tr<REPS; tr++){
      const r1 = rng(9001+tr*7919);
      const rest = Array.from({length:28},(_,i)=>i+1).filter(x=>!CHART5.includes(x));
      for (let i=rest.length-1;i>0;i--){const j=Math.floor(r1()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
      const pack = CHART5.concat(rest.slice(0,2));
      for (const L of ["you","sky"]){
        const h2 = E.deal(pack, 7000+tr*100+m, m, true);
        const r = E.playBoard({C, you:h2.slice(), sky:skyHand.slice(), tonight:m, leader:L,
                               depth:8, youDepth, grantSides, l4});
        t++; if (r.winner==="you") w++;
      }
    }
    acc += 100*w/t;
  }
  return acc/28;
}


function cell2(rung,sides,youDepth,l4,only){
  let acc=0;
  for(let m=1;m<=28;m++){
    const hand=buildHand(m,rung); const C=cardsFor(hand), skyHand=hand.map(h=>200+h.id);
    let w=0,t=0;
    for(let tr=0;tr<REPS;tr++){
      const r1=rng(9001+tr*7919);
      const rest=Array.from({length:28},(_,i)=>i+1).filter(x=>!CHART5.includes(x));
      for(let i=rest.length-1;i>0;i--){const j=Math.floor(r1()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
      const pack=CHART5.concat(rest.slice(0,2));
      for(const L of ["you","sky"]){
        const h2=E.deal(pack,7000+tr*100+m,m,true);
        const r=E.playBoard({C,you:h2.slice(),sky:skyHand.slice(),tonight:m,leader:L,depth:8,youDepth,grantSides:sides,l4,grantOnly:only});
        t++; if(r.winner==="you") w++;
      }
    }
    acc+=100*w/t;
  }
  return acc/28;
}

console.log("AFTER the return-destination fix. rung 9, careful, baseline = no grants.\n");
const base=cell2(9,"none",8,null,null);
console.log("baseline (no grants): "+base.toFixed(1)+"\n");
console.log("grant      player only   both     walker only");
for(const gr of ["guard","lead","turn","return"]){
  const y=cell2(9,"you",8,null,gr), b=cell2(9,"both",8,null,gr), k=cell2(9,"sky",8,null,gr);
  console.log("  "+gr.padEnd(9)+y.toFixed(1).padStart(9)+b.toFixed(1).padStart(10)+k.toFixed(1).padStart(13));
}
console.log("\nall four grants, both sides:");
console.log("            careful  casual   gap");
for(const [lb,l4] of [["L3",null],["L3+L4",'uncondition']]){
  const a=cell2(9,"both",8,l4,null), c=cell2(9,"both",0,l4,null);
  console.log("  "+lb.padEnd(10)+a.toFixed(1).padStart(6)+c.toFixed(1).padStart(8)+(a-c).toFixed(1).padStart(7));
}
