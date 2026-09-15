const E=require("./manzil-engine-v6-AUG24.js");
const SKY=[101,102,103,104,105], CHART5=[5,6,10,17,18];
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
// two regimes for the cards you have collected beyond your chart five:
//   awake  = signature live (what the last sweep measured, the best case)
//   asleep = numbers only, ab:null (what the game actually hands you: "on loan, asleep at level one")
function cards(awakeIds, asleep){
  const C=E.makeCards({lvl:2});
  if(asleep) for(let i=1;i<=28;i++) if(!awakeIds.includes(i)) C[i]={...C[i], lvl:1, ab:null, twoFaced:false};
  return C;
}
function cell(k, yd, asleep, trials){
  let w=0,t=0;
  for(let tr=0;tr<trials;tr++){
    const r0=rng(9001+tr*7919);
    const rest=Array.from({length:28},(_,i)=>i+1).filter(x=>!CHART5.includes(x));
    for(let i=rest.length-1;i>0;i--){const j=Math.floor(r0()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
    const pack=CHART5.concat(rest.slice(0,Math.max(0,k-5)));
    const C=cards(CHART5, asleep);
    for(let n=1;n<=28;n++) for(const L of ["you","sky"]){
      const hand=E.deal(pack, 4000+tr*100+n, n, true);
      const r=E.playBoard({C,you:hand.slice(),sky:SKY.slice(),tonight:n,leader:L,depth:8,youDepth:yd});
      t++; if(r.winner==="you") w++;
    }
  }
  return +(100*w/t).toFixed(1);
}
const TR=12;
console.log("pack   ALL AWAKE            AS THE GAME GIVES THEM (new cards asleep)");
console.log("       careful  casual      careful  casual      careful cost of waking");
for(const k of [5,6,7,8,10,12,16,28]){
  const aw=cell(k,8,false,TR), ac=cell(k,0,false,TR);
  const sw=cell(k,8,true,TR),  sc=cell(k,0,true,TR);
  console.log(`${String(k).padStart(4)}  ${aw.toFixed(1).padStart(7)} ${ac.toFixed(1).padStart(7)}     ${sw.toFixed(1).padStart(7)} ${sc.toFixed(1).padStart(7)}      ${(aw-sw).toFixed(1).padStart(6)}`);
}
