const E = require('./manzil-engine-v6.js');
const TWELVE=[6,10,17,18,5,4,3,19,7,26,12,14], FIVE=[5,6,10,17,18], SKY=[101,102,103,104,105];
function cards(owned){ // ownAll:false — only `owned` awake, everything else a loaner
  const C=E.makeCards({lvl:2});
  for(let i=1;i<=28;i++) if(!owned.includes(i)) C[i]={...C[i], lvl:1, ab:null};
  return C;
}
function cell(C,pack,yd,depth=8,guar=true){let w=0,t=0;
  for(let n=1;n<=28;n++)for(let s=1;s<=8;s++){const h=E.deal(pack,s,n,guar);
    for(const L of["you","sky"]){const r=E.playBoard({C,you:h.slice(),sky:SKY.slice(),tonight:n,leader:L,depth,youDepth:yd});t++;if(r.winner==="you")w++;}}
  return +(100*w/t).toFixed(1);}

const C5=cards(FIVE), C12=cards(TWELVE), CALL=E.makeCards({lvl:2});
console.log("their row                        they report        ownAll:false      ownAll:true");
console.log("pack of 5, careful/casual        62.5 / 37.5        "
  + `${cell(C5,FIVE,8).toFixed(1)} / ${cell(C5,FIVE,0).toFixed(1)}`.padEnd(18)
  + `${cell(CALL,FIVE,8).toFixed(1)} / ${cell(CALL,FIVE,0).toFixed(1)}`);
console.log("pack of 12, careful/casual       71.2 / 47.1        "
  + `${cell(C12,TWELVE,8).toFixed(1)} / ${cell(C12,TWELVE,0).toFixed(1)}`.padEnd(18)
  + `${cell(CALL,TWELVE,8).toFixed(1)} / ${cell(CALL,TWELVE,0).toFixed(1)}`);
console.log("pack of 12, no guarantee         68.5 / 50.4        "
  + `${cell(C12,TWELVE,8,8,false).toFixed(1)} / ${cell(C12,TWELVE,0,8,false).toFixed(1)}`.padEnd(18)
  + `${cell(CALL,TWELVE,8,8,false).toFixed(1)} / ${cell(CALL,TWELVE,0,8,false).toFixed(1)}`);
console.log("depth 8/12/14/24 careful         68.3 67.0 67.0 66.5   "
  + [8,12,14,24].map(d=>cell(C12,TWELVE,8,d).toFixed(1)).join(" ")
  + "   " + [8,12,14,24].map(d=>cell(CALL,TWELVE,8,d).toFixed(1)).join(" "));
