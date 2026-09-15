const E=require("./manzil-engine-v6-AUG24.js");
const G=JSON.parse(require("fs").readFileSync("grid.json","utf8"));
const CHART5=[5,6,10,17,18];
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
function cardsFor(hand){
  const C=E.makeCards({lvl:2});
  for(const h of hand) C[200+h.id]={...C[h.id], id:200+h.id, who:"sky",
    lvl:h.awake?2:1, ab:h.awake?C[h.id].ab:null, twoFaced:false, homeM:h.id};
  return C;
}
function cell(tierName, size, nAwake, yd, trials, seedBase){
  const tier=G.TIER[tierName];
  let w=0,t=0;
  for(let tr=0;tr<trials;tr++){
    const r0=rng(seedBase+tr*7919+size*97+nAwake*131);
    const rest=Array.from({length:28},(_,i)=>i+1).filter(x=>!CHART5.includes(x));
    for(let i=rest.length-1;i>0;i--){const j=Math.floor(r0()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
    const pack=CHART5.concat(rest.slice(0,1));
    for(let n=1;n<=28;n++){
      const pool=tier.filter(x=>x!==n);
      for(let i=pool.length-1;i>0;i--){const j=Math.floor(r0()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
      const ids=[n, ...pool.slice(0,size-1)];
      const idx=ids.map((_,k)=>k); for(let i=idx.length-1;i>0;i--){const j=Math.floor(r0()*(i+1));[idx[i],idx[j]]=[idx[j],idx[i]];}
      const awakeSet=new Set(idx.slice(0,nAwake));
      const hand=ids.map((id,k)=>({id, awake:awakeSet.has(k)}));
      const C=cardsFor(hand), skyHand=hand.map(h=>200+h.id);
      for(const L of ["you","sky"]){
        const h2=E.deal(pack,7000+tr*100+n,n,true);
        const r=E.playBoard({C,you:h2.slice(),sky:skyHand.slice(),tonight:n,leader:L,depth:8,youDepth:yd});
        t++; if(r.winner==="you") w++;
      }
    }
  }
  return +(100*w/t).toFixed(1);
}
const rows=[];
for(const tier of ["weak","mid","strong"])
  for(const size of [4,5,6,7])
    for(let a=0;a<=size;a++){
      const strong=cell(tier,size,a,8,4,2024);
      rows.push({tier,size,awake:a,strong});
    }
rows.sort((x,y)=>y.strong-x.strong);
require("fs").writeFileSync("fullgrid.json",JSON.stringify(rows,null,1));
console.log("recipe space, easiest first (player win% vs a strong player)\n");
console.log("  win%   her hand");
for(const r of rows) console.log(`  ${r.strong.toFixed(1).padStart(5)}   ${r.size} ${r.tier}-tier cards, ${r.awake} awake`);
