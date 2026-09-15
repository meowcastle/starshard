const E=require("./manzil-engine-v6-AUG24.js");
const SKY=[101,102,103,104,105], CHART5=[5,6,10,17,18];
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
// randomness-theory 5.3 assumes boards are independent. manzil-sim-report 199 says they
// are not, because the lead alternates and the lead is worth a lot. so measure it.
function match(C, pack, tonight, seed, yd, bestOf){
  const need=Math.ceil(bestOf/2); let w=0,l=0,b=0, lead="you";
  while(w<need && l<need){
    const hand=E.deal(pack, seed*100+b, tonight, true);
    const r=E.playBoard({C,you:hand.slice(),sky:SKY.slice(),tonight,leader:lead,depth:8,youDepth:yd});
    if(r.winner==="you") w++; else l++;
    lead = lead==="you" ? "sky" : "you";           // the lead alternates each board
    b++;
  }
  return {won:w>l, boards:b};
}
function cell(yd,bestOf,trials){
  let mw=0,mt=0,bt=0;
  for(let tr=0;tr<trials;tr++){
    const r0=rng(9001+tr*7919);
    const rest=Array.from({length:28},(_,i)=>i+1).filter(x=>!CHART5.includes(x));
    for(let i=rest.length-1;i>0;i--){const j=Math.floor(r0()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
    const pack=CHART5.concat(rest.slice(0,1));
    const C=E.makeCards({lvl:2});
    for(let n=1;n<=28;n++){
      const m=match(C,pack,n,tr*1000+n,yd,bestOf);
      mt++; bt+=m.boards; if(m.won) mw++;
    }
  }
  return {win:+(100*mw/mt).toFixed(1), boards:+(bt/mt).toFixed(2)};
}
const TR=20;
console.log("format        strong player   weak player    gap    boards/battle");
for(const b of [1,3,5,7]){
  const a=cell(8,b,TR), c=cell(0,b,TR);
  console.log(`  best of ${b}     ${a.win.toFixed(1).padStart(6)}        ${c.win.toFixed(1).padStart(6)}     ${(a.win-c.win).toFixed(1).padStart(5)}      ${a.boards.toFixed(2)}`);
}
