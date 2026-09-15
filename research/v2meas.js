// THE LEVEL-2 CHOICE, measured per card.
// For each of the 28: play the same boards twice, once with the card's signature live and once
// with the signature off and +1 on both faces instead. The difference is the choice.
const E = require("/tmp/now2/v2.js");

const REPS = Number(process.argv[2] || 6);
const LEN = 9, HAND = 7;

function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}

// seven from twenty-eight, with the card under test guaranteed
function deal(seed, must){
  const r=rng(seed), bag=Array.from({length:28},(_,i)=>i+1), out=[];
  if(must){ out.push(bag.splice(bag.indexOf(must),1)[0]); }
  while(out.length<HAND) out.push(bag.splice(Math.floor(r()*bag.length),1)[0]);
  return out;
}

function cell(testId, useBump, youDepth, seedOff){
  const bump = useBump ? { [testId]: 1 } : null;
  const C = E.makeCards({ lvl: 2, bump });
  for(let i=1;i<=28;i++) C[200+i] = { ...E.makeCards({lvl:2})[i], id:200+i, who:"sky", homeM:i };
  let win=0, tot=0;
  for(let m=1;m<=28;m++){
    for(let tr=0; tr<REPS; tr++){
      const you = deal(4000+seedOff+tr*7919+m*131, testId);
      const her = deal(9000+seedOff+tr*613+m*29, null).map(x=>200+x);
      for(const L of ["you","sky"]){
        const r = E.playBoard({C, you:you.slice(), sky:her.slice(), tonight:m,
                               leader:L, len:LEN, depth:8, youDepth});
        tot++; if(r.winner==="you") win++;
      }
    }
  }
  return 100*win/tot;
}

const NAMES = {}; E.POOL.forEach((p,i)=>NAMES[i+1]=p[0]);
const t0 = Date.now();
const rows = [];
for(let id=1; id<=28; id++){
  let sig=0, bmp=0;
  for(const off of [0, 50000]){ sig += cell(id,false,8,off); bmp += cell(id,true,8,off); }
  rows.push({ id, name:NAMES[id], quad:E.QUAD[id], sig:sig/2, bmp:bmp/2, d:(sig-bmp)/2 });
  process.stderr.write(".");
}
console.log("\nTHE LEVEL-2 CHOICE. " + (28*REPS*2*2) + " boards a cell, two seeds.");
console.log("'signature' and '+1/+1' are the player's win rate with each branch taken.");
console.log("'choice' is signature minus bump. Near zero is a real decision.\n");
console.log("  #  card                 quad      signature   +1/+1   choice   verdict");
const sorted = rows.slice().sort((a,b)=>b.d-a.d);
for(const r of sorted){
  const v = r.d > 3 ? "signature wins" : r.d < -3 ? "numbers win" : "a real choice";
  console.log("  "+String(r.id).padStart(2)+"  "+r.name.padEnd(20)+r.quad.padEnd(10)
    +r.sig.toFixed(1).padStart(8)+r.bmp.toFixed(1).padStart(9)
    +((r.d>=0?"+":"")+r.d.toFixed(1)).padStart(9)+"   "+v);
}
console.log("\n  " + sorted.filter(r=>r.d>3).length + " signature wins · "
  + sorted.filter(r=>Math.abs(r.d)<=3).length + " a real choice · "
  + sorted.filter(r=>r.d<-3).length + " numbers win");
console.log("  " + ((Date.now()-t0)/1000).toFixed(0) + "s");
require("fs").writeFileSync("/tmp/now2/v2meas.json", JSON.stringify(rows,null,1));
