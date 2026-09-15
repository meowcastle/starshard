const E=require("./manzil-engine-v6-AUG24.js");
const CHART5=[5,6,10,17,18], SKY=[101,102,103,104,105];
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
// mid-game player: a pack of twelve, chart five awake, the other seven asleep.
// then a few cards are promoted to a candidate L3/L4 rule and we measure the delta.
function build(promoted, mode){
  const C=E.makeCards({lvl:2});
  for(let i=1;i<=28;i++) if(!CHART5.includes(i)) C[i]={...C[i], lvl:1, ab:null, twoFaced:false};
  for(const id of promoted){
    C[id]={...C[id], lvl:3, ab:E.makeCards({lvl:2})[id].ab};       // awake at minimum
    if(mode==="twoface") C[id]={...C[id], twoFaced:true};
    if(mode==="homereach") C[id]={...C[id], homeM:C[id].homeM};     // handled in deal/slot below
  }
  return C;
}
// guaranteed-in-the-deal: promoted cards are dealt first, then the usual fill
function dealWith(E2, pack, seed, tonight, promoted, guarantee){
  if(!pack||pack.length<=5) return pack.slice();
  let h=(seed^2166136261)>>>0;
  const rnd=()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};
  const bag=pack.slice(), out=[];
  if(bag.includes(tonight)) out.push(bag.splice(bag.indexOf(tonight),1)[0]);
  if(guarantee) for(const p of promoted){ const k=bag.indexOf(p); if(k>=0&&out.length<5) out.push(bag.splice(k,1)[0]); }
  while(out.length<5&&bag.length) out.push(bag.splice(Math.floor(rnd()*bag.length),1)[0]);
  return out;
}
function run(mode, nPromoted, trials){
  let w=0,t=0;
  for(let tr=0;tr<trials;tr++){
    const r0=rng(4711+tr*7919);
    const rest=Array.from({length:28},(_,i)=>i+1).filter(x=>!CHART5.includes(x));
    for(let i=rest.length-1;i>0;i--){const j=Math.floor(r0()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
    const pack=CHART5.concat(rest.slice(0,7));                       // a twelve
    const promoted=pack.slice(0,nPromoted);                          // the chart five promote first
    const C=build(mode==="baseline"?[]:promoted, mode);
    for(let n=1;n<=28;n++) for(const L of ["you","sky"]){
      const hand=dealWith(E,pack,7000+tr*100+n,n,promoted, mode==="dealt");
      const r=E.playBoard({C,you:hand.slice(),sky:SKY.slice(),tonight:n,leader:L,depth:8,youDepth:8});
      t++; if(r.winner==="you") w++;
    }
  }
  return +(100*w/t).toFixed(1);
}
const TR=14;
console.log("CANDIDATE L3/L4 MECHANICS — player with a pack of twelve, 784 boards a cell\n");
const base=run("baseline",0,TR);
console.log(`  baseline (chart five awake, seven asleep)          ${base.toFixed(1)}`);
for(const [nm,mode] of [["signature awake only (i.e. plain L2)","awakeonly"],
                        ["+ the card turns (two-faced)","twoface"],
                        ["+ always dealt into your five","dealt"]]){
  for(const n of [1,2,3]){
    const v=run(mode,n,TR);
    console.log(`  ${nm.padEnd(50)} x${n}  ${v.toFixed(1).padStart(5)}   ${(v-base>=0?"+":"")}${(v-base).toFixed(1)}`);
  }
}
