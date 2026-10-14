// Lethal missed, counted by damage sent (log-attacks.js counts any creature kept home, even when the attack was lethal).
//   node tools/log-attacks-lethal.js <logs dir> <classes.json>
const fs=require('fs'),path=require('path'),zlib=require('zlib');const [DIR,CL]=process.argv.slice(2);
const cls=Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(CL,'utf8'))).map(([n,x])=>[n,x.class||x]));
const files=[];(function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())w(f);else if(e.name.endsWith('.jsonl.gz'))files.push(f)}})(DIR);
const T={};const t=k=>T[k]=T[k]||{n:0,tool:0,real:0,realNoLand:0};
for(const f of files){let g;try{g=zlib.gunzipSync(fs.readFileSync(f)).toString('utf8').split('\n').filter(Boolean).map(JSON.parse)}catch{continue}
 const names=g.find(r=>r.t==='game').decks;let turn=null;
 for(const r of g){if(r.t==='turn'){turn=r;continue}if(r.t!=='attack'||!turn||r.turn!==turn.turn)continue;const s=r.seat;
  const mine=turn.board.filter(b=>b.seat===s&&b.kind==='creature'&&!(b.kw||[]).includes('defender'));const avail=Math.max(mine.length,r.attackers.length);
  if(!avail||(r.untappedDefenders||0)>0)continue;const life=turn.views&&turn.views[s]?turn.views[s].opp.life:null;if(life==null)continue;
  const pw=Math.max(mine.reduce((a,b)=>a+(b.power||0),0),r.attackers.reduce((a,b)=>a+(b.power||0),0));if(pw<life)continue;
  const sent=r.attackers.reduce((a,b)=>a+(b.power||0),0);
  // the same, counting only creatures that aren't animated lands (a land kept home may be mana the turn needs)
  const isLand=b=>/^(Forest|Island|Swamp|Mountain|Plains)$/.test(b.name)||(b.types||'').includes('Land');
  const pwNL=mine.filter(b=>!isLand(b)).reduce((a,b)=>a+(b.power||0),0),sentNL=r.attackers.filter(b=>!isLand(b)).reduce((a,b)=>a+(b.power||0),0);
  for(const k of [cls[names[s]]||'other',names[s]]){const x=t(k);x.n++;if(r.attackers.length<avail)x.tool++;if(sent<life)x.real++;if(pwNL>=life&&sentNL+0<life&&sent<life)x.realNoLand++}}}
const p=(a,b)=>b?Math.round(100*a/b)+'%':'-';
console.log('lethal on an open board: the tool\'s count (any creature kept home) | the attack sent fell short of their life | short even without counting animated lands');
for(const [k,x] of Object.entries(T).sort((a,b)=>(a[0].length>10)-(b[0].length>10)||a[0].localeCompare(b[0])))console.log('  '+k.padEnd(22)+p(x.tool,x.n).padStart(4)+' | '+p(x.real,x.n).padStart(4)+' | '+p(x.realNoLand,x.n).padStart(4)+'  of '+x.n);
