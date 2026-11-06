const E = require('./manzil-engine-v6.js');
const FIVE=[5,6,10,17,18], SKY=[101,102,103,104,105];
const C=E.makeCards({lvl:2});
for(let i=1;i<=28;i++) if(!FIVE.includes(i)) C[i]={...C[i], lvl:1, ab:null};
function forced(cfg,fc,fi,frev){
  const g=E.mkGame(cfg); g.youDepth=cfg.youDepth==null?8:cfg.youDepth;
  let first=true,guard=0;
  while(g.slots.some(s=>!s)&&(g.you.length||g.sky.length)&&guard++<40){
    const side=g.turn; let mv=null;
    if(side==="you"&&g.you.length){
      if(first&&g.you.includes(fc)&&!g.slots[fi]){const r=E.resolve(g,g.slots,fc,fi,frev,"you");mv={id:fc,i:fi,rev:frev,r};}
      else mv=E.youMove(g);
      first=false;
    } else if(side==="sky"&&g.sky.length) mv=E.skyMove(g);
    if(!mv){g.turn=side==="you"?"sky":"you";continue;}
    g.slots=mv.r.slots;
    if(side==="you") g.you=g.you.filter(x=>x!==mv.id); else g.sky=g.sky.filter(x=>x!==mv.id);
    if(mv.r.ret&&mv.r.ret.length){g.you=g.you.concat(mv.r.ret);g.retUsed=true;}
    g.glanceOn=side==="you"&&E.on(g,g.C[mv.id])&&g.C[mv.id].ab==="glance";
    g.turn=side==="you"?"sky":"you";
  }
  return E.boardWinner(g,g.slots)==="you";
}
function scan(depth,label){
  let best=null,all28=0;
  for(const cid of FIVE) for(let i=0;i<9;i++) for(const rev of (C[cid].twoFaced?[false,true]:[false])){
    let w=0,t=0,perfect=0;
    for(let n=1;n<=28;n++){
      const ok=forced({C,you:FIVE.slice(),sky:SKY.slice(),tonight:n,leader:"you",depth,youDepth:8},cid,i,rev);
      t++; if(ok){w++;perfect++;}
    }
    if(perfect===28) all28++;
    if(!best||w/t>best.r) best={r:w/t,cid,i,rev,perfect};
  }
  console.log(`  ${label.padEnd(28)} best ${E.POOL[best.cid-1][0]} @slot ${best.i} rev${best.rev?1:0}: ${(100*best.r).toFixed(1)}% · perfect ${best.perfect}/28 · openings winning all 28: ${all28}`);
}
console.log("EMPTY DISTRICT build, forced-opening scan (chart five, no deal, player leads):");
scan(8,"her table, reads 8");
scan(14,"the road boss, reads 14");
