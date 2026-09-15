const E=require("./manzil-engine-v6-AUG24.js");
const SKY=[101,102,103,104,105], C=E.makeCards({lvl:2});
const TWELVE=[5,6,10,17,18,16,15,13,19,23,24,4];
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
// the SAME twelve, dealt to the same five cards, but the HAND handed to the agent
// in a different order each trial. deal() is bypassed so only order varies.
function cell(perm, yd){
  let w=0,t=0;
  for(let n=1;n<=28;n++) for(const L of ["you","sky"]){
    let hand=E.deal(TWELVE, 12345+n, n, true).slice();
    const r0=rng(perm*7919+n);
    for(let i=hand.length-1;i>0;i--){const j=Math.floor(r0()*(i+1));[hand[i],hand[j]]=[hand[j],hand[i]];}
    const r=E.playBoard({C,you:hand,sky:SKY.slice(),tonight:n,leader:L,depth:8,youDepth:yd});
    t++; if(r.winner==="you") w++;
  }
  return 100*w/t;
}
const careful=[], casual=[];
for(let p=0;p<40;p++){careful.push(cell(p,8)); casual.push(cell(p,0));}
const st=a=>{a=a.slice().sort((x,y)=>x-y);return{min:a[0].toFixed(1),max:a[a.length-1].toFixed(1),med:a[20].toFixed(1),mean:(a.reduce((s,x)=>s+x,0)/a.length).toFixed(1)};};
console.log("same twelve, same dealt five, 40 different HAND ORDERS (56 boards each):");
console.log("  careful:", JSON.stringify(st(careful)));
console.log("  casual :", JSON.stringify(st(casual)));
