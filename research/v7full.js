const E=require("./manzil-engine-v7-l34.js");
const CHART5=[5,6,10,17,18], SKY=[101,102,103,104,105];
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
function packOf(size,tr){const r0=rng(4711+tr*7919);
  const rest=Array.from({length:28},(_,i)=>i+1).filter(x=>!CHART5.includes(x));
  for(let i=rest.length-1;i>0;i--){const j=Math.floor(r0()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
  return CHART5.concat(rest.slice(0,Math.max(0,size-5)));}
function cards(pack,l3,l4){
  const levels={};
  for(const id of pack) levels[id]= l4.includes(id)?4 : l3.includes(id)?3 : (CHART5.includes(id)?2:1);
  const C=E.makeCards({lvl:2, levels});
  for(let i=1;i<=28;i++) if(!pack.includes(i)) C[i]={...C[i],lvl:1,ab:null,twoFaced:false};
  for(const id of pack) if(levels[id]===1) C[id]={...C[id],lvl:1,ab:null,twoFaced:false};
  return C;
}
function run(size,mode,yd,trials){
  let w=0,t=0;
  for(let tr=0;tr<trials;tr++){
    const pack=packOf(size,tr);
    const l3 = mode==="none"?[]:pack;
    const l4 = mode==="l3+l4"?pack.slice(0,3):[];      // three cards unleashed
    const C=cards(pack,l3,l4);
    for(let n=1;n<=28;n++) for(const L of ["you","sky"]){
      const std = l4.length? l4[n % l4.length] : null;  // the player's nominated standard
      const hand=E.deal(pack,7000+tr*100+n,n,true,std);
      const r=E.playBoard({C,you:hand.slice(),sky:SKY.slice(),tonight:n,leader:L,depth:8,youDepth:yd});
      t++; if(r.winner==="you") w++;
    }
  }
  return +(100*w/t).toFixed(1);
}
const TR=14;
console.log("\nTHE FULL SYSTEM  (784 boards a cell)   bands: careful 55-65 · casual 35-45 · gap 20+\n");
console.log("pack   L1/L2 only        + all four L3 grants     + L4 standard bearer");
for(const size of [6,12,20,28]){
  const r=[];
  for(const m of ["none","l3","l3+l4"]) r.push([run(size,m,8,TR), run(size,m,0,TR)]);
  console.log(` ${String(size).padStart(3)}    ${r.map(([a,b])=>`${a.toFixed(1).padStart(5)} / ${b.toFixed(1).padStart(5)}`).join("      ")}`);
}
