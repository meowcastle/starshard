
const CARDS={5:{l:5,r:6,ab:'blaze',lvl:2},6:{l:8,r:6,ab:'storm',lvl:3},10:{l:6,r:9,ab:'throne',lvl:2,two:1},17:{l:6,r:6,lvl:1},18:{l:7,r:7,ab:'heart',lvl:2},101:{l:9,r:5,ab:'saturn',hm:26},102:{l:8,r:6,ab:'mars',hm:14},103:{l:4,r:7,ab:'venus',hm:22},104:{l:6,r:5,ab:'mercury',hm:8},105:{l:7,r:8,ab:'jupiter',hm:2}};
const YOUR=[5,6,10,17,18], SKY=[101,102,103,104,105];
const TEMPERS=['mars','saturn','venus','mercury','jupiter'];
const nb=(i,d)=>{const k=i+d;return k>=0&&k<=8?k:-1};
const bm=(t,i)=>((t-1+i)%28)+1;
const home=(id,i,t)=>(CARDS[id].hm||id)===bm(t,i);
function counts(sl,t){let y=0,s=0;for(let i=0;i<9;i++){const c=sl[i];if(!c)continue;const w=1+(CARDS[c.id].ab==='jupiter'?1:0)+(home(c.id,i,t)?1:0);if((c.g||c.o)==='you')y+=w;else s+=w}return[y,s]}
function heartUp(sl,c){if(!c||c.o!=='you'||CARDS[c.id].ab!=='heart')return 0;let y=0,s=0;for(const x of sl)if(x)(x.o==='you'?y++:s++);return s>y?1:0}
function tryFlip(sl,ai,ti,dir){const a=sl[ai],t=sl[ti];if(!t||t.o===a.o)return 0;const R=dir===1;const av=(R?a.r:a.l)+heartUp(sl,a),tv=(R?t.l:t.r)+heartUp(sl,t);const storm=a.o==='you'&&CARDS[a.id].ab==='storm';if(!(av>tv||(storm&&av===tv)))return 0;if(CARDS[t.id].ab==='saturn')return 0;t.o=a.o;return 1}
function resolve(slIn,id,i,rev,own){const c=CARDS[id];const sl=slIn.map(x=>x?{id:x.id,l:x.l,r:x.r,o:x.o,g:x.g}:null);sl[i]={id,l:rev?c.r:c.l,r:rev?c.l:c.r,o:own,g:own==='you'&&c.ab==='blaze'?'you':undefined};
if(c.ab==='venus'){for(const d of[-1,1]){const k=nb(i,d);if(k<0||!sl[k])continue;const key=d===1?'l':'r';if(sl[k][key]>1)sl[k][key]--}}
let flips=0;const q=[[i,nb(i,-1),-1],[i,nb(i,1),1]];
while(q.length){const[f,to,d]=q.shift();if(to<0||!sl[f])continue;if(!tryFlip(sl,f,to,d))continue;flips++;if(CARDS[sl[f].id].ab==='mars'){const far=nb(to,d);if(far>=0)q.push([to,far,d])}}
return{sl,flips}}
function movesFor(sl,hand,side){const out=[];for(const id of hand){const c=CARDS[id];const revs=(side==='you'?c.two:c.ab==='mercury')?[0,1]:[0];for(let i=0;i<9;i++){if(sl[i])continue;for(const rev of revs){const r=resolve(sl,id,i,rev,side);out.push({id,i,rev,sl:r.sl,flips:r.flips})}}}return out}
function fnv(s){let h=2166136261;for(let k=0;k<s.length;k++){h^=s.charCodeAt(k);h=Math.imul(h,16777619)}return h>>>0}
const seedPick=(t,n,len)=>fnv('2026-08-19:'+t+':'+n)%len;
function feats(m,pre){const adj=(nb(m.i,-1)>=0&&pre[nb(m.i,-1)]?1:0)+(nb(m.i,1)>=0&&pre[nb(m.i,1)]?1:0);let exp=0;for(let k=0;k<9;k++){const c=m.sl[k];if(!c||c.o!=='sky')continue;for(const d of[-1,1]){const q2=nb(k,d);if(q2>=0&&!m.sl[q2])exp++}}const c2=CARDS[m.id];return{mars:m.flips,saturn:-exp,venus:adj,mercury:-adj,jupiter:c2.l+c2.r}}
function pickTop(moves,scoreOf,t,lodged){let top=-1e18;for(const m of moves){m._s=scoreOf(m);if(m._s>top)top=m._s}const c=moves.filter(m=>m._s===top);return c.length===1?c[0]:c[seedPick(t,lodged,c.length)]}
function skyChoice(sl,skyHand,youHand,t,temper,w){const moves=movesFor(sl,skyHand,'sky');
for(const m of moves){const yc=counts(m.sl,t);let base;if(youHand.length>0&&!m.sl.every(x=>x)){let best=null;for(const r of movesFor(m.sl,youHand,'you')){const c2=counts(r.sl,t);const sc=c2[0]-c2[1];if(best===null||sc>best)best=sc}base=(yc[1]-yc[0])*10-(best===null?0:best)*8}else base=(yc[1]-yc[0])*10;m.base=base;m.f=feats(m,sl)}
const lodged=sl.filter(x=>x).length;const plain=pickTop(moves,m=>m.base,t,lodged);let chosen=plain;if(temper&&w)chosen=pickTop(moves,m=>m.base+w*m.f[temper],t,lodged);
return{moves,plain,chosen,lodged}}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t2=Math.imul(a^a>>>15,1|a);t2=t2+Math.imul(t2^t2>>>7,61|t2)^t2;return((t2^t2>>>14)>>>0)/4294967296}}
function youChoice(sl,youHand,skyHand,t,depth,rng){const moves=movesFor(sl,youHand,'you');let top=-1e18;
for(const m of moves){const yc=counts(m.sl,t);let sc;if(depth===1)sc=yc[0]-yc[1];else{let best=null;if(skyHand.length>0&&!m.sl.every(x=>x)){for(const r of movesFor(m.sl,skyHand,'sky')){const c2=counts(r.sl,t);const v=c2[1]-c2[0];if(best===null||v>best)best=v}}sc=(yc[0]-yc[1])*10-(best===null?0:best)*8}m._s=sc;if(sc>top)top=sc}
const c=moves.filter(m=>m._s===top);return c[Math.floor(rng()*c.length)]}
function playBoard(t,lead,depth,temper,w,seed,probe){const rng=mulberry(seed);let sl=Array(9).fill(null);let yh=YOUR.slice(),sh=SKY.slice();let turn=lead;let flips=0,tells=0,skyTurns=0;const probeRows=[];
while(sl.some(x=>!x)){
if(turn==='you'){if(!yh.length){turn='sky';continue}const m=youChoice(sl,yh,sh,t,depth,rng);yh=yh.filter(x=>x!==m.id);sl=m.sl;flips+=m.flips}
else{if(!sh.length){turn='you';continue}const r=skyChoice(sl,sh,yh,t,temper,w);if(probe)probeRows.push({moves:r.moves,plain:r.plain,lodged:r.lodged,t});if(temper&&(r.chosen.id!==r.plain.id||r.chosen.i!==r.plain.i||r.chosen.rev!==r.plain.rev))tells++;skyTurns++;sh=sh.filter(x=>x!==r.chosen.id);sl=r.chosen.sl;flips+=r.chosen.flips}
turn=turn==='you'?'sky':'you'}
const c=counts(sl,t);return{win:c[0]>c[1]?1:0,tied:c[0]===c[1]?1:0,flips,tells,skyTurns,probeRows}}
function runConfig(depth,temper,w,samples){let win=0,tied=0,flips=0,tells=0,skyT=0,n=0;
for(let t=1;t<=28;t++)for(const lead of['you','sky'])for(let s=0;s<samples;s++){const r=playBoard(t,lead,depth,temper,w,t*1000+(lead==='you'?1:2)*97+s*13);win+=r.win;tied+=r.tied;flips+=r.flips;tells+=r.tells;skyT+=r.skyTurns;n++}
return{winPct:+(100*win/n).toFixed(1),tiedPct:+(100*tied/n).toFixed(1),flipsPerBoard:+(flips/n).toFixed(2),tellRate:skyT?+(100*tells/skyT).toFixed(1):0,boards:n}}
