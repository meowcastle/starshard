const E=require("./manzil-engine-v7-l34.js");
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
// PvP: BOTH hands are real mansion cards. the sky seat is just the second player.
function cards(l3A,l3B){
  const levels={};
  for(let i=1;i<=28;i++) levels[i]=2;
  for(const id of l3A) levels[id]=3;
  const C=E.makeCards({lvl:2, levels});
  // seat B gets loaner copies at 200+id so both seats can hold the same mansion
  for(let i=1;i<=28;i++){
    const lv = l3B.includes(i) ? 3 : 2;
    const base=E.makeCards({lvl:2, levels:{[i]:lv}})[i];
    C[200+i]={...base, id:200+i, who:"sky", homeM:i};
  }
  return C;
}
function run(l3A,l3B,ydA,ydB,trials){
  let a=0,b=0,t=0, leadWins=0;
  for(let tr=0;tr<trials;tr++){
    const r0=rng(1234+tr*7919);
    for(let n=1;n<=28;n++) for(const L of ["you","sky"]){
      const pool=Array.from({length:28},(_,i)=>i+1);
      for(let i=pool.length-1;i>0;i--){const j=Math.floor(r0()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
      const handA=pool.slice(0,5), handB=pool.slice(5,10).map(x=>200+x);
      const C=cards(l3A,l3B);
      const r=E.playBoard({C,you:handA,sky:handB,tonight:n,leader:L,depth:ydB,youDepth:ydA});
      t++; if(r.winner==="you"){a++; if(L==="you") leadWins++;} else {b++; if(L==="sky") leadWins++;}
    }
  }
  return {A:+(100*a/t).toFixed(1), B:+(100*b/t).toFixed(1), lead:+(100*leadWins/t).toFixed(1), draws:+(100*(t-a-b)/t).toFixed(1)};
}
const ALL=Array.from({length:28},(_,i)=>i+1), NONE=[];
const TR=10;
console.log("PLAYER vs PLAYER — both hands are real mansion cards (560 boards a cell)\n");
console.log("setup                                    seat A   seat B   draws   the LEAD wins");
for(const [nm,la,lb,ya,yb] of [
  ["both equal skill, nobody at L3",       NONE,NONE,8,8],
  ["both equal skill, BOTH at L3",         ALL,ALL,8,8],
  ["equal skill, only A at L3",            ALL,NONE,8,8],
  ["A careful vs B greedy, nobody at L3",  NONE,NONE,8,0],
  ["A careful vs B greedy, both at L3",    ALL,ALL,8,0],
]){
  const r=run(la,lb,ya,yb,TR);
  console.log(`  ${nm.padEnd(38)} ${r.A.toFixed(1).padStart(5)}  ${r.B.toFixed(1).padStart(6)}  ${r.draws.toFixed(1).padStart(6)}   ${r.lead.toFixed(1).padStart(6)}%`);
}
