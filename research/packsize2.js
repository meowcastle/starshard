const E = require("./manzil-engine-v6-AUG24.js");
const SKY=[101,102,103,104,105];
const C=E.makeCards({lvl:2});
const CHART5=[5,6,10,17,18];
// isolate SIZE from COMPOSITION: the chart five are always yours, the rest are
// random draws from the remaining 23, resampled per trial.
function rng(seed){let h=(seed^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
function cell(k, yd, trials){
  let w=0,t=0,fl=0,cl=0;
  for (let tr=0; tr<trials; tr++){
    const r0=rng(9001+tr*7919);
    const rest=Array.from({length:28},(_,i)=>i+1).filter(x=>!CHART5.includes(x));
    for(let i=rest.length-1;i>0;i--){const j=Math.floor(r0()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
    const pack=CHART5.concat(rest.slice(0,Math.max(0,k-5)));
    for (let n=1;n<=28;n++) for (const L of ["you","sky"]){
      const hand=E.deal(pack, 4000+tr*100+n, n, true);
      const r=E.playBoard({C, you:hand.slice(), sky:SKY.slice(), tonight:n, leader:L, depth:8, youDepth:yd});
      t++; fl+=r.flips; if(Math.abs(r.you-r.sky)<=1) cl++; if(r.winner==="you") w++;
    }
  }
  return {win:+(100*w/t).toFixed(1), flips:+(fl/t).toFixed(2), close:+(100*cl/t).toFixed(1), n:t};
}
const TR=16;   // 16 random packs per size => 896 boards per cell
console.log(`pack  careful  casual   gap   flips  close%    n   (${TR} random packs per size)`);
for (const k of [5,6,7,8,9,10,12,14,16,20,28]){
  const a=cell(k,8,TR), b=cell(k,0,TR);
  console.log(`${String(k).padStart(4)}  ${a.win.toFixed(1).padStart(7)}  ${b.win.toFixed(1).padStart(6)}  ${(a.win-b.win).toFixed(1).padStart(5)}  ${a.flips.toFixed(2).padStart(5)}  ${a.close.toFixed(1).padStart(6)}  ${String(a.n).padStart(5)}`);
}
