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
  "all asleep       ":      [0,0,0,12],
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
// THE FIX UNDER TEST: an asleep card gets stronger NUMBERS instead of nothing.
// Today asleep = same numbers, no ability = strictly worse. Give it +N to both faces
// and it becomes a trade (raw force, no trick) rather than a dead draw.
function cell(tierName, rung, youDepth, len, seedOff, guaranteeHome, sleepBonus){
  const tiers = TIERS[tierName];
  let win=0, tot=0, close=0, blow=0;
  for (let m=1;m<=28;m++){
    const hand = herHand(m, rung, 7);
    for (let tr=0; tr<REPS; tr++){
      const { pool, levels } = buildPool(4242+seedOff+tr*7919+m*131, tiers, m, guaranteeHome);
      const C = E.makeCards({ levels });
      if (sleepBonus) for (const id of pool) if (levels[id] === 1) {
        C[id] = {...C[id], l: Math.min(9, C[id].l + sleepBonus), r: Math.min(9, C[id].r + sleepBonus)};
      }
      const base = E.makeCards({lvl:2});
      for (const h of hand) C[200+h.id] = {...C[h.id], id:200+h.id, who:"sky",
        lvl: h.awake?3:1, ab: h.awake?base[h.id].ab:null, twoFaced:false, homeM:h.id,
        l: base[h.id].l, r: base[h.id].r};
      for (const L of ["you","sky"]){
        const h2 = dealN(pool, 7000+seedOff+tr*100+m, m, 7, guaranteeHome);
        const r = E.playBoard(Object.assign({C, you:h2.slice(), sky:hand.map(x=>200+x.id),
          tonight:m, leader:L, len, depth:8, youDepth}, TAPS));
        tot++; if (r.winner==="you") win++;
        const d = Math.abs(r.you - r.sky);
        if (d<=1) close++; else if (d>=4) blow++;
      }
    }
  }
  return { win:100*win/tot, close:100*close/tot, blow:100*blow/tot };
}

console.log("What is a signature actually WORTH, against raw numbers? rung 9, road 11.\n");
console.log("  the player's twelve      careful  casual    gap   close%  blow%");
for (const [tier,bonus,label] of [
  ["flat, all awake  ",0,"every card awake, no bonus  "],
  ["all asleep       ",0,"every card asleep, no bonus "],
  ["all asleep       ",1,"every card asleep, +1/+1    "],
  ["all asleep       ",2,"every card asleep, +2/+2    "],
  ["all asleep       ",3,"every card asleep, +3/+3    "],
]){
  const A=[],B=[];
  for(const off of [0,50000]){ A.push(cell(tier,9,8,11,off,true,bonus)); B.push(cell(tier,9,0,11,off,true,bonus)); }
  const m=(a,f)=>(f(a[0])+f(a[1]))/2;
  console.log("  "+label.padEnd(26)+m(A,x=>x.win).toFixed(1).padStart(6)+m(B,x=>x.win).toFixed(1).padStart(8)
    +(m(A,x=>x.win)-m(B,x=>x.win)).toFixed(1).padStart(7)
    +m(A,x=>x.close).toFixed(0).padStart(9)+m(A,x=>x.blow).toFixed(0).padStart(7));
}
