// Early mana use, per deck: on its own turns 2-4, the spell mana its hand could have spent (the best set of
// spell mana values within the lands it had after the land drop; colours and targets ignored, so this is an
// upper bound) against the spell mana it spent, and how often it missed a land drop. A deck far under its
// hand on these turns, against decks that are near theirs, is a pilot that develops too slowly.
// Read it only on batches without injected pilot error (PILOT_ERR_*), which withdraws plays on purpose.
//
//   node tools/log-curve.js <batch logs dir> [deck]   (with a deck: also what it held on the slow turns)
const fs=require("fs"),path=require("path"),z=require("zlib");const [DIR,ONLY]=process.argv.slice(2);
const best=(mvs,cap)=>{let s=new Set([0]);for(const m of mvs){if(m<=0)continue;for(const x of [...s])if(x+m<=cap)s.add(x+m)}return Math.max(...s)};
const S={},held={};
for(const pd of fs.readdirSync(DIR))for(const f of fs.readdirSync(path.join(DIR,pd))){const L=z.gunzipSync(fs.readFileSync(path.join(DIR,pd,f))).toString().split("\n").filter(Boolean).map(JSON.parse);
 const turns=L.filter(r=>r.t==="turn");
 for(const s of [0,1]){const d=L[0].decks[s];if(ONLY&&d!==ONLY)continue;const x=S[d]=S[d]||{n:[0,0,0,0,0],could:[0,0,0,0,0],did:[0,0,0,0,0],noland:[0,0,0,0,0]};
  for(let i=0;i<turns.length;i++){const r=turns[i];if(r.active!==s)continue;const t=Math.ceil(r.turn/2);if(t<2||t>4)continue;
   const nxt=turns.slice(i+1).find(q=>q.active!==s);if(!nxt)continue;
   const landsAfter=nxt.views[s].me.lands, landsBefore=r.views[s].me.lands;
   const hand=r.views[s].me.hand||[];const spells=hand.filter(h=>h.mv>=0);
   const cast=L.filter(q=>q.t==="cast"&&q.turn===r.turn&&q.seat===s&&q.spell);
   const spent=cast.reduce((a,q)=>a+Math.max(0,q.mv),0);
   const could=best(spells.map(h=>h.mv),landsAfter);
   x.n[t]++;x.could[t]+=could;x.did[t]+=Math.min(spent,landsAfter);if(landsAfter<=landsBefore)x.noland[t]++;
   if(d===ONLY&&could-spent>=2){const castN=new Set(cast.map(q=>q.name));const k=spells.filter(h=>h.mv>0&&h.mv<=landsAfter&&!castN.has(h.name)).map(h=>h.name).sort().join(" + ");held[k]=(held[k]||0)+1}}}}
console.log("deck                    turn2 could/did   turn3 could/did   turn4 could/did   missed land drop t2-4");
for(const[d,x] of Object.entries(S).sort())console.log(d.padEnd(24),[2,3,4].map(t=>((x.could[t]/x.n[t]).toFixed(1)+"/"+(x.did[t]/x.n[t]).toFixed(1)).padEnd(18)).join(""),[2,3,4].map(t=>Math.round(100*x.noland[t]/x.n[t])+"%").join(" "));
if(ONLY){console.log("\n"+ONLY+": turns 2-4 that spent 2+ less than the hand allowed; castable-by-cost cards held:");for(const[k,v] of Object.entries(held).sort((a,b)=>b[1]-a[1]).slice(0,15))console.log(" ",String(v).padStart(4),k)}
