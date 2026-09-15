// 7a the second strike: how often it arms, fires, and takes. m7 slid (t3), real placements, 448 boards a cell.
const E=require("/tmp/now2/v2.js");
const REPS=Number(process.argv[2]||8), LEN=9, HAND=7, T=3;
const RULES={suzakuReach:true, suzakuBase:true, genbuDead:true, drawTo:"defender"};
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
function deal(seed){const r=rng(seed),bag=Array.from({length:28},(_,i)=>i+1),o=[];while(o.length<HAND)o.push(bag.splice(Math.floor(r()*bag.length),1)[0]);return o;}
function deck(levelOf, side){const abOff={}, grants={}, addR={};for(let i=1;i<=28;i++){const L=levelOf(i);if(L<2)abOff[i]=true;if(L>=3)grants[i]=true;if(L>=4)addR[i]=1;}
  const C=E.makeCards({lvl:2, abOff, grants, addR}); if(side==="you")return C; const o={};for(let i=1;i<=28;i++)o[200+i]={...C[i],id:200+i,who:"sky",homeM:i};return o;}
const SUN=14, PLANETS=[1,7,20,24,11];
const STATES=[{label:"fresh",f:i=>i===SUN?3:PLANETS.includes(i)?2:1},{label:"deep ",f:()=>3}];
for(const s of STATES) s.C=Object.assign({},deck(s.f,"you"),deck(s.f,"sky"));
console.log("  collection   armed/board   fired/board   took/board   (fired that took)");
for(const S of STATES){ let b=0,a=0,f=0,t=0;
  for(const leader of ["you","sky"]) for(let m=1;m<=28;m++) for(let i=0;i<REPS;i++){ const sd=3000+m*131+i*911;
    const r=E.playBoard(Object.assign({C:S.C, you:deal(sd), sky:deal(sd+50021).map(x=>200+x), tonight:T, leader, len:LEN, depth:8, youDepth:8, againAt:4}, RULES));
    b++; a+=r.aArmed; f+=r.aFired; t+=r.aTook; }
  console.log("  "+S.label+"   "+(a/b).toFixed(2).padStart(10)+(f/b).toFixed(2).padStart(14)+(t/b).toFixed(2).padStart(13)+"   "+(f?(100*t/f).toFixed(0):0)+"%"); }
