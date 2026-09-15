const E=require("./manzil-engine-v6-AUG24.js");
const CHART5=[5,6,10,17,18];
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
function test(X, awake, yd, trials){
  const C=E.makeCards({lvl:2});
  for(let i=1;i<=28;i++) C[200+i]={...C[i], id:200+i, who:"sky", lvl:1, ab:null, twoFaced:false, homeM:i};
  if(awake) C[200+X]={...C[200+X], lvl:2, ab:C[X].ab};
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
  return 100*w/t;
}
const TR=18;
console.log("IS THE CHAMBER EXPLOITED, OR JUST BAD?");
console.log("if a SEARCHING player exploits it but a greedy one cannot, the chamber is\n");
console.log("  opponent          asleep   awake   ability worth");
for(const [nm,yd] of [["searching (careful)",8],["greedy (casual)",0]]){
  const a=test(26,false,yd,TR), b=test(26,true,yd,TR);
  console.log(`  ${nm.padEnd(18)} ${a.toFixed(1).padStart(6)}  ${b.toFixed(1).padStart(6)}  ${(a-b).toFixed(1).padStart(8)}`);
}
