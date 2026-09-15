const E=require("./manzil-engine-v6-AUG24.js");
const CHART5=[5,6,10,17,18];
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
function cards(X, mode){   // mode: "asleep" (no ab) | "awake" (real ab)
  const C=E.makeCards({lvl:2});
  for(let i=1;i<=28;i++) C[200+i]={...C[i], id:200+i, who:"sky", lvl:1, ab:null, twoFaced:false, homeM:i};
  if(mode==="awake") C[200+X]={...C[200+X], lvl:2, ab:C[X].ab};
  return C;
}
// high-n: X plus four ASLEEP companions, so X's ability is the only variable in the hand
function test(X, mode, yd, trials){
  const C=cards(X,mode);
  let w=0,t=0;
  for(let tr=0;tr<trials;tr++){
    const r0=rng(X*104729+tr*7919);
    const others=Array.from({length:28},(_,i)=>i+1).filter(x=>x!==X);
    for(let i=others.length-1;i>0;i--){const j=Math.floor(r0()*(i+1));[others[i],others[j]]=[others[j],others[i]];}
    const skyHand=[200+X, ...others.slice(0,4).map(x=>200+x)];
    const r1=rng(9001+tr*7919);
    const rest=Array.from({length:28},(_,i)=>i+1).filter(x=>!CHART5.includes(x));
    for(let i=rest.length-1;i>0;i--){const j=Math.floor(r1()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
    const pack=CHART5.concat(rest.slice(0,1));
    for(let n=1;n<=28;n++) for(const L of ["you","sky"]){
      const h2=E.deal(pack,7000+tr*100+n,n,true);
      const r=E.playBoard({C,you:h2.slice(),sky:skyHand.slice(),tonight:n,leader:L,depth:8,youDepth:yd});
      t++; if(r.winner==="you") w++;
    }
  }
  return {win:100*w/t, n:t};
}
const TR=18;   // 18 x 28 x 2 = 1008 boards per cell
console.log("does the signature help or hurt its holder?  (1008 boards a cell, +-3.1pp at 95%)\n");
console.log("  card              asleep   awake    ability worth   verdict");
for(const X of [9,26,11,8,15,28,22,18]){
  const a=test(X,"asleep",8,TR), b=test(X,"awake",8,TR);
  const d=a.win-b.win;
  const se=Math.sqrt(a.win*(100-a.win)/a.n + b.win*(100-b.win)/b.n);
  const sig=Math.abs(d)>1.96*se;
  const nm=E.makeCards({lvl:2})[X].name;
  console.log(`  ${nm.padEnd(16)} ${a.win.toFixed(1).padStart(6)}  ${b.win.toFixed(1).padStart(6)}   ${d.toFixed(1).padStart(8)}      ${sig?(d>0?"REAL, helps":"REAL, HURTS"):"not significant"}`);
}
