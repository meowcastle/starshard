const E = require('./manzil-engine-v6.js');
const SKY=[101,102,103,104,105];
const C=E.makeCards({lvl:2});
function cell(pack,yd,depth=8,guar=true){let w=0,t=0;
  for(let n=1;n<=28;n++)for(let s=1;s<=8;s++){const h=E.deal(pack,s,n,guar);
    for(const L of["you","sky"]){const r=E.playBoard({C,you:h.slice(),sky:SKY.slice(),tonight:n,leader:L,depth,youDepth:yd});t++;if(r.winner==="you")w++;}}
  return +(100*w/t).toFixed(1);}
console.log("PACK OF FIVE — same set, different order:");
[["as I ran it   [6,10,17,18,5]",[6,10,17,18,5]],
 ["build's order [5,6,10,17,18]",[5,6,10,17,18]],
 ["sorted        [5,6,10,17,18]",[5,6,10,17,18].slice().sort((a,b)=>a-b)],
 ["reversed      [18,17,10,6,5]",[18,17,10,6,5]]].forEach(([lab,p])=>
  console.log(`  ${lab}  careful ${cell(p,8).toFixed(1)}  casual ${cell(p,0).toFixed(1)}`));
console.log("\nPACK OF TWELVE — orderings, careful at her depth 8 / 12 / 14 / 24:");
[["as listed", [6,10,17,18,5,4,3,19,7,26,12,14]],
 ["sorted   ", [3,4,5,6,7,10,12,14,17,18,19,26]],
 ["five-first",[5,6,10,17,18,3,4,7,12,14,19,26]]].forEach(([lab,p])=>
  console.log(`  ${lab}  ` + [8,12,14,24].map(d=>cell(p,8,d).toFixed(1)).join("  ")));
console.log("  they report  68.3  67.0  67.0  66.5");
