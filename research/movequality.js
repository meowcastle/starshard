const E=require("./manzil-engine-v6-AUG24.js");
const CHART5=[5,6,10,17,18];
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
const legal = slots => slots.map((s,i)=>s?null:i).filter(i=>i!==null);

// exactly youMove's scoring, so "regret" is measured in the agent's own currency
function scoreMove(g, slots, id, i, rev, depth){
  const r=E.resolve({...g,slots}, slots, id, i, rev, "you");
  const c=E.counts({...g,slots:r.slots}, r.slots);
  let score=(c[0]-c[1])*10;
  if(depth>0){
    let worst=null;
    for(const sid of g.sky) for(const si of legal(r.slots)){
      const r2=E.resolve({...g,slots:r.slots}, r.slots, sid, si, false, "sky");
      const c2=E.counts({...g,slots:r2.slots}, r2.slots);
      const v=c2[1]-c2[0];
      if(worst===null||v>worst) worst=v;
    }
    if(worst!==null) score-=worst*depth;
  }
  return score;
}
function candidates(g, slots){
  const out=[];
  for(const id of g.you) for(const rev of (g.C[id].twoFaced?[false,true]:[false]))
    for(const i of legal(slots)) out.push({id,i,rev});
  return out;
}
// play a board with a GREEDY player; at every player turn record how good their
// chosen move was against what a careful search would have picked from the same spot.
function runBoard(C, you, sky, tonight, leader){
  const g=E.mkGame({C, tonight, you:you.slice(), sky:sky.slice(), leader, depth:8});
  g.youDepth=0;
  let guard=0; const regrets=[];
  while(g.slots.some(s=>!s) && (g.you.length||g.sky.length) && guard++<40){
    const side=g.turn;
    if(side==="you" && g.you.length){
      const cs=candidates(g,g.slots);
      if(cs.length){
        const deep=cs.map(c=>scoreMove(g,g.slots,c.id,c.i,c.rev,8));
        const bestDeep=Math.max(...deep);
        const mv=E.youMove(g);                       // what greedy actually does
        const k=cs.findIndex(c=>c.id===mv.id && c.rev===mv.rev &&
              mv.r.slots.findIndex((s,j)=>s&&!g.slots[j])===c.i);
        if(k>=0) regrets.push(bestDeep-deep[k]);
      }
    }
    const mv = side==="you" ? (g.you.length?E.youMove(g):null) : (g.sky.length?E.skyMove(g):null);
    if(!mv){ g.turn = side==="you"?"sky":"you"; continue; }
    g.slots=mv.r.slots;
    if(side==="you") g.you.splice(g.you.indexOf(mv.id),1); else g.sky.splice(g.sky.indexOf(mv.id),1);
    if(mv.r.ret&&mv.r.ret.length){ g.you.push(...mv.r.ret); g.retUsed=true; }
    g.glanceOn=(g.C[mv.id].ab==="glance"&&E.on(g,g.C[mv.id]))?side:false;
    g.turn = side==="you"?"sky":"you";
  }
  return regrets;
}
function trial(chamberAwake, trials){
  const C=E.makeCards({lvl:2});
  for(let i=1;i<=28;i++) C[200+i]={...C[i], id:200+i, who:"sky", lvl:1, ab:null, twoFaced:false, homeM:i};
  if(chamberAwake) C[226]={...C[226], lvl:2, ab:C[26].ab};
  const all=[];
  for(let tr=0;tr<trials;tr++){
    const r0=rng(26*104729+tr*7919);
    const others=Array.from({length:28},(_,i)=>i+1).filter(x=>x!==26);
    for(let i=others.length-1;i>0;i--){const j=Math.floor(r0()*(i+1));[others[i],others[j]]=[others[j],others[i]];}
    const skyHand=[226, ...others.slice(0,4).map(x=>200+x)];
    const r1=rng(9001+tr*7919);
    const rest=Array.from({length:28},(_,i)=>i+1).filter(x=>!CHART5.includes(x));
    for(let i=rest.length-1;i>0;i--){const j=Math.floor(r1()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
    const pack=CHART5.concat(rest.slice(0,1));
    for(let n=1;n<=28;n++) for(const L of ["you","sky"]){
      const h2=E.deal(pack,7000+tr*100+n,n,true);
      all.push(...runBoard(C,h2,skyHand,n,L));
    }
  }
  const mean=all.reduce((s,v)=>s+v,0)/all.length;
  const sd=Math.sqrt(all.reduce((s,v)=>s+(v-mean)**2,0)/all.length);
  const zero=all.filter(v=>v===0).length;
  return {n:all.length, mean, se:sd/Math.sqrt(all.length), perfect:100*zero/all.length};
}
const TR=10;
console.log("THE GREEDY PLAYER'S MOVE QUALITY, with and without an awake Chamber in her hand");
console.log("regret = how much worse their chosen move was than the best available,");
console.log("scored in the careful agent's own currency. lower = they played better.\n");
const off=trial(false,TR), on=trial(true,TR);
console.log(`  chamber ASLEEP   mean regret ${off.mean.toFixed(2)} +-${(1.96*off.se).toFixed(2)}   perfect moves ${off.perfect.toFixed(1)}%   n=${off.n}`);
console.log(`  chamber AWAKE    mean regret ${on.mean.toFixed(2)} +-${(1.96*on.se).toFixed(2)}   perfect moves ${on.perfect.toFixed(1)}%   n=${on.n}`);
const d=off.mean-on.mean, se=Math.sqrt(off.se**2+on.se**2);
console.log(`\n  difference ${d.toFixed(2)} +-${(1.96*se).toFixed(2)}  ->  ${Math.abs(d)>1.96*se ? (d>0?"CONFIRMED: the chamber makes the greedy player play BETTER":"REFUTED: the chamber makes them play WORSE") : "NOT SIGNIFICANT: theory unsupported"}`);
