const E = require('./manzil-engine-v6.js');
const TWELVE=[6,10,17,18,5,4,3,19,7,26,12,14], FIVE=[6,10,17,18,5], SKY=[101,102,103,104,105];
const C=E.makeCards({lvl:2});
// playBoard with the player's first move forced
function forced(cfg, fc, fi, frev){
  const g=E.mkGame(cfg); g.youDepth=cfg.youDepth==null?8:cfg.youDepth;
  let first=true, guard=0;
  while(g.slots.some(s=>!s) && (g.you.length||g.sky.length) && guard++<40){
    const side=g.turn; let mv=null;
    if(side==="you" && g.you.length){
      if(first && g.you.includes(fc) && !g.slots[fi]){
        const r=E.resolve(g,g.slots,fc,fi,frev,"you"); mv={id:fc,i:fi,rev:frev,r};
      } else mv=E.youMove(g);
      first=false;
    } else if(side==="sky" && g.sky.length) mv=E.skyMove(g);
    if(!mv){ g.turn = side==="you"?"sky":"you"; continue; }
    g.slots=mv.r.slots;
    if(side==="you") g.you=g.you.filter(x=>x!==mv.id); else g.sky=g.sky.filter(x=>x!==mv.id);
    if(mv.r.ret&&mv.r.ret.length){ g.you=g.you.concat(mv.r.ret); g.retUsed=true; }
    g.glanceOn = side==="you" && E.on(g,g.C[mv.id]) && g.C[mv.id].ab==="glance";
    g.turn = side==="you"?"sky":"you";
  }
  return E.boardWinner(g,g.slots)==="you";
}
function scan(pack,label,seeds){
  let best=null, all28=0, tested=0;
  const ids=[...new Set(pack)];
  for(const cid of ids) for(let i=0;i<9;i++) for(const rev of (C[cid].twoFaced?[false,true]:[false])){
    let w=0,t=0,perfect=0; tested++;
    for(let n=1;n<=28;n++){
      let nw=0,nt=0;
      for(const s of seeds){
        let h=E.deal(pack,s,n,true);
        if(!h.includes(cid)) h=[cid].concat(h.slice(1));
        const ok=forced({C,you:h.slice(),sky:SKY.slice(),tonight:n,leader:"you",depth:8,youDepth:8},cid,i,rev);
        t++;nt++; if(ok){w++;nw++;}
      }
      if(nw===nt) perfect++;
    }
    if(perfect===28) all28++;
    if(!best||w/t>best.r) best={r:w/t,cid,i,rev,perfect};
  }
  console.log(`  ${label.padEnd(22)} ${tested} openings · best ${E.POOL[best.cid-1][0]} @slot ${best.i}: ${(100*best.r).toFixed(1)}% · perfect on ${best.perfect}/28 nights · winning all 28: ${all28}`);
}
console.log("forced-opening scan, reference engine, deterministic agents:");
scan(FIVE,"pack of 5",[1]);
scan(TWELVE,"pack of 12",[1,2,3,4,5,6,7,8]);
