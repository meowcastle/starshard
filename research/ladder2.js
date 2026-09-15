const E=require("./manzil-engine-v6-AUG24.js");
const S=JSON.parse(require("fs").readFileSync("cardstrength.json","utf8"));
const CHART5=[5,6,10,17,18];
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
const names=E.makeCards({lvl:2});
// every mansion ranked by how strong it is in HER hand when awake (low win% = strong card)
const RANK=Array.from({length:28},(_,i)=>i+1).sort((a,b)=>S.awake[a].strong-S.awake[b].strong);
const rankOf={}; RANK.forEach((id,i)=>rankOf[id]=i);        // 0 = strongest (the thread)

// a rung = how many of her cards are AWAKE THREATS (spike, don't spread) + her hand size.
// COMPENSATION: tonight's mansion is forced into her hand, and mansions differ by ~49 points.
// so companions are drawn from the opposite end of the ranking to cancel it out.
function buildHand(tonight, size, nThreat, r0){
  const used=new Set([tonight]);
  // offset: a strong tonight-mansion (low rank) pulls companions toward the weak end
  const mirror = 27 - rankOf[tonight];
  const centre = Math.round((mirror + 13.5) / 2);            // half-compensate, keeps variety
  const pool = RANK.filter(x=>!used.has(x))
    .map(id=>({id, d:Math.abs(rankOf[id]-centre)}))
    .sort((a,b)=>a.d-b.d).slice(0, 12).map(x=>x.id);
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(r0()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  const ids=[tonight, ...pool.slice(0,size-1)];
  // spike: the nThreat strongest cards in her hand wake; the rest stay asleep
  const order=ids.map((id,k)=>({id,k,r:rankOf[id]})).sort((a,b)=>a.r-b.r);
  const awake=new Set(order.slice(0,nThreat).map(o=>o.k));
  return ids.map((id,k)=>({id, awake:awake.has(k)}));
}
function cardsFor(hand){
  const C=E.makeCards({lvl:2});
  for(const h of hand) C[200+h.id]={...C[h.id], id:200+h.id, who:"sky",
    lvl:h.awake?2:1, ab:h.awake?C[h.id].ab:null, twoFaced:false, homeM:h.id};
  return C;
}
function measure(size,nThreat,yd,trials){
  let w=0,t=0; const byM={};
  for(let tr=0;tr<trials;tr++){
    const r0=rng(6060+tr*7919+size*97+nThreat*131);
    const rest=Array.from({length:28},(_,i)=>i+1).filter(x=>!CHART5.includes(x));
    for(let i=rest.length-1;i>0;i--){const j=Math.floor(r0()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
    const pack=CHART5.concat(rest.slice(0,1));
    for(let n=1;n<=28;n++){
      const hand=buildHand(n,size,nThreat,r0);
      const C=cardsFor(hand), skyHand=hand.map(h=>200+h.id);
      byM[n]=byM[n]||{w:0,t:0};
      for(const L of ["you","sky"]){
        const h2=E.deal(pack,7000+tr*100+n,n,true);
        const r=E.playBoard({C,you:h2.slice(),sky:skyHand.slice(),tonight:n,leader:L,depth:8,youDepth:yd});
        t++; byM[n].t++; if(r.winner==="you"){w++;byM[n].w++;}
      }
    }
  }
  const vals=Object.values(byM).map(x=>100*x.w/x.t);
  const mean=vals.reduce((s,v)=>s+v,0)/vals.length;
  const sd=Math.sqrt(vals.reduce((s,v)=>s+(v-mean)**2,0)/vals.length);
  return {win:+(100*w/t).toFixed(1), sd:+sd.toFixed(1),
          min:+Math.min(...vals).toFixed(0), max:+Math.max(...vals).toFixed(0)};
}
const TR=6;
console.log("COMPENSATED LADDER — companions drawn to offset tonight's mansion\n");
console.log("lvl rung  her hand                 strong  weak   mansion range   sd");
const out=[];
for(const [lvl,size,threats] of [[1,5,[0,1,2,2,3,3,4,4,5]],[2,6,[0,1,2,3,3,4,5,5,6]]]){
  for(let i=0;i<9;i++){
    const a=measure(size,threats[i],8,TR), c=measure(size,threats[i],0,TR);
    const tag=i===8?"the sky":`walker ${i+1}`;
    out.push({lvl,rung:i+1,size,threats:threats[i],strong:a.win,weak:c.win,sd:a.sd});
    console.log(` ${lvl}   ${String(i+1).padStart(2)}   ${size} cards, ${threats[i]} awake  ${tag.padEnd(9)} ${a.win.toFixed(1).padStart(5)}  ${c.win.toFixed(1).padStart(5)}    ${String(a.min).padStart(3)}-${String(a.max).padStart(3)}      ${a.sd.toFixed(1)}`);
  }
  console.log("");
}
require("fs").writeFileSync("ladder2.json",JSON.stringify(out,null,1));
