// THE RATIO. All 28 mansions go in the shuffle. Cards you own come up at your level;
// cards you have not taken yet come up raw — numbers only, no signature. You draw 9 or 12
// and keep 7. So the awake share of a shuffle is just how much of the wheel you have taken.
//
// The question: at what ownership does the game sit right, and does every shuffle play fairly?
const E = require("/tmp/now2/ref-boss.js");
const fs = require("fs");

const D = JSON.parse(fs.readFileSync("/tmp/now2/sig28-D.json", "utf8"));
const worth = {}; for (const r of D) worth[r.id] = r.worth;
const RANK = Array.from({length:28},(_,i)=>i+1).sort((a,b)=>worth[b]-worth[a]);
const STRONG = RANK.slice(0,10), WEAK = RANK.slice(14);
const RUNG = [[0,0],[1,0],[1,1],[2,1],[2,2],[3,2],[3,3],[4,4],[9,9]];
const TAPS = { tapMode:true, grantSides:"both", skyCanTap:true, tapOwnCardsOnly:true };
const REPS = 12, LEN = 11, HAND = 7;

function hash(a,b,c){let h=(a*73856093 ^ b*19349663 ^ c*83492791)>>>0;
  h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h>>>0;}
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}

function herHand(m, rung, size, lvl){
  let [nS,nA]=RUNG[rung-1];
  if(nS===9){nS=size;nA=size;}
  nS=Math.min(nS,size); nA=Math.min(nA,nS);
  const h=hash(m,size,rung);
  const take=(pool,c,used)=>{const out=[],p=pool.filter(x=>!used.has(x));
    for(let i=0;i<c&&p.length;i++){const k=(h>>>(i*3))%p.length;out.push(p[k]);used.add(p[k]);p.splice(k,1);}return out;};
  const used=new Set([m]);
  const sc=take(STRONG,Math.max(0,nS-1),used), wc=take(WEAK,size-1-sc.length,used);
  const ids=[m,...sc,...wc];
  const awake=new Set([m,...sc].slice(0,nA));
  return ids.map(id=>({id,awake:awake.has(id), lvl}));
}

// which mansions the player has taken, and to what level

// THE SPEC AS WRITTEN. All 28 are always in the shuffle. What changes is how many are awake
// and at what level. Start: 1 at L3 (your sun), 5 at L2 (your planets), 22 raw.
function collection(seed, spec){
  const r=rng(seed);
  const bag=Array.from({length:28},(_,i)=>i+1);
  for(let i=bag.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
  const levels={}; let i=0;
  for(let k=0;k<spec.l4;k++) levels[bag[i++]]=4;
  for(let k=0;k<spec.l3;k++) levels[bag[i++]]=3;
  for(let k=0;k<spec.l2;k++) levels[bag[i++]]=2;
  while(i<28) levels[bag[i++]]=1;               // raw: in the shuffle, no signature
  return levels;
}

// three ways to draw the twelve
function shuffle(seed, poolSize, tonight, levels, mode){
  const r=rng(seed);
  let bag=Array.from({length:28},(_,i)=>i+1);
  const out=[];
  const k=bag.indexOf(tonight); if(k>=0) out.push(bag.splice(k,1)[0]);
  if (mode === "sun") {                      // your highest card is always dealt
    let best=null, bl=0;
    for(const id of bag){ const l=levels[id]||1; if(l>bl){bl=l;best=id;} }
    if(best && bl>1){ out.push(bag.splice(bag.indexOf(best),1)[0]); }
  }
  if (mode === "awake") {                     // your awake cards are drawn first, raw fills the rest
    const awake=bag.filter(id=>(levels[id]||1)>1);
    for(let i=awake.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[awake[i],awake[j]]=[awake[j],awake[i]];}
    while(out.length<poolSize && awake.length){ const id=awake.shift(); out.push(id); bag.splice(bag.indexOf(id),1); }
  }
  while(out.length<poolSize) out.push(bag.splice(Math.floor(r()*bag.length),1)[0]);
  return out;
}
function keepSeven(pool, levels, tonight){
  const onRoad = id => { for(let i=0;i<LEN;i++) if(((tonight-1+i)%28)+1 === id) return LEN-i; return 0; };
  return pool.slice().sort((a,b)=>
    (((levels[b]||1)>1)-((levels[a]||1)>1)) || ((levels[b]||1)-(levels[a]||1)) ||
    (onRoad(b)-onRoad(a)) || (worth[b]-worth[a])
  ).slice(0, HAND);
}
function cell(rung, youDepth, spec, herLvl, herSize, seedOff, mode){
  let win=0,tot=0,close=0,blow=0,awake=0,taps=0;
  for(let m=1;m<=28;m++){
    const hand=herHand(m,rung,herSize,herLvl);
    for(let tr=0;tr<REPS;tr++){
      const levels=collection(313+seedOff+tr*7919+m*131, spec);
      const C=E.makeCards({levels});
      const base=E.makeCards({lvl:2});
      for(const h of hand) C[200+h.id]={...C[h.id], id:200+h.id, who:"sky",
        lvl:h.awake?h.lvl:1, ab:h.awake?base[h.id].ab:null, twoFaced:false, homeM:h.id,
        l:base[h.id].l, r:base[h.id].r};
      const pool=shuffle(9100+seedOff+tr*100+m, 12, m, levels, mode);
      const seven=keepSeven(pool, levels, m);
      awake += seven.filter(id=>(levels[id]||1)>1).length;
      taps  += seven.filter(id=>(levels[id]||1)>=3).length;
      for(const L of ["you","sky"]){
        const r=E.playBoard(Object.assign({C, you:seven.slice(), sky:hand.map(x=>200+x.id),
          tonight:m, leader:L, len:LEN, depth:8, youDepth}, TAPS));
        tot++; if(r.winner==="you") win++;
        const d=Math.abs(r.you-r.sky);
        if(d<=1) close++; else if(d>=4) blow++;
      }
    }
  }
  return {win:100*win/tot, close:100*close/tot, blow:100*blow/tot, awake:awake/(tot/2), taps:taps/(tot/2)};
}
function pair(rung, spec, herLvl, herSize, mode){
  const A=[],B=[];
  for(const off of [0,50000]){
    A.push(cell(rung,8,spec,herLvl,herSize,off,mode));
    B.push(cell(rung,0,spec,herLvl,herSize,off,mode));
  }
  const m=(a,f)=>(f(a[0])+f(a[1]))/2;
  return {careful:m(A,x=>x.win), casual:m(B,x=>x.win), gap:m(A,x=>x.win)-m(B,x=>x.win),
          close:m(A,x=>x.close), blow:m(A,x=>x.blow), awake:m(A,x=>x.awake), taps:m(A,x=>x.taps)};
}
function show(l,r){
  console.log("  "+l.padEnd(34)+r.awake.toFixed(1).padStart(6)+r.taps.toFixed(1).padStart(6)
    +r.careful.toFixed(1).padStart(9)+r.casual.toFixed(1).padStart(8)+r.gap.toFixed(1).padStart(7)
    +r.close.toFixed(0).padStart(8)+r.blow.toFixed(0).padStart(7));
}

// Q1: is "enhance your numbers OR take the ability" a real choice?
// measure what +1 and +2 to both faces is worth, in the same units as the per-card
// ability worths already measured, so the two branches can be compared card by card.
function bumpCell(rung, youDepth, spec, bump, seedOff){
  let win=0,tot=0;
  for(let m=1;m<=28;m++){
    const hand=herHand(m,rung,7,2);
    for(let tr=0;tr<REPS;tr++){
      const levels=collection(313+seedOff+tr*7919+m*131, spec);
      const C=E.makeCards({levels});
      if(bump) for(let id=1;id<=28;id++) C[id]={...C[id], l:Math.min(9,C[id].l+bump), r:Math.min(9,C[id].r+bump)};
      const base=E.makeCards({lvl:2});
      for(const h of hand) C[200+h.id]={...C[h.id], id:200+h.id, who:"sky",
        lvl:h.awake?2:1, ab:h.awake?base[h.id].ab:null, twoFaced:false, homeM:h.id,
        l:base[h.id].l, r:base[h.id].r};
      const pool=shuffle(9100+seedOff+tr*100+m, 12, m, levels, "awake");
      const seven=keepSeven(pool, levels, m);
      for(const L of ["you","sky"]){
        const r=E.playBoard(Object.assign({C, you:seven.slice(), sky:hand.map(x=>200+x.id),
          tonight:m, leader:L, len:LEN, depth:8, youDepth}, TAPS));
        tot++; if(r.winner==="you") win++;
      }
    }
  }
  return 100*win/tot;
}
const ALLAWAKE={l4:0,l3:0,l2:28}, ALLRAW={l4:0,l3:0,l2:0};
console.log("Q1. THE LEVEL-2 CHOICE: are the two branches comparable?\n");
console.log("  the player's twelve                careful");
const rows=[];
for(const [lbl,spec,bump] of [
  ["every card raw, no bump        ", ALLRAW, 0],
  ["every card raw, +1 to both     ", ALLRAW, 1],
  ["every card raw, +2 to both     ", ALLRAW, 2],
  ["every card awake, no bump      ", ALLAWAKE, 0],
]){
  const a=(bumpCell(9,8,spec,bump,0)+bumpCell(9,8,spec,bump,50000))/2;
  rows.push([lbl,a]);
  console.log("  "+lbl+a.toFixed(1).padStart(8));
}
console.log("\n  so a signature is worth about " + (rows[3][1]-rows[0][1]).toFixed(1) +
  " and +1 is worth about " + (rows[1][1]-rows[0][1]).toFixed(1) +
  ", +2 about " + (rows[2][1]-rows[0][1]).toFixed(1) + " (all 28 at once)");
