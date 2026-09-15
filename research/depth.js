const E=require("./manzil-engine-v6-AUG24.js");
const SKY=[101,102,103,104,105], CHART5=[5,6,10,17,18];
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
// the live game sets her reading depth to  rung + (your card's level * 2).
// so LEVELLING A CARD MAKES HER READ DEEPER on that mansion's road.
// question: who does deeper reading actually punish?
function cell(depth,yd,trials){
  let w=0,t=0;
  for(let tr=0;tr<trials;tr++){
    const r0=rng(9001+tr*7919);
    const rest=Array.from({length:28},(_,i)=>i+1).filter(x=>!CHART5.includes(x));
    for(let i=rest.length-1;i>0;i--){const j=Math.floor(r0()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
    const pack=CHART5.concat(rest.slice(0,1));           // a pack of six
    const C=E.makeCards({lvl:2});
    for(let n=1;n<=28;n++) for(const L of ["you","sky"]){
      const hand=E.deal(pack,4000+tr*100+n,n,true);
      const r=E.playBoard({C,you:hand.slice(),sky:SKY.slice(),tonight:n,leader:L,depth,youDepth:yd});
      t++; if(r.winner==="you") w++;
    }
  }
  return +(100*w/t).toFixed(1);
}
const TR=10;
console.log("her reading depth   strong player   weak player   gap");
for(const d of [3,5,8,11,14,17,20,22]){
  const a=cell(d,8,TR), b=cell(d,0,TR);
  console.log(`  depth ${String(d).padStart(2)}          ${a.toFixed(1).padStart(6)}        ${b.toFixed(1).padStart(6)}     ${(a-b).toFixed(1).padStart(5)}`);
}
console.log("\n(live game: depth = rung + card level x 2. rungs run 3..11, boss 14.)");
console.log("so a level-1 card on rung 1 = depth 5; a level-4 card at the boss = depth 22.");
