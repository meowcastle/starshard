// m9 telemetry: the door-order row (who lodges the door first, plain) and the far-strike rate (the two stars, both, printed).
const E=require("/tmp/now2/v2.js");
const REPS=Number(process.argv[2]||8), LEN=9, HAND=7, T=9;
const RULES={suzakuReach:true, suzakuBase:true, genbuDead:true, drawTo:"defender"};
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
function deal(seed){const r=rng(seed),bag=Array.from({length:28},(_,i)=>i+1),o=[];while(o.length<HAND)o.push(bag.splice(Math.floor(r()*bag.length),1)[0]);return o;}
function deck(levelOf, side){const abOff={}, grants={}, addR={};for(let i=1;i<=28;i++){const L=levelOf(i);if(L<2)abOff[i]=true;if(L>=3)grants[i]=true;if(L>=4)addR[i]=1;}
  const C=E.makeCards({lvl:2, abOff, grants, addR}); if(side==="you")return C; const o={};for(let i=1;i<=28;i++)o[200+i]={...C[i],id:200+i,who:"sky",homeM:i};return o;}
const SUN=14, PLANETS=[1,7,20,24,11];
const STATES=[{label:"fresh",f:i=>i===SUN?3:PLANETS.includes(i)?2:1},{label:"deep ",f:()=>3}];
for(const s of STATES) s.C=Object.assign({},deck(s.f,"you"),deck(s.f,"sky"));
function sweep(S, cfg, fn){ let boards=0; for(const leader of ["you","sky"]) for(let m=1;m<=28;m++) for(let i=0;i<REPS;i++){
  const sd=3000+m*131+i*911;
  const r=E.playBoard(Object.assign({C:S.C, you:deal(sd), sky:deal(sd+50021).map(x=>200+x), tonight:T, leader, len:LEN, depth:8, youDepth:8}, RULES, cfg));
  boards++; fn(r, leader); } return boards; }
console.log("DOOR ORDER, plain. Who lodges the door (index 0) first?");
console.log("  collection   leader first   answerer first   never");
for(const S of STATES){ let L=0,A=0,N=0; const b=sweep(S,{watchAt:0},(r,leader)=>{ if(!r.firstLodger) N++; else if(r.firstLodger===leader) L++; else A++; });
  console.log("  "+S.label+"   "+(100*L/b).toFixed(1).padStart(11)+"%"+(100*A/b).toFixed(1).padStart(15)+"%"+(100*N/b).toFixed(1).padStart(8)+"%"); }
console.log("\nFAR-STRIKE RATE, the two stars (both, printed). Per board.");
console.log("  collection   pair lodges   looks that find a card   takes   fired from the door   fired by the leader");
for(const S of STATES){ let lo=0,f=0,t=0,d=0,ld=0; const b=sweep(S,{glanceAt:0},(r)=>{ lo+=r.gLodges; f+=r.gFires; t+=r.gTakes; d+=r.gFireDoor; ld+=r.gFireLeader; });
  console.log("  "+S.label+"   "+(lo/b).toFixed(2).padStart(10)+(f/b).toFixed(2).padStart(20)+"  ("+(100*f/lo).toFixed(0)+"% of lodges)"+(t/b).toFixed(2).padStart(6)+"  ("+(100*t/f).toFixed(0)+"% of looks)"+(100*d/f).toFixed(0).padStart(12)+"%"+(100*ld/f).toFixed(0).padStart(18)+"%"); }
