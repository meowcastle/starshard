// THE DRAW TABLE (15 Sep 2026): the level rule with dawn (duel) stacked on it, on the mirror board.
// The search does not read the level rule, so the boards are identical under every form; each board is
// played once and the level boards are re-read under each form. node drawtab.js <boards> <nights csv> [seedoff]
const E=require("/tmp/now2/v2.js");
const N=Number(process.argv[2]||896), NIGHTS=(process.argv[3]||"9").split(",").map(Number), SEEDOFF=Number(process.argv[4]||0), DECK=process.argv[5]||"awake";
const {LAWS}=require("/tmp/now2/laws.js");
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
function deal(r){const bag=Array.from({length:28},(_,i)=>i+1),o=[];while(o.length<7)o.push(bag.splice(Math.floor(r()*bag.length),1)[0]);return o;}
// awake = every signature at level two (the developed mirror). fresh = the harness's fresh collection: the sun at three, five planets at two, the rest asleep.
const SUN=14, PLANETS=[1,7,20,24,11];
function deck(){ const abOff={}, grants={}; if(DECK==="fresh") for(let i=1;i<=28;i++){ const L=i===SUN?3:PLANETS.includes(i)?2:1; if(L<2) abOff[i]=true; if(L>=3) grants[i]=true; }
  const C=E.makeCards({lvl:2, abOff, grants}); const o={}; for(let i=1;i<=28;i++){ o[i]={...C[i]}; o[200+i]={...C[i], id:200+i, who:"sky", homeM:i}; } return o; }
const FORMS=["defender","leader","moon","house","nobody"];
console.log(`THE DRAW TABLE. mirror board (equal decks, ${DECK}), both careful (8), dawn duel, ${N} boards a seat, seed offset ${SEEDOFF}. draws count half.`);
console.log("  night  form       you-lead  she-leads   seat    level%   level->you  level->sky  draws");
for(const m of NIGHTS){ const law=LAWS[m]; const tonight=((m-1-law.off+28)%28)+1; const C=deck();
  const tally={}; for(const f of FORMS) tally[f]={w:[0,0],toYou:0,toSky:0,draws:0}; let levels=0;
  for(let k=0;k<2;k++){ const leader=k===0?"you":"sky"; const r=rng(4242+SEEDOFF+m*17);
    for(let b=0;b<N;b++){ const cfg=Object.assign({C, you:deal(r), sky:deal(r).map(x=>200+x), tonight, leader, len:9, depth:8, youDepth:8,
        suzakuReach:true, suzakuBase:true, genbuDead:true, drawTo:"nobody", dawn:"duel"}, law.cfg);
      const res=E.playBoard(cfg);
      if(!res.level){ if(res.winner==="you") for(const f of FORMS) tally[f].w[k]++; continue; }
      levels++;
      const g={tonight, slots:res.slots, C, first:leader};
      const q=E.QUAD[tonight]; let a=0,bq=0; const mAt=i=>((tonight-1+i)%28)+1;
      res.slots.forEach((x,i)=>{ if(!x) return; if(E.QUAD[mAt(i)]===q){ if(x.owner==="you") a++; else bq++; } });
      const h=res.slots.find(x=>x && (C[x.id].homeM||x.id)===tonight);
      const def = leader==="you"?"sky":"you";
      const win={defender:def, leader, moon: a>bq?"you":bq>a?"sky":def, house: h?h.owner:def, nobody:"draw"};
      for(const f of FORMS){ const wnr=win[f]; if(wnr==="you"){tally[f].w[k]++; tally[f].toYou++;} else if(wnr==="sky") tally[f].toSky++; else {tally[f].w[k]+=0.5; tally[f].draws++;} } } }
  for(const f of FORMS){ const t=tally[f]; const yl=100*t.w[0]/N, sl=100*t.w[1]/N;
    console.log(`  m${String(m).padEnd(3)} ${f.padEnd(9)} ${yl.toFixed(1).padStart(7)}  ${sl.toFixed(1).padStart(8)}  ${(yl-sl).toFixed(1).padStart(6)}   ${(100*levels/(2*N)).toFixed(1).padStart(5)}    ${String(t.toYou).padStart(6)}      ${String(t.toSky).padStart(6)}    ${t.draws}`); }
}
