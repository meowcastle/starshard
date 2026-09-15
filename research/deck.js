// THE CHART-SEEDED DECK — 7 cards in hand, 11 stations, a pool of 12 with a level mix.
// Engine: ref-tap.js (2,000/2,000 identical to the merged reference at level 2).
const E = require("/tmp/now2/ref-tap.js");
const fs = require("fs");

const D = JSON.parse(fs.readFileSync("/tmp/now2/sig28-D.json", "utf8"));
const worth = {}; for (const r of D) worth[r.id] = r.worth;
const RANK = Array.from({length:28},(_,i)=>i+1).sort((a,b)=>worth[b]-worth[a]);
const STRONG = RANK.slice(0,10), WEAK = RANK.slice(14);
const RUNG = [[0,0],[1,0],[1,1],[2,1],[2,2],[3,2],[3,3],[4,4],[9,9]];

function hash(a,b,c){let h=(a*73856093 ^ b*19349663 ^ c*83492791)>>>0;
  h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h>>>0;}
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}

// ---- her hand, unchanged from the ladder spec
function herHand(mansion, rung, size){
  let [nS,nA] = RUNG[rung-1];
  if (nS === 9) { nS = size; nA = size; }
  nS = Math.min(nS,size); nA = Math.min(nA,nS);
  const h = hash(mansion, size, rung);
  const take=(pool,c,used)=>{const out=[],p=pool.filter(x=>!used.has(x));
    for(let i=0;i<c&&p.length;i++){const k=(h>>>(i*3))%p.length;out.push(p[k]);used.add(p[k]);p.splice(k,1);}return out;};
  const used=new Set([mansion]);
  const sc=take(STRONG,Math.max(0,nS-1),used), wc=take(WEAK,size-1-sc.length,used);
  const ids=[mansion,...sc,...wc];
  const awake=new Set([mansion,...sc].slice(0,nA));
  return ids.map(id=>({id,awake:awake.has(id)}));
}

// ---- the player's pool: twelve cards drawn like a birth chart, with a level mix
// tiers are [howMany at L4, at L3, at L2, at L1] summing to 12
const TIERS = {
  "flat, all awake  ":      [0,0,12,0],
  "new: 1 L3, 5 L2  ":      [0,1,5,6],
  "mid: 2 L3, 5 L2  ":      [0,2,5,5],
  "late: 1 L4 2 L3  ":      [1,2,5,4],
};

function buildPool(seed, tiers, tonight, guaranteeHome){
  const r = rng(seed);
  const bag = Array.from({length:28},(_,i)=>i+1);
  const pool = [];
  if (guaranteeHome) { const k=bag.indexOf(tonight); if(k>=0){ pool.push(bag.splice(k,1)[0]); } }
  while (pool.length < 12) pool.push(bag.splice(Math.floor(r()*bag.length),1)[0]);
  // shuffle which pool slot gets which level, so the mix is not always on the same cards
  const order = pool.slice();
  for(let i=order.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  const [n4,n3,n2,n1] = tiers;
  const levels = {};
  let i = 0;
  for(let k=0;k<n4;k++) levels[order[i++]] = 4;
  for(let k=0;k<n3;k++) levels[order[i++]] = 3;
  for(let k=0;k<n2;k++) levels[order[i++]] = 2;
  for(let k=0;k<n1;k++) levels[order[i++]] = 1;
  return { pool, levels };
}

function dealN(pool, seed, tonight, n, guaranteeHome){
  let h=(seed^2166136261)>>>0;
  const r=()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};
  const bag=pool.slice(), out=[];
  if(guaranteeHome && bag.includes(tonight)) out.push(bag.splice(bag.indexOf(tonight),1)[0]);
  while(out.length<n && bag.length) out.push(bag.splice(Math.floor(r()*bag.length),1)[0]);
  return out;
}

const TAPS = { tapMode:true, grantSides:"both", skyCanTap:true, tapOwnCardsOnly:true };
const REPS = 10;

function cell(tierName, rung, youDepth, youHand, herSize, len, seedOff, guaranteeHome){
  const tiers = TIERS[tierName];
  let win=0, tot=0, close=0, blow=0, dead=0, homeNights=0;
  const perDeal = [];
  for (let m=1;m<=28;m++){
    const hand = herHand(m, rung, herSize);
    for (let tr=0; tr<REPS; tr++){
      const { pool, levels } = buildPool(4242+seedOff+tr*7919+m*131, tiers, m, guaranteeHome);
      const C = E.makeCards({ levels });
      for (const h of hand) C[200+h.id] = {...C[h.id], id:200+h.id, who:"sky",
        lvl: h.awake?3:1, ab: h.awake?E.makeCards({lvl:2})[h.id].ab:null,
        twoFaced:false, homeM:h.id};
      if (pool.includes(m)) homeNights++;
      let w=0, t=0;
      for (const L of ["you","sky"]){
        const h2 = dealN(pool, 7000+seedOff+tr*100+m, m, youHand, guaranteeHome);
        dead += h2.filter(id => levels[id] === 1).length;
        const r = E.playBoard(Object.assign({C, you:h2.slice(), sky:hand.map(x=>200+x.id),
          tonight:m, leader:L, len, depth:8, youDepth}, TAPS));
        tot++; t++; if (r.winner==="you") { win++; w++; }
        const d = Math.abs(r.you - r.sky);
        if (d<=1) close++; else if (d>=4) blow++;
      }
      perDeal.push(100*w/t);
    }
  }
  // spread across deals = how much the draw changes the night
  const mean = perDeal.reduce((s,v)=>s+v,0)/perDeal.length;
  const sd = Math.sqrt(perDeal.reduce((s,v)=>s+(v-mean)*(v-mean),0)/perDeal.length);
  return { win:100*win/tot, close:100*close/tot, blow:100*blow/tot,
           dead:dead/(tot), home:100*homeNights/(28*REPS), sd };
}

function row(tierName, rung, len, guaranteeHome, hand){
  const A=[], B=[];
  for (const off of [0, 50000]) {
    A.push(cell(tierName, rung, 8, hand, 7, len, off, guaranteeHome));
    B.push(cell(tierName, rung, 0, hand, 7, len, off, guaranteeHome));
  }
  const m=(arr,f)=>(f(arr[0])+f(arr[1]))/2;
  const gaps=[A[0].win-B[0].win, A[1].win-B[1].win];
  if(false) console.log("  "+tierName.padEnd(19)
    + m(A,x=>x.win).toFixed(1).padStart(8) + m(B,x=>x.win).toFixed(1).padStart(8)
    + m(A,x=>x.win-0).toFixed(0).padStart(0)
    );
  return { tierName, careful:m(A,x=>x.win), casual:m(B,x=>x.win),
           gap:(gaps[0]+gaps[1])/2, spread:Math.abs(gaps[0]-gaps[1]),
           close:m(A,x=>x.close), blow:m(A,x=>x.blow), dead:m(A,x=>x.dead),
           home:m(A,x=>x.home), sd:m(A,x=>x.sd) };
}

function table(title, rows){
  console.log("\n=== " + title + " ===");
  console.log("  deck                careful  casual    gap  seeds   close%  blow%   dead   home%   draw-sd");
  for (const r of rows) {
    console.log("  " + r.tierName.padEnd(19)
      + r.careful.toFixed(1).padStart(7) + r.casual.toFixed(1).padStart(8)
      + r.gap.toFixed(1).padStart(7) + ("±"+r.spread.toFixed(1)).padStart(7)
      + r.close.toFixed(0).padStart(8) + r.blow.toFixed(0).padStart(7)
      + r.dead.toFixed(1).padStart(7) + r.home.toFixed(0).padStart(7)
      + r.sd.toFixed(1).padStart(10));
  }
}

console.log("7 cards from a pool of 12. her hand 7. rung 9, the mansion's own sky.");
console.log("two seeds, 1,568 boards a cell. 'dead' = asleep cards in the opening hand.");
console.log("'home%' = nights tonight's mansion is anywhere in your pool.");
console.log("'draw-sd' = how much the win rate swings between different draws. higher = every night differs more.");

const NO = [], YES = [];
for (const t of Object.keys(TIERS)) NO.push(row(t, 9, 11, false, 7));

console.log("7 cards from a pool of 12. her hand 7. rung 9, the mansion's own sky.");
console.log("two seeds, 1,568 boards a cell. 'dead' = asleep cards in the opening hand.");
console.log("'home%' = nights tonight's mansion is anywhere in your pool.");
console.log("'draw-sd' = win-rate swing between draws. higher = every night differs more.");
table("A. the chart pool as proposed, 11 stations, no home guarantee", NO);
require("fs").writeFileSync("/tmp/now2/deckA.json",JSON.stringify(NO));

for (const t of Object.keys(TIERS)) YES.push(row(t, 9, 11, true, 7));
table("B. the same, but tonight's mansion is always in your pool", YES);
