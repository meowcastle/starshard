const E = require('./manzil-engine-v6.js');
const TWELVE=[6,10,17,18,5,4,3,19,7,26,12,14], FIVE=[6,10,17,18,5], SKY=[101,102,103,104,105];
function cell(pack, youDepth, depth=8, guarantee=true){
  const C=E.makeCards({lvl:2}); let w=0,t=0;
  for(let tonight=1;tonight<=28;tonight++) for(let seed=1;seed<=8;seed++){
    const hand=E.deal(pack,seed,tonight,guarantee);
    for(const leader of ["you","sky"]){
      const r=E.playBoard({C,you:hand.slice(),sky:SKY.slice(),tonight,leader,depth,youDepth});
      t++; if(r.winner==="you") w++;
    }
  }
  return +(100*w/t).toFixed(1);
}
const out={};
out["pack5"]=[cell(FIVE,8),cell(FIVE,0)];
out["pack12"]=[cell(TWELVE,8),cell(TWELVE,0)];
out["pack12_noguar"]=[cell(TWELVE,8,8,false),cell(TWELVE,0,8,false)];
out["depth"]=[cell(TWELVE,8,8),cell(TWELVE,8,12),cell(TWELVE,8,14),cell(TWELVE,8,24)];
console.log(JSON.stringify(out));
