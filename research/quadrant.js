const E=require("./manzil-engine-v6-AUG24.js");
const CHART5=[5,6,10,17,18], SKY=[101,102,103,104,105];
// the four symbols, straight from mansions-table.json's fy_god column.
// mansion 2 is unassigned in the table and belongs to Byakko by position.
const QUAD={
  byakko:[1,2,3,4,5,6,28],     // white tiger, west, metal
  suzaku:[7,8,9,10,11,12,13],  // vermilion bird, south, fire   <- the throne (10) lives here
  seiryuu:[14,15,16,17,18,19,20], // azure dragon, east, growth
  genbu:[21,22,23,24,25,26,27] // black tortoise, north, water
};
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
function packOf(size,tr){
  const r0=rng(4711+tr*7919);
  const rest=Array.from({length:28},(_,i)=>i+1).filter(x=>!CHART5.includes(x));
  for(let i=rest.length-1;i>0;i--){const j=Math.floor(r0()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
  return CHART5.concat(rest.slice(0,Math.max(0,size-5)));
}
function cards(pack, turners){
  const C=E.makeCards({lvl:2});
  for(let i=1;i<=28;i++) if(!CHART5.includes(i)) C[i]={...C[i], lvl:1, ab:null, twoFaced:false};
  for(const id of pack) if(turners.includes(id))
    C[id]={...C[id], lvl:3, ab:E.makeCards({lvl:2})[id].ab, twoFaced:true};
  return C;
}
function run(size,turners,yd,trials){
  let w=0,t=0;
  for(let tr=0;tr<trials;tr++){
    const pack=packOf(size,tr), C=cards(pack,turners);
    for(let n=1;n<=28;n++) for(const L of ["you","sky"]){
      const hand=E.deal(pack,7000+tr*100+n,n,true);
      const r=E.playBoard({C,you:hand.slice(),sky:SKY.slice(),tonight:n,leader:L,depth:8,youDepth:yd});
      t++; if(r.winner==="you") w++;
    }
  }
  return +(100*w/t).toFixed(1);
}
const ALL=Array.from({length:28},(_,i)=>i+1);
const TR=14;
console.log("THE TURN AS ONE QUADRANT'S GRANT vs EVERYONE'S  (784 boards a cell)\n");
console.log("pack   who can turn            careful  casual  skill gap");
for(const size of [6,12,28]){
  for(const [nm,set] of [["nobody (today)",[]],["one quadrant (7 cards)",QUAD.seiryuu],
                         ["two quadrants (14)",QUAD.seiryuu.concat(QUAD.genbu)],["all 28",ALL]]){
    const a=run(size,set,8,TR), b=run(size,set,0,TR);
    console.log(` ${String(size).padStart(3)}   ${nm.padEnd(22)} ${a.toFixed(1).padStart(6)}  ${b.toFixed(1).padStart(6)}  ${(a-b).toFixed(1).padStart(8)}`);
  }
  console.log("");
}
console.log("bands: careful 55-65 · casual 35-45 · skill gap 20+");
