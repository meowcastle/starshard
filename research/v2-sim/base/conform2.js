const E = require('./manzil-engine-v6.js');
const TWELVE=[6,10,17,18,5,4,3,19,7,26,12,14], FIVE=[6,10,17,18,5], SKY=[101,102,103,104,105];
const C=E.makeCards({lvl:2});
function cell(pack,yd,depth=8,guar=true){let w=0,t=0;
  for(let n=1;n<=28;n++)for(let s=1;s<=8;s++){const h=E.deal(pack,s,n,guar);
    for(const L of["you","sky"]){const r=E.playBoard({C,you:h.slice(),sky:SKY.slice(),tonight:n,leader:L,depth,youDepth:yd});t++;if(r.winner==="you")w++;}}
  return +(100*w/t).toFixed(1);}
console.log("her depth      :", [8,10,12,14,18,24].map(d=>d).join("    "));
console.log("careful (yd 8) :", [8,10,12,14,18,24].map(d=>cell(TWELVE,8,d)).join("  "));
console.log("casual  (yd 0) :", [8,10,12,14,18,24].map(d=>cell(TWELVE,0,d)).join("  "));
console.log("\npack size sweep, careful / casual / gap:");
for(const [nm,p] of [["5",FIVE],["8",TWELVE.slice(0,8)],["10",TWELVE.slice(0,10)],["12",TWELVE],["16",TWELVE.concat([1,8,9,20])],["28",Array.from({length:28},(_,i)=>i+1)]]){
  const a=cell(p,8),b=cell(p,0); console.log(`  pack of ${nm.padEnd(3)} ${a.toFixed(1)} / ${b.toFixed(1)}  gap ${(a-b).toFixed(1)}`);
}
