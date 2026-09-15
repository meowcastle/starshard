const E=require("./manzil-engine-v6-AUG24.js");
const SKY=[101,102,103,104,105], CHART5=[5,6,10,17,18];
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
// deal(), but guaranteeing at least `minAwake` cards whose signature is live.
// everything else identical to the shipped xorshift deal.
function deal2(pack, seed, tonight, awake, minAwake){
  if(!pack||pack.length<=5) return (pack||[]).slice();
  let h=(seed^2166136261)>>>0;
  const rnd=()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};
  const bag=pack.slice(), out=[];
  if(bag.includes(tonight)) out.push(bag.splice(bag.indexOf(tonight),1)[0]);
  let live=out.filter(x=>awake.includes(x)).length;
  while(live<minAwake && out.length<5){
    const idx=bag.map((c,i)=>[c,i]).filter(([c])=>awake.includes(c));
    if(!idx.length) break;
    const pick=idx[Math.floor(rnd()*idx.length)][1];
    out.push(bag.splice(pick,1)[0]); live++;
  }
  while(out.length<5&&bag.length) out.push(bag.splice(Math.floor(rnd()*bag.length),1)[0]);
  return out;
}
function cell(k,yd,minAwake,trials){
  let w=0,t=0;
  for(let tr=0;tr<trials;tr++){
    const r0=rng(9001+tr*7919);
    const rest=Array.from({length:28},(_,i)=>i+1).filter(x=>!CHART5.includes(x));
    for(let i=rest.length-1;i>0;i--){const j=Math.floor(r0()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
    const pack=CHART5.concat(rest.slice(0,Math.max(0,k-5)));
    const C=E.makeCards({lvl:2});
    for(let i=1;i<=28;i++) if(!CHART5.includes(i)) C[i]={...C[i],lvl:1,ab:null,twoFaced:false};
    for(let n=1;n<=28;n++) for(const L of ["you","sky"]){
      const hand=deal2(pack,4000+tr*100+n,n,CHART5,minAwake);
      const r=E.playBoard({C,you:hand.slice(),sky:SKY.slice(),tonight:n,leader:L,depth:8,youDepth:yd});
      t++; if(r.winner==="you") w++;
    }
  }
  return +(100*w/t).toFixed(1);
}
const TR=12;
console.log("new cards asleep. 'floor' = minimum awake cards guaranteed in the five.\n");
console.log("pack   floor 0 (shipped)   floor 1      floor 2      floor 3");
console.log("       careful casual      car cas      car cas      car cas");
for(const k of [8,12,16,28]){
  const row=[0,1,2,3].map(m=>[cell(k,8,m,TR),cell(k,0,m,TR)]);
  console.log(`${String(k).padStart(4)}  ${row.map(([a,b])=>`${a.toFixed(1).padStart(5)} ${b.toFixed(1).padStart(5)}`).join("   ")}`);
}
console.log("\nfor reference, pack of 5 (no deal fires): careful 62.5  casual 37.5");
