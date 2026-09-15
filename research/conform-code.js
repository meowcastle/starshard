// Run the conformance pack against Code's module (manzil-engine-current.cjs) through a thin adapter.
const E=require(process.argv[2]||"/tmp/c913/to-design/manzil-engine-current.cjs");
const CASES=require("/tmp/now2/conformance.json"); let conformSettleWarned=false;
const KIND={beatAt:"beat",shellAt:"shell",reachAt:"reach",resonAt:"reson",tollAt:"toll",crowAt:"crow",softAt:"price",guestAt:"guest",plantAt:"plant",turnAt:"turn",hushAt:"hush",strangerAt:"stranger",razorAt:"razor",postAt:"post",openAt:"open",ropeAt:"rope",eyeAt:"eye",voidAt:"void"};
let pass=0,fail=0,skip=0;
for(const t of CASES){
  const kindKey=Object.keys(t.cfg).find(k=>KIND[k]); const kind=KIND[kindKey];
  if(!kind||kind==="post"){ skip++; console.log("  skip  "+t.law+": "+t.note); continue; }
  const station=Array.isArray(t.cfg[kindKey])?t.cfg[kindKey][0]:t.cfg[kindKey];
  const saved=E.LAW_AT[t.night]; E.LAW_AT[t.night]={kind, station};
  const savedOff=E.BOARD_OFF[t.night];
  try{
    const levels={}; for(let i=1;i<=28;i++) levels[i]= t.deck==="granted"?2:1;
    const base=E.cards({levels, grants: t.deck==="granted"?"all":undefined});
    const C=E.ladderOpponentCards(base, levels);
    for(const id of Object.keys(C)){ if(t.deck==="granted"){ C[id]={...C[id], ab:null}; } }
    const g=E.mkGame({C, tonight:t.night, you:(t.hands&&t.hands.you)||[], sky:(t.hands&&t.hands.sky)||[]});
    const slots=Array.from({length:9},()=>null);
    for(const b of t.board){ const s={id:b.id, owner:b.owner, l:b.l, r:b.r, age:1, by:b.owner};
      if(b.taken){ s.by = b.owner==="you"?"sky":"you"; s.taken=true; }
      if(b.crowned) s.crowned=true; if(b.lodger) s.lodger=b.lodger; if(b.ab){ C[b.id]={...C[b.id], ab:b.ab}; }
      slots[b.i]=s; }
    let out=null, res=slots;
    if(t.act.strike!=null){ const i=t.act.strike, s=slots[i]; res=slots.slice(); res[i]=null;
      const r=E.resolve(g,res,s.id,i,false,s.owner); res=r.slots||r; }
    else if(t.act.strikeTwice){ for(const i of t.act.strikeTwice){ const s=res[i]; const r2=res.slice(); r2[i]=null; const r=E.resolve(g,r2,s.id,i,false,s.owner); res=r.slots||r; } }
    else if(t.act.lodge){ const L=t.act.lodge; const r=E.resolve(g,slots,L.id,L.i,!!L.rev,L.side); res=r.slots||r; }
    let ok=true, why=[];
    if(t.expect.owner) for(const i in t.expect.owner){ const o=res[i]&&(res[i].ground||res[i].owner); if(o!==t.expect.owner[i]){ok=false; why.push(`owner[${i}]=${o} want ${t.expect.owner[i]}`);} }
    if(t.expect.counts){ const c=E.counts(g,res); if(c[0]!==t.expect.counts[0]||c[1]!==t.expect.counts[1]){ok=false; why.push(`counts=${c} want ${t.expect.counts}`);} }
    // the settle record (15 Sep): if the module exposes settle(g,slots) compare the five terms + reason.
    const settleFn = E.settle || E._settle;
    if(t.expect.settle && typeof settleFn==="function"){ const r=settleFn(g,res); const S=t.expect.settle; const f=x=>x&&[x.you,x.sky].join(",");
      for(const k of ["stations","dominion","cards","law","dawn","total"]) if(f(r[k])!==S[k].join(",")){ok=false; why.push(`settle.${k}=${f(r[k])} want ${S[k].join(",")}`);}
      if(r.reason!==S.reason){ok=false; why.push(`settle.reason=${r.reason} want ${S.reason}`);} }
    else if(t.expect.settle && !conformSettleWarned){ conformSettleWarned=true; console.log("  (module exposes no settle(); the five terms are not compared)"); }
    if(t.expect.face){ for(const i in t.expect.face) for(const d in t.expect.face[i]){ const v=E.faceOf(g,res,Number(i),Number(d)); if(v!==t.expect.face[i][d]){ok=false; why.push(`face[${i}][${d}]=${v} want ${t.expect.face[i][d]}`);} } }
    if(t.expect.faces){ for(const f of t.expect.faces){ const v=E.faceOf(g,res,f.i,f.dir); if(v!==f.v){ok=false; why.push(`face[${f.i}][${f.dir}]=${v} want ${f.v}`);} } }
    if(ok){pass++; console.log("  ok    "+t.law+" m"+t.night+"@"+station+": "+t.note);} else {fail++; console.log("  FAIL  "+t.law+" m"+t.night+"@"+station+": "+t.note+"  ["+why.join("; ")+"]");}
  }catch(e){ fail++; console.log("  ERR   "+t.law+": "+t.note+"  "+e.message.slice(0,120)); }
  finally{ if(saved) E.LAW_AT[t.night]=saved; else delete E.LAW_AT[t.night]; }
}
console.log(`\n  ${pass} passed, ${fail} failed, ${skip} skipped`);
