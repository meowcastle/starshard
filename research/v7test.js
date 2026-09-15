const E=require("./manzil-engine-v7-l34.js");
const CHART5=[5,6,10,17,18], SKY=[101,102,103,104,105];
const Q=E.QUADRANT;
const ofQ=nm=>Object.keys(Q).map(Number).filter(id=>Q[id].nm===nm);
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
function packOf(size,tr){
  const r0=rng(4711+tr*7919);
  const rest=Array.from({length:28},(_,i)=>i+1).filter(x=>!CHART5.includes(x));
  for(let i=rest.length-1;i>0;i--){const j=Math.floor(r0()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
  return CHART5.concat(rest.slice(0,Math.max(0,size-5)));
}
// owned cards in `l3set` sit at level 3; the rest of the pack is awake-or-asleep as the game gives it
function cards(pack, l3set){
  const levels={};
  for(const id of pack) levels[id]= l3set.includes(id) ? 3 : (CHART5.includes(id)?2:1);
  const C=E.makeCards({lvl:2, levels});
  for(let i=1;i<=28;i++) if(!pack.includes(i)) C[i]={...C[i], lvl:1, ab:null, twoFaced:false};
  for(const id of pack) if(!CHART5.includes(id) && !l3set.includes(id)) C[id]={...C[id], lvl:1, ab:null, twoFaced:false};
  return C;
}
function run(size,l3sel,yd,trials){
  let w=0,t=0,fl=0,cl=0;
  for(let tr=0;tr<trials;tr++){
    const pack=packOf(size,tr);
    const C=cards(pack, pack.filter(l3sel));
    for(let n=1;n<=28;n++) for(const L of ["you","sky"]){
      const hand=E.deal(pack,7000+tr*100+n,n,true);
      const r=E.playBoard({C,you:hand.slice(),sky:SKY.slice(),tonight:n,leader:L,depth:8,youDepth:yd});
      t++; fl+=r.flips; if(Math.abs(r.you-r.sky)<=1) cl++; if(r.winner==="you") w++;
    }
  }
  return {win:+(100*w/t).toFixed(1), flips:+(fl/t).toFixed(2), close:+(100*cl/t).toFixed(1)};
}
const TR=14;
const none=()=>false, all=()=>true;
const only=nm=>id=>Q[id]&&Q[id].nm===nm;
console.log("\nEACH GRANT ON ITS OWN, pack of twelve (784 boards a cell)\n");
console.log("what is at L3                     careful  casual   gap   flips  close%");
const base=run(12,none,8,TR), baseC=run(12,none,0,TR);
console.log(`  nothing (today)                  ${base.win.toFixed(1).padStart(6)}  ${baseC.win.toFixed(1).padStart(6)}  ${(base.win-baseC.win).toFixed(1).padStart(5)}  ${base.flips.toFixed(2)}   ${base.close.toFixed(1)}`);
for(const [nm,label] of [["seiryuu","seiryuu only  (the turn)"],["byakko","byakko only   (the guard)"],
                         ["suzaku","suzaku only   (the strike)"],["genbu","genbu only    (the return)"]]){
  const a=run(12,only(nm),8,TR), b=run(12,only(nm),0,TR);
  console.log(`  ${label.padEnd(32)} ${a.win.toFixed(1).padStart(6)}  ${b.win.toFixed(1).padStart(6)}  ${(a.win-b.win).toFixed(1).padStart(5)}  ${a.flips.toFixed(2)}   ${a.close.toFixed(1)}   ${(a.win-base.win>=0?"+":"")}${(a.win-base.win).toFixed(1)}`);
}
const a=run(12,all,8,TR), b=run(12,all,0,TR);
console.log(`  all four quadrants               ${a.win.toFixed(1).padStart(6)}  ${b.win.toFixed(1).padStart(6)}  ${(a.win-b.win).toFixed(1).padStart(5)}  ${a.flips.toFixed(2)}   ${a.close.toFixed(1)}   ${(a.win-base.win>=0?"+":"")}${(a.win-base.win).toFixed(1)}`);
console.log("\nALL FOUR LIVE, ACROSS THE PROGRESSION\n");
console.log("pack   nothing at L3      all at L3      band is careful 55-65");
for(const size of [6,12,20,28]){
  const n8=run(size,none,8,TR), n0=run(size,none,0,TR);
  const a8=run(size,all,8,TR), a0=run(size,all,0,TR);
  console.log(` ${String(size).padStart(3)}    ${n8.win.toFixed(1).padStart(5)} / ${n0.win.toFixed(1).padStart(5)}      ${a8.win.toFixed(1).padStart(5)} / ${a0.win.toFixed(1).padStart(5)}     ${a8.win>=55&&a8.win<=65?"IN BAND":""}`);
}
