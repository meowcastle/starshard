const E=require("./manzil-engine-v6-AUG24.js");
const CHART5=[5,6,10,17,18], SKY=[101,102,103,104,105];
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
// player's cards: chart five awake, the rest of the pack asleep (as the game gives them).
// nL3 of the OWNED cards are familiar -> two-faced. the sky never gets it; L3 is a player level.
function cards(pack, nL3){
  const C=E.makeCards({lvl:2});
  for(let i=1;i<=28;i++) if(!CHART5.includes(i)) C[i]={...C[i], lvl:1, ab:null, twoFaced:false};
  for(const id of pack.slice(0,nL3)) C[id]={...C[id], lvl:3, ab:E.makeCards({lvl:2})[id].ab, twoFaced:true};
  return C;
}
function packOf(size,tr){
  const r0=rng(4711+tr*7919);
  const rest=Array.from({length:28},(_,i)=>i+1).filter(x=>!CHART5.includes(x));
  for(let i=rest.length-1;i>0;i--){const j=Math.floor(r0()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
  return CHART5.concat(rest.slice(0,Math.max(0,size-5)));
}
function run(size,nL3,yd,trials){
  let w=0,t=0,fl=0,mg=0,cl=0;
  for(let tr=0;tr<trials;tr++){
    const pack=packOf(size,tr), C=cards(pack,Math.min(nL3,pack.length));
    for(let n=1;n<=28;n++) for(const L of ["you","sky"]){
      const hand=E.deal(pack,7000+tr*100+n,n,true);
      const r=E.playBoard({C,you:hand.slice(),sky:SKY.slice(),tonight:n,leader:L,depth:8,youDepth:yd});
      t++; fl+=r.flips; mg+=Math.abs(r.you-r.sky); if(Math.abs(r.you-r.sky)<=1) cl++;
      if(r.winner==="you") w++;
    }
  }
  return {win:+(100*w/t).toFixed(1), flips:+(fl/t).toFixed(2), margin:+(mg/t).toFixed(2), close:+(100*cl/t).toFixed(1)};
}
const TR=14;
console.log("1. HOW IT SCALES AS THE PLAYER LEVELS CARDS  (784 boards a cell)\n");
console.log("pack  cards at L3   careful  casual  skill gap");
for(const size of [6,8,12,20,28]){
  for(const frac of [0, 0.5, 1]){
    const nL3=Math.round(size*frac);
    const a=run(size,nL3,8,TR), b=run(size,nL3,0,TR);
    const tag = frac===0?"none":frac===1?"all of them":"half";
    console.log(` ${String(size).padStart(3)}  ${tag.padEnd(12)}  ${a.win.toFixed(1).padStart(6)}  ${b.win.toFixed(1).padStart(6)}  ${(a.win-b.win).toFixed(1).padStart(8)}`);
  }
  console.log("");
}
console.log("2. DOES IT CHANGE HOW A BOARD FEELS? (pack of twelve, careful)\n");
console.log("cards at L3   win     flips   margin  close%");
for(const nL3 of [0,3,6,12]){
  const a=run(12,nL3,8,TR);
  console.log(`  ${String(nL3).padStart(2)}          ${a.win.toFixed(1).padStart(5)}   ${a.flips.toFixed(2)}    ${a.margin.toFixed(2)}    ${a.close.toFixed(1)}`);
}
