const E = require('./manzil-engine-v6.js');
const FIVE=[5,6,10,17,18], SKY=[101,102,103,104,105];
// ownAll:false — the chart five awake, everything else a loaner. walkers are loaner mansions, sky-side.
function cards(){
  const C=E.makeCards({lvl:2});
  for(let i=1;i<=28;i++) if(!FIVE.includes(i)) C[i]={...C[i], lvl:1, ab:null};
  for(let i=1;i<=28;i++) C[200+i]={...C[i], id:200+i, who:"sky", lvl:1, ab:null, twoFaced:false, homeM:i};
  return C;
}
const C=cards();
const RUNGS=[[[201,202,208,211,227],3],[[203,207,212,219,222],4],[[204,214,213,226,216],5],
             [[205,209,217,223,225],6],[[202,210,216,220,228],7],[[206,215,218,210,220],8],
             [[201,213,219,224,226],9],[[206,215,218,221,224],11]];
function cell(skyHand,depth,yd,nights){
  let w=0,t=0;
  for(const n of nights) for(const L of["you","sky"]){
    const r=E.playBoard({C,you:FIVE.slice(),sky:skyHand.slice(),tonight:n,leader:L,depth,youDepth:yd});
    t++; if(r.winner==="you") w++;
  }
  return +(100*w/t).toFixed(1);
}
const N21=[21], ALL=Array.from({length:28},(_,i)=>i+1);
console.log("THE EMPTY DISTRICT friend-build: chart five, no deal (pack of 5)\n");
console.log("rung           reads    night 21 careful/casual     all 28 nights careful/casual");
RUNGS.forEach(([h,d],k)=>{
  console.log(`  rung ${String(k+1).padEnd(2)}       ${String(d).padEnd(6)}   ${cell(h,d,8,N21).toFixed(1)} / ${cell(h,d,0,N21).toFixed(1)}`.padEnd(58)
    + `${cell(h,d,8,ALL).toFixed(1)} / ${cell(h,d,0,ALL).toFixed(1)}`);
});
console.log(`  rung 9 (sky) 14       ${cell(SKY,14,8,N21).toFixed(1)} / ${cell(SKY,14,0,N21).toFixed(1)}`.padEnd(58)
  + `${cell(SKY,14,8,ALL).toFixed(1)} / ${cell(SKY,14,0,ALL).toFixed(1)}`);
console.log(`\n  for contrast, the sky at her table depth 8:`.padEnd(58)+`${cell(SKY,8,8,ALL).toFixed(1)} / ${cell(SKY,8,0,ALL).toFixed(1)}`);
