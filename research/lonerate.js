// lonely-card rate: share of real strikes that land on a card with no friend beside it. Both windows, fresh and deep.
const E=require("/tmp/now2/v2.js");
const REPS=Number(process.argv[2]||8), LEN=9, HAND=7;
const RULES={suzakuReach:true, suzakuBase:true, genbuDead:true, drawTo:"defender"};
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
function deal(seed){const r=rng(seed),bag=Array.from({length:28},(_,i)=>i+1),o=[];while(o.length<HAND)o.push(bag.splice(Math.floor(r()*bag.length),1)[0]);return o;}
function deck(levelOf, side){const abOff={}, grants={}, addR={};for(let i=1;i<=28;i++){const L=levelOf(i);if(L<2)abOff[i]=true;if(L>=3)grants[i]=true;if(L>=4)addR[i]=1;}
  const C=E.makeCards({lvl:2, abOff, grants, addR}); if(side==="you")return C; const o={};for(let i=1;i<=28;i++)o[200+i]={...C[i],id:200+i,who:"sky",homeM:i};return o;}
const SUN=14, PLANETS=[1,7,20,24,11];
const STATES=[{label:"fresh",f:i=>i===SUN?3:PLANETS.includes(i)?2:1},{label:"deep ",f:()=>3}];
for(const s of STATES) s.C=Object.assign({},deck(s.f,"you"),deck(s.f,"sky"));
console.log("  window       collection   strikes/board   lonely/board   lonely share   lonely at the crossing");
for(const [t,win] of [[24,"door-first"],[20,"slid      "]]) for(const S of STATES){
  let boards=0,strikes=0,lonely=0,mid=0,midL=0;
  for(const leader of ["you","sky"]) for(let m=1;m<=28;m++) for(let i=0;i<REPS;i++){
    const sd=3000+m*131+i*911;
    const g=Object.assign({C:S.C, you:deal(sd), sky:deal(sd+50021).map(x=>200+x), tonight:t, leader, len:LEN, depth:8, youDepth:8, loneTally:true}, RULES);
    const r=E.playBoard(g); boards++; strikes+=r.lStrikes||0; lonely+=r.lLonely||0;
  }
  console.log("  "+win+"   "+S.label+"   "+(strikes/boards).toFixed(2).padStart(12)+(lonely/boards).toFixed(2).padStart(15)+(100*lonely/strikes).toFixed(1).padStart(13)+"%");
}
