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
// mansions may vary now. rungs: tier walks weak->mid->strong, awake count climbs inside it.
const RUNGS=[["weak",0],["weak",3],["mid",0],["mid",3],["strong",0],["strong",1],["strong",2],["strong",3],["strong",99]];
function measure(size, tierName, nAwake, trials){
  const tier=G.TIER[tierName]; let w=0,t=0; const byM={};
  for(let tr=0;tr<trials;tr++){
    const r0=rng(1717+tr*7919+size*97+nAwake*131+tierName.length*13);
    const rest=Array.from({length:28},(_,i)=>i+1).filter(x=>!CHART5.includes(x));
    for(let i=rest.length-1;i>0;i--){const j=Math.floor(r0()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
    const pack=CHART5.concat(rest.slice(0,1));
    for(let n=1;n<=28;n++){
      const pool=tier.filter(x=>x!==n);
      for(let i=pool.length-1;i>0;i--){const j=Math.floor(r0()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
      const ids=[n,...pool.slice(0,size-1)];
      const k=Math.min(nAwake,size);
      const hand=ids.map((id,i)=>({id, awake:i<k}));
      const C=cardsFor(hand), skyHand=hand.map(h=>200+h.id);
      byM[n]=byM[n]||{w:0,t:0};
      for(const L of ["you","sky"]){
        const h2=E.deal(pack,7000+tr*100+n,n,true);
        const r=E.playBoard({C,you:h2.slice(),sky:skyHand.slice(),tonight:n,leader:L,depth:8,youDepth:8});
        t++; byM[n].t++; if(r.winner==="you"){w++;byM[n].w++;}
      }
    }
  }
  const vals=Object.values(byM).map(x=>100*x.w/x.t);
  return {win:+(100*w/t).toFixed(1), min:+Math.min(...vals).toFixed(0), max:+Math.max(...vals).toFixed(0)};
}
const TR=8;
console.log("lvl rung  she holds                     player win%   easiest..hardest mansion");
for(const [lvl,size] of [[1,5],[2,6]]){
  let prev=null;
  for(let i=0;i<9;i++){
    const [tier,aw]=RUNGS[i];
    const m=measure(size,tier,aw,TR);
    const tag=i===8?"THE SKY":`walker ${i+1}`;
    const arrow = prev===null ? "" : (m.win<prev ? "" : "  <-- not harder");
    console.log(` ${lvl}   ${String(i+1).padStart(2)}   ${size} ${tier}-tier, ${String(aw===99?size:aw).padStart(1)} awake  ${tag.padEnd(10)} ${m.win.toFixed(1).padStart(6)}        ${String(m.min).padStart(3)} - ${String(m.max).padStart(3)}${arrow}`);
    prev=m.win;
  }
  console.log("");
}
