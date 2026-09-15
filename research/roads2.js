// THE HAND. Size, surplus, board length — measured for balance AND for interest.
//
// Engine: ref-tap.js, which is 2,000/2,000 identical to the merged reference at level 2.
// Grants and taps are OFF throughout, so this is about the hand and nothing else.
const E = require("/tmp/now2/ref-tap.js");
const fs = require("fs");

const D = JSON.parse(fs.readFileSync("/tmp/now2/sig28-D.json", "utf8"));
const worth = {}; for (const r of D) worth[r.id] = r.worth;
const RANK = Array.from({length:28},(_,i)=>i+1).sort((a,b)=>worth[b]-worth[a]);
const STRONG = RANK.slice(0,10), WEAK = RANK.slice(14);
const RUNG = [[0,0],[1,0],[1,1],[2,1],[2,2],[3,2],[3,3],[4,4],[9,9]];
const CHART5 = [5,6,10,17,18];

function hash(a,b,c){let h=(a*73856093 ^ b*19349663 ^ c*83492791)>>>0;
  h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h>>>0;}
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}

function herHand(mansion, rung, size){
  let [nStrong,nAwake] = RUNG[rung-1];
  if (nStrong === 9) { nStrong = size; nAwake = size; }
  nStrong = Math.min(nStrong,size); nAwake = Math.min(nAwake,nStrong);
  const h = hash(mansion, size, rung);
  const take = (pool,count,used) => { const out=[], p=pool.filter(x=>!used.has(x));
    for(let i=0;i<count&&p.length;i++){const k=(h>>>(i*3))%p.length;out.push(p[k]);used.add(p[k]);p.splice(k,1);} return out; };
  const used = new Set([mansion]);
  const sc = take(STRONG, Math.max(0,nStrong-1), used);
  const wc = take(WEAK, size-1-sc.length, used);
  const ids = [mansion, ...sc, ...wc];
  const awake = new Set([mansion, ...sc].slice(0, nAwake));
  return ids.map(id => ({ id, awake: awake.has(id) }));
}
function cardsFor(hand, lv){
  const lvl = lv || 2;
  const C = E.makeCards({ lvl });
  for (const h of hand) C[200+h.id] = {...C[h.id], id:200+h.id, who:"sky",
    lvl: h.awake?lvl:1, ab: h.awake?C[h.id].ab:null, twoFaced:false, homeM:h.id};
  return C;
}
// a constant pack, so hand size is the only thing moving
function dealN(pack, seed, tonight, n){
  let h=(seed^2166136261)>>>0;
  const r=()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};
  const bag=pack.slice(), out=[];
  if(bag.includes(tonight)) out.push(bag.splice(bag.indexOf(tonight),1)[0]);
  while(out.length<n && bag.length) out.push(bag.splice(Math.floor(r()*bag.length),1)[0]);
  return out;
}

const REPS = 14, PACK_EXTRA = 7;      // pack of twelve throughout
function cell(rung, youDepth, youHand, herSize, len){
  let win=0, tot=0, leftover=0, close=0, blowout=0, margin=0;
  for (let m=1;m<=28;m++){
    const hand = herHand(m, rung, herSize);
    const C = cardsFor(hand), skyHand = hand.map(h=>200+h.id);
    for (let tr=0; tr<REPS; tr++){
      const r1 = rng(9001+tr*7919);
      const rest = Array.from({length:28},(_,i)=>i+1).filter(x=>!CHART5.includes(x));
      for(let i=rest.length-1;i>0;i--){const j=Math.floor(r1()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
      const pack = CHART5.concat(rest.slice(0, PACK_EXTRA));
      for (const L of ["you","sky"]){
        const h2 = dealN(pack, 7000+tr*100+m, m, youHand);
        const r = E.playBoard({C, you:h2.slice(), sky:skyHand.slice(), tonight:m, leader:L,
                               len, depth:8, youDepth});
        tot++; if (r.winner==="you") win++;
        const played = r.slots.filter(s => s && s.id <= 28).length;
        leftover += Math.max(0, youHand - played);
        const d = Math.abs(r.you - r.sky);
        margin += d;
        if (d <= 1) close++; else if (d >= 4) blowout++;
      }
    }
  }
  return { win:100*win/tot, leftover:leftover/tot, close:100*close/tot, blowout:100*blowout/tot, margin:margin/tot };
}

function row(label, rung, youHand, herSize, len){
  const a = cell(rung, 8, youHand, herSize, len);
  const b = cell(rung, 0, youHand, herSize, len);
  const surplus = youHand + herSize - len;
  console.log("  " + label.padEnd(16)
    + String(surplus).padStart(4)
    + a.win.toFixed(1).padStart(9) + b.win.toFixed(1).padStart(8) + (a.win-b.win).toFixed(1).padStart(7)
    + a.leftover.toFixed(1).padStart(9)
    + a.close.toFixed(0).padStart(8) + a.blowout.toFixed(0).padStart(9));
}

function row(label, rung, youHand, herSize, len, o){
  const a=cell2(rung,8,youHand,herSize,len,o), b=cell2(rung,0,youHand,herSize,len,o);
  console.log("  "+label.padEnd(20)+String(youHand+herSize-len).padStart(4)
    +a.win.toFixed(1).padStart(9)+b.win.toFixed(1).padStart(8)+(a.win-b.win).toFixed(1).padStart(7)
    +a.leftover.toFixed(1).padStart(9)+a.close.toFixed(0).padStart(8)+a.blowout.toFixed(0).padStart(9));
}
function cell2(rung,youDepth,youHand,herSize,len,o){
  let win=0,tot=0,leftover=0,close=0,blowout=0;
  for(let m=1;m<=28;m++){
    const hand=herHand(m,rung,herSize); const C=cardsFor(hand), skyHand=hand.map(h=>200+h.id);
    for(let tr=0;tr<REPS;tr++){
      const r1=rng(9001+tr*7919);
      const rest=Array.from({length:28},(_,i)=>i+1).filter(x=>!CHART5.includes(x));
      for(let i=rest.length-1;i>0;i--){const j=Math.floor(r1()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
      const pack=CHART5.concat(rest.slice(0,PACK_EXTRA));
      for(const L of ["you","sky"]){
        const h2=dealN(pack,7000+tr*100+m,m,youHand);
        const r=E.playBoard(Object.assign({C,you:h2.slice(),sky:skyHand.slice(),tonight:m,leader:L,len,depth:8,youDepth},o||{}));
        tot++; if(r.winner==="you") win++;
        const played=r.slots.filter(s=>s&&s.id<=28).length;
        leftover+=Math.max(0,youHand-played);
        const d=Math.abs(r.you-r.sky);
        if(d<=1) close++; else if(d>=4) blowout++;
      }
    }
  }
  return {win:100*win/tot,leftover:leftover/tot,close:100*close/tot,blowout:100*blowout/tot};
}

function cell3(rung,youDepth,youHand,herSize,len,o,seedOff,lv){
  let win=0,tot=0,close=0,blowout=0,leftover=0;
  for(let m=1;m<=28;m++){
    const hand=herHand(m,rung,herSize); const C=cardsFor(hand,lv), skyHand=hand.map(h=>200+h.id);
    for(let tr=0;tr<REPS;tr++){
      const r1=rng(9001+seedOff+tr*7919);
      const rest=Array.from({length:28},(_,i)=>i+1).filter(x=>!CHART5.includes(x));
      for(let i=rest.length-1;i>0;i--){const j=Math.floor(r1()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
      const pack=CHART5.concat(rest.slice(0,PACK_EXTRA));
      for(const L of ["you","sky"]){
        const h2=dealN(pack,7000+seedOff+tr*100+m,m,youHand);
        const r=E.playBoard(Object.assign({C,you:h2.slice(),sky:skyHand.slice(),tonight:m,leader:L,len,depth:8,youDepth},o||{}));
        tot++; if(r.winner==="you") win++;
        const played=r.slots.filter(s=>s&&s.id<=28).length;
        leftover+=Math.max(0,youHand-played);
        const d=Math.abs(r.you-r.sky);
        if(d<=1) close++; else if(d>=4) blowout++;
      }
    }
  }
  return {win:100*win/tot,close:100*close/tot,blowout:100*blowout/tot,leftover:leftover/tot};
}
function row2(label,youHand,herSize,len,o,lv){
  const out=[];
  for(const off of [0,50000]){
    const a=cell3(9,8,youHand,herSize,len,o,off,lv), b=cell3(9,0,youHand,herSize,len,o,off,lv);
    out.push({a,b});
  }
  const m=f=>(f(out[0])+f(out[1]))/2;
  const gap=m(x=>x.a.win-x.b.win);
  const spread=Math.abs((out[0].a.win-out[0].b.win)-(out[1].a.win-out[1].b.win));
  console.log("  "+label.padEnd(20)+String(youHand+herSize-len).padStart(4)
    +m(x=>x.a.win).toFixed(1).padStart(9)+m(x=>x.b.win).toFixed(1).padStart(8)
    +gap.toFixed(1).padStart(7)+("±"+spread.toFixed(1)).padStart(7)
    +m(x=>x.a.close).toFixed(0).padStart(8)+m(x=>x.a.blowout).toFixed(0).padStart(9));
}
const HEAD="  build              surp  careful  casual    gap  seeds   close%  blowout%";
console.log("rung 9. TWO SEEDS, 1,568 boards a cell. 'seeds' is the spread between them.\n");
console.log("=== A short road with today's five cards ===");
console.log(HEAD);
for(const len of [5,6,7,8,9]) row2("5 v 5, road "+len,5,5,len);
console.log("\n=== The seven-card road-11 peak, re-checked ===");
console.log(HEAD);
for(const len of [10,11,12]) row2("7 v 7, road "+len,7,7,len);
console.log("\n=== Level 3 ACTUALLY on (cards built at lvl 3, taps live) ===");
console.log(HEAD);
const TAPS={tapMode:true,grantSides:"both",skyCanTap:true,tapOwnCardsOnly:true};
row2("5 v 5, road 7  L2",5,5,7,null,2);
row2("5 v 5, road 7  +L3",5,5,7,TAPS,3);
row2("7 v 7, road 11 +L3",7,7,11,TAPS,3);
