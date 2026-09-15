// THE LOOP, tested. Two questions:
//   1. what is the "choose seven from your pool" decision actually worth?
//   2. what shape of boss trait raises difficulty without flattening skill?
// Engine: ref-boss.js (ref-tap.js + board-wide boss traits). 60/60 vectors, inert with no trait.
const E = require("/tmp/now2/ref-boss.js");
const fs = require("fs");

const D = JSON.parse(fs.readFileSync("/tmp/now2/sig28-D.json", "utf8"));
const worth = {}; for (const r of D) worth[r.id] = r.worth;
const RANK = Array.from({length:28},(_,i)=>i+1).sort((a,b)=>worth[b]-worth[a]);
const STRONG = RANK.slice(0,10), WEAK = RANK.slice(14);
const RUNG = [[0,0],[1,0],[1,1],[2,1],[2,2],[3,2],[3,3],[4,4],[9,9]];
const TAPS = { tapMode:true, grantSides:"both", skyCanTap:true, tapOwnCardsOnly:true };
const REPS = 10, LEN = 11;

function hash(a,b,c){let h=(a*73856093 ^ b*19349663 ^ c*83492791)>>>0;
  h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h>>>0;}
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}

function herHand(m, rung, size){
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
  return ids.map(id=>({id,awake:awake.has(id)}));
}

// the player's collection: poolSize cards, all of them AWAKE (no dead cards, ever).
// a share of them are at level 3, which is where the tap lives.
function buildPool(seed, poolSize, nL3, tonight){
  const r=rng(seed);
  const bag=Array.from({length:28},(_,i)=>i+1);
  const pool=[];
  const k=bag.indexOf(tonight); if(k>=0) pool.push(bag.splice(k,1)[0]);   // you own tonight's mansion
  while(pool.length<poolSize) pool.push(bag.splice(Math.floor(r()*bag.length),1)[0]);
  const order=pool.slice();
  for(let i=order.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  const levels={};
  for(let i=0;i<pool.length;i++) levels[order[i]] = i < nL3 ? 3 : 2;
  return {pool, levels};
}

// THE DRAFT. picking seven from a pool means picking the seven that suit tonight's road.
// a player who drafts well takes cards whose homes fall on the road ahead.
function draft(pool, levels, tonight, n, smart, seed){
  if (pool.length <= n) return pool.slice();
  if (!smart) {                       // no choice: seven at random from the pool
    let h=(seed^2166136261)>>>0;
    const r=()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};
    const bag=pool.slice(), out=[];
    while(out.length<n && bag.length) out.push(bag.splice(Math.floor(r()*bag.length),1)[0]);
    return out;
  }
  // a competent draft: cards whose home station is on tonight's road, level 3 first,
  // then by measured worth. this is the decision the player would be making.
  const onRoad = id => { for(let i=0;i<LEN;i++){ if(((tonight-1+i)%28)+1 === id) return LEN-i; } return 0; };
  return pool.slice().sort((a,b)=>
    (onRoad(b)-onRoad(a)) || ((levels[b]||2)-(levels[a]||2)) || (worth[b]-worth[a])
  ).slice(0,n);
}

function cell(rung, youDepth, poolSize, nL3, smart, boss, herSize, seedOff){
  let win=0,tot=0,close=0,blow=0;
  for(let m=1;m<=28;m++){
    const hand=herHand(m,rung,herSize);
    for(let tr=0;tr<REPS;tr++){
      const {pool,levels}=buildPool(4242+seedOff+tr*7919+m*131, poolSize, nL3, m);
      const C=E.makeCards({levels});
      const base=E.makeCards({lvl:2});
      for(const h of hand) C[200+h.id]={...C[h.id], id:200+h.id, who:"sky",
        lvl:h.awake?3:1, ab:h.awake?base[h.id].ab:null, twoFaced:false, homeM:h.id,
        l:base[h.id].l, r:base[h.id].r};
      const seven = draft(pool, levels, m, 7, smart, 7000+seedOff+tr*100+m);
      for(const L of ["you","sky"]){
        const cfg = Object.assign({C, you:seven.slice(), sky:hand.map(x=>200+x.id),
          tonight:m, leader:L, len:LEN, depth:8, youDepth}, TAPS);
        if (boss === "lead") cfg.leader = "sky";
        if (boss === "ties") cfg.tieRule = "the sky";
        if (boss === "seat") cfg.boss = "seat";
        const r=E.playBoard(cfg);
        tot++; if(r.winner==="you") win++;
        const d=Math.abs(r.you-r.sky);
        if(d<=1) close++; else if(d>=4) blow++;
      }
    }
  }
  return {win:100*win/tot, close:100*close/tot, blow:100*blow/tot};
}
function pair(rung, poolSize, nL3, smart, boss, herSize){
  const A=[],B=[];
  for(const off of [0,50000]){
    A.push(cell(rung,8,poolSize,nL3,smart,boss,herSize,off));
    B.push(cell(rung,0,poolSize,nL3,smart,boss,herSize,off));
  }
  const m=(a,f)=>(f(a[0])+f(a[1]))/2;
  return {careful:m(A,x=>x.win), casual:m(B,x=>x.win), gap:m(A,x=>x.win)-m(B,x=>x.win),
          close:m(A,x=>x.close), blow:m(A,x=>x.blow)};
}
function show(label,r){
  console.log("  "+label.padEnd(30)+r.careful.toFixed(1).padStart(7)+r.casual.toFixed(1).padStart(8)
    +r.gap.toFixed(1).padStart(7)+r.close.toFixed(0).padStart(9)+r.blow.toFixed(0).padStart(7));
}
const HEAD="                                careful  casual    gap   close%  blow%";

console.log("11 stations, 7 cards played, no dead cards in the pool. rung 9 unless noted.");
console.log("two seeds, 1,120 boards a cell.\n");

console.log("=== 1. WHAT IS THE DRAFT WORTH? pool size, and picking vs being dealt ===");
console.log(HEAD);
show("pool 7 (no choice at all)",      pair(9, 7, 2, false, null, 7));
show("pool 9, dealt at random",        pair(9, 9, 2, false, null, 7));
show("pool 9, player picks",           pair(9, 9, 2, true,  null, 7));
show("pool 12, dealt at random",       pair(9,12, 3, false, null, 7));
show("pool 12, player picks",          pair(9,12, 3, true,  null, 7));

console.log("\n=== 2. THE EIGHT WALKERS, so the climb can be seen ===");
console.log(HEAD);
for (const r of [1,3,5,7,8]) show("walker "+r, pair(r, 12, 3, true, null, 6));

console.log("\n=== 3. THE MANSION ITSELF. which trait raises it without flattening skill? ===");
console.log(HEAD);
show("no trait, her hand 7",           pair(9,12,3,true,null,7));
show("trait: she leads every board",   pair(9,12,3,true,"lead",7));
show("trait: ties go to the mansion",  pair(9,12,3,true,"ties",7));
show("trait: its own station counts 2",pair(9,12,3,true,"seat",7));
show("no trait, her hand 8",           pair(9,12,3,true,null,8));
