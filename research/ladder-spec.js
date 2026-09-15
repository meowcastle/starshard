// THE LADDER GENERATOR v2 — levels 1 and 2, all 28 mansions, 9 rungs.
// Deterministic. One dial: how many STRONG cards she holds, and how many of those are awake.
const E=require("./manzil-engine-v6-AUG24.js");
const S=JSON.parse(require("fs").readFileSync("cardstrength.json","utf8"));
const RANK=Array.from({length:28},(_,i)=>i+1).sort((a,b)=>S.awake[a].strong-S.awake[b].strong);
const rankOf={}; RANK.forEach((id,i)=>rankOf[id]=i);
const STRONG=RANK.slice(0,10), WEAK=RANK.slice(14);
const HAND_SIZE={1:5, 2:6, 3:7, 4:8};
// rung -> [how many strong cards, how many of them are awake]
const RUNG=[[0,0],[1,0],[1,1],[2,1],[2,2],[3,2],[3,3],[4,4],[9,9]];   // 9 = all of them
function hash(a,b,c){let h=(a*73856093 ^ b*19349663 ^ c*83492791)>>>0;
  h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h>>>0;}
function buildHand(mansion, level, rung){
  const size=HAND_SIZE[level];
  let [nStrong,nAwake]=RUNG[rung-1];
  if(nStrong===9){ nStrong=size; nAwake=size; }
  nStrong=Math.min(nStrong,size); nAwake=Math.min(nAwake,nStrong);
  const h=hash(mansion,level,rung);
  const take=(pool,count,used)=>{
    const out=[], p=pool.filter(x=>!used.has(x));
    for(let i=0;i<count && p.length;i++){ const k=(h>>>(i*3))%p.length; out.push(p[k]); used.add(p[k]); p.splice(k,1); }
    return out;
  };
  const used=new Set([mansion]);
  const strongCompanions=take(STRONG, Math.max(0,nStrong-1), used);
  const weakCompanions=take(WEAK, size-1-strongCompanions.length, used);
  // tonight's mansion always sits in her hand and counts toward the strong slots
  const ids=[mansion, ...strongCompanions, ...weakCompanions];
  const awakeIds=new Set([mansion, ...strongCompanions].slice(0,nAwake));
  return ids.map(id=>({id, awake:awakeIds.has(id)}));
}
module.exports={buildHand,RANK,rankOf,HAND_SIZE,RUNG,STRONG,WEAK};

if(require.main===module){
  const CHART5=[5,6,10,17,18];
  function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
  function cardsFor(hand){
    const C=E.makeCards({lvl:2});
    for(const h of hand) C[200+h.id]={...C[h.id], id:200+h.id, who:"sky",
      lvl:h.awake?2:1, ab:h.awake?C[h.id].ab:null, twoFaced:false, homeM:h.id};
    return C;
  }
  const REPS=14;
  const out={};
  for(const level of [1,2]) for(let m=1;m<=28;m++) for(let rung=1;rung<=9;rung++){
    const hand=buildHand(m,level,rung);
    const C=cardsFor(hand), skyHand=hand.map(h=>200+h.id);
    let w=0,t=0;
    for(let tr=0;tr<REPS;tr++){
      const r1=rng(9001+tr*7919);
      const rest=Array.from({length:28},(_,i)=>i+1).filter(x=>!CHART5.includes(x));
      for(let i=rest.length-1;i>0;i--){const j=Math.floor(r1()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
      const pack=CHART5.concat(rest.slice(0,1));
      for(const L of ["you","sky"]){
        const h2=E.deal(pack,7000+tr*100+m,m,true);
        const r=E.playBoard({C,you:h2.slice(),sky:skyHand.slice(),tonight:m,leader:L,depth:8,youDepth:8});
        t++; if(r.winner==="you") w++;
      }
    }
    out[`${level}.${m}.${rung}`]={level,mansion:m,rung,size:hand.length,
      hand:hand.map(h=>({id:h.id,awake:h.awake})), win:+(100*w/t).toFixed(1), n:t};
  }
  require("fs").writeFileSync("ladder-l1l2.json",JSON.stringify(out,null,1));
  console.log("AGGREGATE CURVE (mean of all 28 mansions, 28x28=784 boards a rung)\n");
  console.log("rung        level 1   level 2");
  const mean=(L,r)=>Array.from({length:28},(_,i)=>out[`${L}.${i+1}.${r}`].win).reduce((s,v)=>s+v,0)/28;
  let ok1=true, ok2=true;
  for(let r=1;r<=9;r++){
    const a=mean(1,r), b=mean(2,r);
    if(r>1 && a>mean(1,r-1)+0.5) ok1=false;
    if(r>1 && b>mean(2,r-1)+0.5) ok2=false;
    console.log(`  ${(r===9?"9 (the sky)":String(r)).padEnd(11)} ${a.toFixed(1).padStart(6)}    ${b.toFixed(1).padStart(6)}`);
  }
  console.log(`\n  level 1 rungs monotone: ${ok1?"YES":"no"}    level 2 rungs monotone: ${ok2?"YES":"no"}`);
  let l2h=0; for(let m=1;m<=28;m++) if(out[`2.${m}.9`].win<=out[`1.${m}.9`].win) l2h++;
  console.log(`  level 2's sky harder than level 1's: ${l2h}/28 mansions`);
  const sk=L=>Array.from({length:28},(_,i)=>out[`${L}.${i+1}.9`].win).sort((a,b)=>a-b);
  const s1=sk(1), s2=sk(2);
  console.log(`\n  sky difficulty by mansion (intended to vary):`);
  console.log(`    level 1: ${s1[0]} .. ${s1[27]}   median ${s1[14]}`);
  console.log(`    level 2: ${s2[0]} .. ${s2[27]}   median ${s2[14]}`);
  const nm=E.makeCards({lvl:2});
  const rankedM=Array.from({length:28},(_,i)=>i+1).sort((a,b)=>out[`1.${b}.9`].win-out[`1.${a}.9`].win);
  console.log(`\n  gentlest mansions first (suggested campaign order):`);
  console.log("   ", rankedM.slice(0,8).map(m=>nm[m].name).join(", "), "...");
  console.log("    hardest:", rankedM.slice(-5).map(m=>nm[m].name).join(", "));
}
