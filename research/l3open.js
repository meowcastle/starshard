const E=require("./manzil-engine-v6-AUG24.js");
const CHART5=[5,6,10,17,18], SKY=[101,102,103,104,105];
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
function cards(pack,nL3){
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
// randomness-theory 5.4 metric #5: how many DISTINCT opening moves are optimal across the
// shuffle space. low = the opening is memorisable. this is the direct measure of the thing
// the deal was introduced to fix.
function entropy(size,nL3,trials){
  const seen=new Map(); let n=0;
  for(let tr=0;tr<trials;tr++){
    const pack=packOf(size,tr), C=cards(pack,Math.min(nL3,pack.length));
    for(let t=1;t<=28;t++){
      const hand=E.deal(pack,7000+tr*100+t,t,true);
      const g=E.mkGame({C,tonight:t,you:hand.slice(),sky:SKY.slice(),leader:"you",depth:8});
      g.youDepth=8;
      const mv=E.youMove(g);
      const slot=mv.r.slots.findIndex((s,i)=>s&&!g.slots[i]);
      const key=`${mv.id}@${slot}${mv.rev?"R":""}`;
      seen.set(key,(seen.get(key)||0)+1); n++;
    }
  }
  const counts=[...seen.values()].sort((a,b)=>b-a);
  const top=counts[0]/n;
  const H=-counts.reduce((s,c)=>{const p=c/n; return s+p*Math.log2(p);},0);
  let cover=0,k=0; for(const c of counts){cover+=c; k++; if(cover/n>=0.8) break;}
  return {distinct:seen.size, topShare:+(100*top).toFixed(1), bits:+H.toFixed(2), openingsFor80pct:k, n};
}
const TR=14;
console.log("DOES THE TURN MAKE THE OPENING MORE OR LESS SOLVABLE?");
console.log("(distinct optimal first moves across 392 boards; more = harder to memorise)\n");
console.log("pack  cards at L3   distinct  most-common  entropy  openings covering 80%");
for(const size of [6,12,28]){
  for(const frac of [0,0.5,1]){
    const nL3=Math.round(size*frac);
    const e=entropy(size,nL3,TR);
    const tag=frac===0?"none":frac===1?"all":"half";
    console.log(` ${String(size).padStart(3)}  ${tag.padEnd(12)}  ${String(e.distinct).padStart(7)}  ${(e.topShare+"%").padStart(10)}  ${e.bits.toFixed(2).padStart(6)}  ${String(e.openingsFor80pct).padStart(10)}`);
  }
  console.log("");
}
