// THE CLIMB (14 Sep 2026): whole climbs in the reference under Code's ladder rules.
//   node climb.js <climbs per night> <collection: fresh|month|full> <player caution 0..8> [nights csv] [label]
// Code's ladder (manzil-engine-current.cjs, 13 Sep): the opponent is a mirror of the player's levels with a
// HANDICAP fraction of the player's awake cards (weakest first) knocked to level 1, and a CAUTION (reply weight)
// per rung read from the awake count. Format: rungs 1-4 single boards, 5-8 best of three, the mansion best of
// five; three lanterns; a lost rung is retried. The storm: every rung best of three, two lanterns, no handicap,
// caution +2. Loser leads the next board; the first board of rung k is led by you when k is even. The mansion
// match here is against the MIRROR (the reference has never modelled the planet hand); flagged in the memo.
const E=require("/tmp/now2/v2.js");
const N=Number(process.argv[2]||40), COLL=process.argv[3]||"fresh", PC=Number(process.argv[4]==null?8:process.argv[4]);
const NIGHTS=(process.argv[5]&&process.argv[5]!=="all")?process.argv[5].split(",").map(Number):Array.from({length:28},(_,i)=>i+1);
const LABEL=process.argv[6]||""; const EXTRA=JSON.parse(process.argv[7]||"{}");
const RULES={suzakuReach:true, suzakuBase:true, genbuDead:true, drawTo:"defender"};
// the calendar as decided 13 Sep (window offset = TONIGHT shift; cfg = the reference dial)
const LAWS={1:{off:0,cfg:{openAt:4}},2:{off:4,cfg:{tollAt:4,tollBy:1}},3:{off:0,cfg:{razorAt:4}},4:{off:0,cfg:{crowAt:4}},
 5:{off:0,cfg:{softAt:4,softBy:2,softShield:true}},6:{off:4,cfg:{eyeAt:4,eyeN:"defender"}},7:{off:0,cfg:{}},8:{off:0,cfg:{gapAt:4}},
 9:{off:0,cfg:{}},10:{off:0,cfg:{reachAt:0}},11:{off:0,cfg:{}},12:{off:0,cfg:{turnAt:0}},13:{off:0,cfg:{stillAt:4}},
 14:{off:0,cfg:{armAt:4,armN:"max"}},15:{off:4,cfg:{hushAt:4}},16:{off:0,cfg:{}},17:{off:0,cfg:{plantAt:4,plantOnTake:true}},
 18:{off:0,cfg:{beatAt:0}},19:{off:4,cfg:{plantAt:4,plantOnTake:true}},20:{off:4,cfg:{}},21:{off:4,cfg:{hushAt:4}},
 22:{off:0,cfg:{}},23:{off:4,cfg:{resonAt:4}},24:{off:4,cfg:{voidAt:4}},25:{off:4,cfg:{shellAt:4}},
 26:{off:0,cfg:{guestAt:0,guestStrip:true}},27:{off:0,cfg:{strangerAt:4,strangerPlus:1}},28:{off:4,cfg:{ropeAt:4}}};
const HANDICAP_BANDS=[[8,0.75],[14,0.5],[21,0.25],[28,0]];
const CAUTION_BANDS=[[8,[0,0,0,1,1,2,2,2,2]],[14,[0,0,1,1,2,2,4,4,4]],[21,[0,1,1,2,2,4,4,6,6]],[28,[0,1,2,2,4,4,6,8,8]]];
function handicapFor(awake,t){ if(t===6) return 0; for(const [m,h] of HANDICAP_BANDS) if(awake<=m) return h; return 0; }
function cautionsFor(awake,t){ let arr=CAUTION_BANDS[3][1]; for(const [m,a] of CAUTION_BANDS) if(awake<=m){arr=a;break;} return t===6?arr.map(v=>Math.min(8,v+2)):arr; }
function handicapLevels(pl,h){ const aw=Object.keys(pl).map(Number).filter(i=>(pl[i]||1)>=2); const drop=Math.round(h*aw.length);
  const weak=aw.slice().sort((a,b)=>(pl[a]||1)-(pl[b]||1)||a-b); const ds=new Set(weak.slice(0,drop)); const o={}; for(let i=1;i<=28;i++) o[i]=ds.has(i)?1:(pl[i]||1); return o; }
// collections. fresh = the harness's fresh (the sun at three, five planets at two). month = the sun at three and
// thirteen more awake at two (14 awake, the top of Code's second band). full = everything at three.
const SUN=14, PLANETS=[1,7,20,24,11];
function levelsOf(coll){ const L={}; for(let i=1;i<=28;i++){
  if(coll==="fresh") L[i]= i===SUN?3 : PLANETS.includes(i)?2 : 1;
  else if(coll==="month") L[i]= i===SUN?3 : (PLANETS.includes(i)||[2,3,5,9,12,16,19,23].includes(i))?2 : 1;
  else L[i]=3; } return L; }
function deck(L, side){ const abOff={}, grants={}, addR={};
  for(let i=1;i<=28;i++){ const l=L[i]; if(l<2) abOff[i]=true; if(l>=3) grants[i]=true; if(l>=4) addR[i]=1; }
  const C=E.makeCards({lvl:2, abOff, grants, addR}); if(side==="you") return C;
  const o={}; for(let i=1;i<=28;i++) o[200+i]={...C[i], id:200+i, who:"sky", homeM:i}; return o; }
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
function deal(r){const bag=Array.from({length:28},(_,i)=>i+1),o=[];while(o.length<7)o.push(bag.splice(Math.floor(r()*bag.length),1)[0]);return o;}
function climb(m, coll, pc, seed){
  const PL=levelsOf(coll), awake=Object.values(PL).filter(l=>l>=2).length;
  const SL=handicapLevels(PL, handicapFor(awake,m)), caut=cautionsFor(awake,m);
  const C=Object.assign({}, deck(PL,"you"), deck(SL,"sky"));
  const law=LAWS[m], tonight=((m-1-law.off+28)%28)+1;
  const r=rng(seed*7919+m*131);
  const storm=m===6, cap=storm?2:3;
  let lives=cap, k=0, boards=0, won=0; const rungWins=[], rungBoards=[]; let wipe=-1;
  while(lives>0 && boards<70){
    const boss=k>=8, len=boss?5:(k>=4||storm)?3:1, need=len===5?3:len===3?2:1;
    let rw=0, rl=0, leader = boss?"sky":(process.env.LEAD==="you"?"you":(k%2===0?"you":"sky"));
    while(rw<need && rl<need){
      const res=E.playBoard(Object.assign({C, you:deal(r), sky:deal(r).map(x=>200+x), tonight, leader, len:9,
        depth:caut[Math.min(k,8)], youDepth:pc}, RULES, law.cfg, EXTRA));
      boards++; rungBoards[k]=(rungBoards[k]||0)+1;
      if(res.winner==="you"){ rw++; won++; rungWins[k]=(rungWins[k]||0)+1; } else rl++;
      leader = res.winner==="you" ? "sky" : "you";
    }
    if(rw>=need){ if(boss){ return {cleared:true, boards, won, top:9, lanterns:cap-lives, rungWins, rungBoards, wipe}; } k++; }
    else { lives--; if(lives<=0) wipe=k; }
  }
  return {cleared:false, boards, won, top:k, lanterns:cap-lives, rungWins, rungBoards, wipe};
}
const PL=levelsOf(COLL), awake=Object.values(PL).filter(l=>l>=2).length;
console.log(`THE CLIMB. ${LABEL} ${JSON.stringify(EXTRA)} collection ${COLL} (${awake} awake, handicap ${handicapFor(awake,1)}, cautions ${cautionsFor(awake,1).join("")}), player caution ${PC}, ${N} climbs a night.`);
console.log("  night                 clear   boards   p(board)   rung reached   lanterns   wipes at: 1-4 / 5-8 / mansion   p by rung 1..9");
let allC=0, allN=0, allB=0, allW=0; const agg={};
for(const m of NIGHTS){
  let c=0,b=0,w=0,top=0,lan=0; const wipes=[0,0,0]; const RW=Array(9).fill(0), RB=Array(9).fill(0);
  for(let i=0;i<N;i++){ const o=climb(m,COLL,PC,1000+i); if(o.cleared) c++; b+=o.boards; w+=o.won; top+=o.top; lan+=o.lanterns;
    if(o.wipe>=0) wipes[o.wipe<4?0:o.wipe<8?1:2]++; for(let k=0;k<9;k++){ RW[k]+=o.rungWins[k]||0; RB[k]+=o.rungBoards[k]||0; } }
  allC+=c; allN+=N; allB+=b; allW+=w;
  const name=(E.POOL[m-1][0]||"").replace("the ","").padEnd(16);
  console.log(`  m${String(m).padEnd(2)} ${name} ${(100*c/N).toFixed(0).padStart(5)}%   ${(b/N).toFixed(1).padStart(5)}     ${(100*w/b).toFixed(1).padStart(5)}%      ${(top/N).toFixed(1).padStart(4)}        ${(lan/N).toFixed(2)}      ${wipes.map(x=>(100*x/N).toFixed(0).padStart(3)+"%").join(" / ")}    ${RW.map((x,k)=>RB[k]?(100*x/RB[k]).toFixed(0):"--").join(" ")}`);
  process.stderr.write(".");
}
console.log(`\n  ALL   clear ${(100*allC/allN).toFixed(1)}%   p(board) ${(100*allW/allB).toFixed(1)}%   boards a climb ${(allB/allN).toFixed(1)}`);
