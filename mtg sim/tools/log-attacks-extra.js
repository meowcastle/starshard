// Follow-ups to log-attacks.js (NOTE-TO-RESEARCH-13OCT-ATTACKS.md): attacks into blockers by attacker class against
// defender class, deploying before or after combat, and a deck's lethal-missed examples.
//   node tools/log-attacks-extra.js <logs dir> <classes.json> [deck to list lethal-missed examples for]
// research's follow-ups to log-attacks.js: aggro into control blockers; deploy-before-attack; lethal-missed examples
const fs=require('fs'),path=require('path'),zlib=require('zlib');
const [DIR,CL,EX]=process.argv.slice(2);
const cls=Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(CL,'utf8'))).map(([n,x])=>[n,x.class||x]));
const files=[];(function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())w(f);else if(e.name.endsWith('.jsonl.gz'))files.push(f)}})(DIR);
const games=files.map(f=>{try{return zlib.gunzipSync(fs.readFileSync(f)).toString('utf8').split('\n').filter(Boolean).map(JSON.parse)}catch{return null}}).filter(Boolean);
const kind={};for(const g of games)for(const r of g)if(r.t==='cast')kind[r.name]=r.kind;
const xb={},dep={},ex=[];const X=k=>xb[k]=xb[k]||{turns:0,att:0,two:0,twoAtt:0,twoAtt2:0};const P=k=>dep[k]=dep[k]||{atkTurns:0,castAfter:0,heldAtEnd:0,castBefore:0};
for(const g of games){const head=g.find(r=>r.t==='game');const names=head.decks;let turn=null;
 for(let i=0;i<g.length;i++){const r=g[i];if(r.t==='turn'){turn=r;continue}
  if(r.t!=='attack'||!turn||r.turn!==turn.turn)continue;const s=r.seat,me=cls[names[s]]||'other',op=cls[names[1-s]]||'other';
  const mine=turn.board.filter(b=>b.seat===s&&b.kind==='creature'&&!(b.kw||[]).includes('defender'));
  const avail=Math.max(mine.length,r.attackers.length),n=r.attackers.length,def=r.untappedDefenders||0;if(!avail)continue;
  if(def>0){const x=X(me+' v '+op);x.turns++;if(n)x.att++;if(avail>=2&&def===1){x.two++;if(n)x.twoAtt++;if(n>=2)x.twoAtt2++}}
  // deploy: creatures this seat cast this turn, before (MAIN1) and after (MAIN2) combat; creature still castable at turn end
  const same=g.filter(c=>c.t==='cast'&&c.turn===r.turn&&c.seat===s&&c.kind==='creature');
  const te=g.find(c=>c.t==='turn_end'&&c.turn===r.turn);
  if(n>0){const p=P(me);p.atkTurns++;if(same.some(c=>c.phase==='MAIN1'))p.castBefore++;if(same.some(c=>c.phase==='MAIN2'))p.castAfter++;
   const held=te&&te.seats&&te.seats[s]&&(te.seats[s].castable||[]).some(c=>kind[typeof c==='string'?c:c.name]==='creature');if(held)p.heldAtEnd++}
  const life=turn.views&&turn.views[s]?turn.views[s].opp.life:null,pw=Math.max(mine.reduce((a,b)=>a+(b.power||0),0),r.attackers.reduce((a,b)=>a+(b.power||0),0));
  if(EX&&names[s]===EX&&def===0&&life!=null&&pw>=life&&n<avail&&ex.length<8)ex.push(`turn ${r.turn}: opp life ${life}, board ${mine.map(b=>b.name+' '+b.power+'/'+b.toughness+(b.kw&&b.kw.length?' ['+b.kw.join(',')+']':'')).join('; ')} -> attacked with ${r.attackers.map(a=>a.name).join(', ')||'nothing'}`);
 }}
const pct=(a,b)=>b?Math.round(100*a/b)+'%':'-';
console.log('into blockers, by attacker class v defender class: attacked | with 2+ available into exactly 1 untapped blocker: attacked, attacked with 2+');
for(const [k,x] of Object.entries(xb).sort())if(x.turns>=30)console.log('  '+k.padEnd(22)+pct(x.att,x.turns).padStart(4)+' of '+String(x.turns).padEnd(5)+' | '+pct(x.twoAtt,x.two).padStart(4)+', '+pct(x.twoAtt2,x.two).padStart(4)+' of '+x.two);
console.log('\ndeploying, turns it attacked: cast a creature before combat | cast one after combat | a creature still castable at turn end');
for(const [k,p] of Object.entries(dep).sort())console.log('  '+k.padEnd(10)+pct(p.castBefore,p.atkTurns).padStart(4)+' | '+pct(p.castAfter,p.atkTurns).padStart(4)+' | '+pct(p.heldAtEnd,p.atkTurns).padStart(4)+'  of '+p.atkTurns);
if(EX){console.log('\n'+EX+', lethal on an open board not taken:');ex.forEach(e=>console.log('  '+e))}
