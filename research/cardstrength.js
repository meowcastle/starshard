const E=require("./manzil-engine-v6-AUG24.js");
const CHART5=[5,6,10,17,18];
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
// opponent cards are loaner copies of the mansions, sky-side: ids 200+i (district.js convention)
function cards(sigOn){
  const C=E.makeCards({lvl:2});
  for(let i=1;i<=28;i++) C[200+i]={...C[i], id:200+i, who:"sky", lvl:sigOn?2:1,
                                   ab: sigOn?C[i].ab:null, twoFaced:false, homeM:i};
  return C;
}
// player: pack of six, chart five awake + one extra awake. fixed across the whole table.
function playerPack(tr){
  const r0=rng(9001+tr*7919);
  const rest=Array.from({length:28},(_,i)=>i+1).filter(x=>!CHART5.includes(x));
  for(let i=rest.length-1;i>0;i--){const j=Math.floor(r0()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
  return CHART5.concat(rest.slice(0,1));
}
// strength of card X in the opponent's hand: X plus four random others, averaged.
function strength(C, X, yd, trials){
  let w=0,t=0;
  for(let tr=0;tr<trials;tr++){
    const r0=rng(X*104729+tr*7919);
    const others=Array.from({length:28},(_,i)=>i+1).filter(x=>x!==X);
    for(let i=others.length-1;i>0;i--){const j=Math.floor(r0()*(i+1));[others[i],others[j]]=[others[j],others[i]];}
    const skyHand=[200+X, ...others.slice(0,4).map(x=>200+x)];
    const pack=playerPack(tr);
    for(let n=1;n<=28;n++) for(const L of ["you","sky"]){
      const hand=E.deal(pack, 7000+tr*100+n, n, true);
      const r=E.playBoard({C,you:hand.slice(),sky:skyHand.slice(),tonight:n,leader:L,depth:8,youDepth:yd});
      t++; if(r.winner==="you") w++;
    }
  }
  return +(100*w/t).toFixed(1);
}
const TR=4;   // 4 companion draws x 28 nights x 2 leads = 224 boards per card
const out={};
for(const sigOn of [false,true]){
  const C=cards(sigOn);
  out[sigOn?"awake":"asleep"]={};
  for(let X=1;X<=28;X++) out[sigOn?"awake":"asleep"][X]={
    strong: strength(C,X,8,TR), weak: strength(C,X,0,TR)};
}
require("fs").writeFileSync("cardstrength.json", JSON.stringify(out,null,1));
const names=E.makeCards({lvl:2});
const rows=[];
for(let X=1;X<=28;X++) rows.push([X, names[X].name, out.asleep[X].strong, out.awake[X].strong, out.asleep[X].strong-out.awake[X].strong]);
rows.sort((a,b)=>a[3]-b[3]);
console.log("player win% when this card is in the opponent's hand (lower = stronger opponent card)");
console.log("  #  card              asleep  awake   signature worth");
for(const r of rows) console.log(`  ${String(r[0]).padStart(2)}  ${r[1].padEnd(16)} ${r[2].toFixed(1).padStart(6)} ${r[3].toFixed(1).padStart(6)}  ${r[4].toFixed(1).padStart(6)}`);
