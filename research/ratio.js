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
function collection(seed, owned, lvl){
  const r=rng(seed);
  const bag=Array.from({length:28},(_,i)=>i+1);
  for(let i=bag.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
  const levels={};
  for(let i=0;i<28;i++) levels[bag[i]] = i < owned ? lvl : 1;   // 1 = raw, no signature
  return levels;
}
// tonight's shuffle: draw poolSize from all 28
function shuffle(seed, poolSize, tonight){
  const r=rng(seed);
  const bag=Array.from({length:28},(_,i)=>i+1);
  const out=[];
  const k=bag.indexOf(tonight); if(k>=0) out.push(bag.splice(k,1)[0]);  // tonight's mansion is always dealt
  while(out.length<poolSize) out.push(bag.splice(Math.floor(r()*bag.length),1)[0]);
  return out;
}
// keep seven: awake first, then whose home falls on the road ahead, then by measured worth
function keepSeven(pool, levels, tonight){
  const onRoad = id => { for(let i=0;i<LEN;i++) if(((tonight-1+i)%28)+1 === id) return LEN-i; return 0; };
  return pool.slice().sort((a,b)=>
    (((levels[b]||1)>1)-((levels[a]||1)>1)) || (onRoad(b)-onRoad(a)) ||
    ((levels[b]||1)-(levels[a]||1)) || (worth[b]-worth[a])
  ).slice(0, HAND);
}

function cell(rung, youDepth, owned, lvl, poolSize, herLvl, herSize, seedOff){
  let win=0,tot=0,close=0,blow=0,awakeHeld=0;
  const perShuffle=[];
  for(let m=1;m<=28;m++){
    const hand=herHand(m,rung,herSize,herLvl);
    for(let tr=0;tr<REPS;tr++){
      const levels=collection(313+seedOff+tr*7919+m*131, owned, lvl);
      const C=E.makeCards({levels});
      const base=E.makeCards({lvl:2});
      for(const h of hand) C[200+h.id]={...C[h.id], id:200+h.id, who:"sky",
        lvl:h.awake?h.lvl:1, ab:h.awake?base[h.id].ab:null, twoFaced:false, homeM:h.id,
        l:base[h.id].l, r:base[h.id].r};
      const pool=shuffle(9100+seedOff+tr*100+m, poolSize, m);
      const seven=keepSeven(pool, levels, m);
      awakeHeld += seven.filter(id=>(levels[id]||1)>1).length;
      let w=0,t=0;
      for(const L of ["you","sky"]){
        const r=E.playBoard(Object.assign({C, you:seven.slice(), sky:hand.map(x=>200+x.id),
          tonight:m, leader:L, len:LEN, depth:8, youDepth}, TAPS));
        tot++; t++; if(r.winner==="you"){win++;w++;}
        const d=Math.abs(r.you-r.sky);
        if(d<=1) close++; else if(d>=4) blow++;
      }
      perShuffle.push(100*w/t);
    }
  }
  const mean=perShuffle.reduce((s,v)=>s+v,0)/perShuffle.length;
  const sd=Math.sqrt(perShuffle.reduce((s,v)=>s+(v-mean)*(v-mean),0)/perShuffle.length);
  return {win:100*win/tot, close:100*close/tot, blow:100*blow/tot, awake:awakeHeld/(tot/2), sd};
}
function pair(rung, owned, lvl, poolSize, herLvl, herSize){
  const A=[],B=[];
  for(const off of [0,50000]){
    A.push(cell(rung,8,owned,lvl,poolSize,herLvl,herSize,off));
    B.push(cell(rung,0,owned,lvl,poolSize,herLvl,herSize,off));
  }
  const m=(a,f)=>(f(a[0])+f(a[1]))/2;
  return {careful:m(A,x=>x.win), casual:m(B,x=>x.win), gap:m(A,x=>x.win)-m(B,x=>x.win),
          close:m(A,x=>x.close), blow:m(A,x=>x.blow), awake:m(A,x=>x.awake), sd:m(A,x=>x.sd)};
}
function show(l,r){
  console.log("  "+l.padEnd(28)+r.awake.toFixed(1).padStart(6)+r.careful.toFixed(1).padStart(9)
    +r.casual.toFixed(1).padStart(8)+r.gap.toFixed(1).padStart(7)+r.close.toFixed(0).padStart(8)
    +r.blow.toFixed(0).padStart(7)+r.sd.toFixed(0).padStart(9));
}
const HEAD="                              awake  careful  casual    gap   close%  blow%  shuffle-sd";

console.log("All 28 in the shuffle. Cards you have taken come up awake; the rest come up raw.");
console.log("Draw N, keep 7, eleven stations. Two seeds, 1,344 boards a cell.");
console.log("'awake' = how many of your seven have a signature. 'shuffle-sd' = how much the night");
console.log("swings from one shuffle to the next. LOWER is a fairer nightly deal.\n");

console.log("=== 1. THE RATIO: how much of the wheel you have taken, drawing 9 ===");
console.log(HEAD);
for (const o of [4,8,14,21,28]) show(o+" of 28 owned, all L2", pair(9, o, 2, 9, 2, 7));

console.log("\n=== 2. THE SAME, drawing 12 instead of 9 ===");
console.log(HEAD);
for (const o of [4,8,14,21,28]) show(o+" of 28 owned, all L2", pair(9, o, 2, 12, 2, 7));

console.log("\n=== 3. THE CALIBRATION RULE: a level-3 mansion against an all-level-2 player ===");
console.log(HEAD);
show("all L2 vs her at L2",  pair(9, 28, 2, 12, 2, 7));
show("all L2 vs her at L3",  pair(9, 28, 2, 12, 3, 7));
show("all L3 vs her at L3",  pair(9, 28, 3, 12, 3, 7));
show("all L3 vs her at L4",  pair(9, 28, 3, 12, 4, 8));
