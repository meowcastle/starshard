// MANZIL LAW CONFORMANCE PACK — declarative acceptance cases for every shipped and queued law.
// Each case is engine-agnostic: a board, a law config, one action, one expectation. Written so
// Code can run them against the client module with a thin adapter, rather than against this
// reference. Every case here is verified green against research/v2.js by this file.
//
//   board:  list of {i, id, owner, l, r} plus optional flags (taken, crowned, lodger, grant, ab)
//   act:    {strike:i} | {lodge:{id,i,side}} | {count:true} | {openSlots:true}
//   expect: {owner:{i:side}} | {counts:[you,sky]} | {face:{i:dir:value}} | {open:[...]}
//
// STATION NUMBERING IS 0-BASED THROUGHOUT, with the mansion standing on it named in every case.

const CASES = [
// ---------------------------------------------------------------- the beat (m18, live)
{law:"beat", night:18, station:1, note:"m19 the root. every strike from the station lands harder, both sides",
 cfg:{beatAt:1}, deck:"plain",
 board:[{i:1,id:1,owner:"you",l:6,r:6},{i:2,id:201,owner:"sky",l:6,r:6}],
 act:{strike:1}, expect:{owner:{2:"you"}}},

// ---------------------------------------------------------------- the shell / tents (m25, live)
{law:"shell", night:25, station:4, note:"m1 the gate. taken, the station counts for nobody",
 cfg:{shellAt:4}, deck:"plain",
 board:[{i:4,id:201,owner:"sky",l:5,r:5},{i:5,id:1,owner:"you",l:9,r:9}],
 act:{strike:5}, expect:{owner:{4:"you"}, counts:[1,0]}},
{law:"shell", night:25, station:4, note:"m1 the gate. untaken, it counts as normal (id 2 is not home here)",
 cfg:{shellAt:4}, deck:"plain",
 board:[{i:4,id:2,owner:"you",l:6,r:6}],
 act:{count:true}, expect:{counts:[1,0]}},

// ---------------------------------------------------------------- the reach (m10, live)
{law:"reach", night:10, station:0, note:"m10 the throne. the strike carries two stations",
 cfg:{reachAt:0}, deck:"plain",
 board:[{i:0,id:1,owner:"you",l:7,r:7},{i:2,id:201,owner:"sky",l:6,r:6}],
 act:{strike:0}, expect:{owner:{2:"you"}}},
{law:"reach", night:10, station:0, note:"PRINTED faces at the far station: a raised face does not carry",
 cfg:{reachAt:0}, deck:"plain",
 board:[{i:0,id:2,owner:"you",l:11,r:11},{i:2,id:201,owner:"sky",l:8,r:8}],
 act:{strike:0}, expect:{owner:{2:"sky"}}},

// ---------------------------------------------------------------- the reson / drum (m23, live)
{law:"reson", night:23, station:2, note:"a strike into the station carries one further, once only",
 cfg:{resonAt:2}, deck:"plain",
 board:[{i:1,id:1,owner:"you",l:9,r:9},{i:2,id:201,owner:"sky",l:6,r:6},
        {i:3,id:202,owner:"sky",l:5,r:5},{i:4,id:203,owner:"sky",l:4,r:4}],
 act:{strike:1}, expect:{owner:{2:"you",3:"you",4:"sky"}}},

// ---------------------------------------------------------------- the toll (m2, live)
{law:"toll", night:2, station:4, note:"m6 the storm, tiger ground. a sheltered card counts one less",
 cfg:{tollAt:4,tollBy:1}, deck:"granted",
 board:[{i:4,id:2,owner:"you",l:6,r:6}],
 act:{count:true}, expect:{counts:[0,0]}},
{law:"toll", night:2, station:4, note:"an unsheltered card at the same station pays nothing",
 cfg:{tollAt:4,tollBy:1}, deck:"plain",
 board:[{i:4,id:2,owner:"you",l:6,r:6}],
 act:{count:true}, expect:{counts:[1,0]}},
{law:"toll", night:2, station:4, note:"the shield test and the strike path agree: what is charged is what is refused",
 cfg:{tollAt:4,tollBy:1}, deck:"granted",
 board:[{i:4,id:2,owner:"you",l:5,r:5},{i:5,id:224,owner:"sky",l:9,r:9}],
 act:{strike:5}, expect:{owner:{4:"you"}}},

// ---------------------------------------------------------------- the crow (m4, live)
{law:"crow", night:4, station:4, note:"m8 the ghost. a point moves from the richer neighbour to the crossing",
 cfg:{crowAt:4}, deck:"plain",
 board:[{i:4,id:1,owner:"you",l:6,r:6},{i:5,id:202,owner:"sky",l:6,r:6}],
 act:{count:true}, expect:{counts:[2,0]}},
{law:"crow", night:4, station:4, note:"alone at the crossing it still gains, and nobody pays",
 cfg:{crowAt:4}, deck:"plain",
 board:[{i:4,id:1,owner:"you",l:6,r:6}],
 act:{count:true}, expect:{counts:[2,0]}},

// ---------------------------------------------------------------- the price (m5, live)
{law:"price", night:5, station:4, note:"m9 the glance. a sheltered card STRIKES two lower",
 cfg:{softAt:4,softBy:2,softShield:true}, deck:"granted",
 board:[{i:4,id:2,owner:"you",l:6,r:6}],
 act:{face:{i:4,dir:1}}, expect:{face:4}},
{law:"price", night:5, station:4, note:"an unsheltered card at the crossing strikes as printed",
 cfg:{softAt:4,softBy:2,softShield:true}, deck:"plain",
 board:[{i:4,id:2,owner:"you",l:6,r:6}],
 act:{face:{i:4,dir:1}}, expect:{face:6}},
{law:"price", night:5, station:4, note:"the price is the station's: one station over, as printed",
 cfg:{softAt:4,softBy:2,softShield:true}, deck:"granted",
 board:[{i:3,id:2,owner:"you",l:6,r:6}],
 act:{face:{i:3,dir:1}}, expect:{face:6}},

// ---------------------------------------------------------------- the guest strip (m26, queued)
{law:"guest", night:26, station:0, note:"m26 the chamber. the tiger's ground does not hold at the door",
 cfg:{guestAt:0,guestStrip:true}, deck:"granted",
 board:[{i:0,id:1,owner:"sky",l:5,r:5},{i:1,id:226,owner:"you",l:9,r:9}],
 act:{strike:1}, expect:{owner:{0:"you"}}},
{law:"guest", night:26, station:0, note:"away from the door the same card holds",
 cfg:{guestAt:0,guestStrip:true}, deck:"granted",
 board:[{i:4,id:1,owner:"sky",l:5,r:5},{i:5,id:226,owner:"you",l:9,r:9}],
 act:{strike:5}, expect:{owner:{4:"sky"}}},

// ---------------------------------------------------------------- plantOnTake / the root (m19, queued)
{law:"plant", night:15, station:4, note:"slid window, m19 at index 4. takeable once, rooted after",
 cfg:{plantAt:4,plantOnTake:true}, deck:"plain",
 board:[{i:4,id:201,owner:"sky",l:5,r:5},{i:5,id:1,owner:"you",l:9,r:9},
        {i:3,id:202,owner:"sky",l:9,r:9}],
 act:{strikeTwice:[5,3]}, expect:{owner:{4:"you"}}},

// ---------------------------------------------------------------- the turn (m12, queued)
{law:"turn", night:12, station:0, note:"the station's neighbour up the road reads its faces reversed",
 cfg:{turnAt:0}, deck:"plain",
 board:[{i:0,id:1,owner:"you",l:6,r:6},{i:1,id:201,owner:"sky",l:3,r:8}],
 act:{face:{i:1,dir:1}}, expect:{face:3}},

// ---------------------------------------------------------------- the hush (m21, queued)
{law:"hush", night:21, station:4, note:"while the station is held, both its neighbours count for nobody",
 cfg:{hushAt:4}, deck:"plain",
 board:[{i:3,id:1,owner:"you",l:6,r:6},{i:4,id:2,owner:"you",l:6,r:6},
        {i:5,id:203,owner:"sky",l:6,r:6}],
 act:{count:true}, expect:{counts:[1,0]}},

// ---------------------------------------------------------------- the stranger (m27, queued)
{law:"stranger", night:27, station:4, note:"m3 the gathered stars, TIGER ground. a tortoise card counts one more",
 cfg:{strangerAt:4,strangerPlus:1}, deck:"plain",
 board:[{i:4,id:24,owner:"you",l:6,r:6}],
 act:{count:true}, expect:{counts:[2,0]}},
{law:"stranger", night:27, station:4, note:"a tiger card on tiger ground counts as ever",
 cfg:{strangerAt:4,strangerPlus:1}, deck:"plain",
 board:[{i:4,id:2,owner:"you",l:6,r:6}],
 act:{count:true}, expect:{counts:[1,0]}},

// ---------------------------------------------------------------- the razor (m3, recommended)
{law:"razor", night:3, station:4, note:"m7 the return. one neighbour would hold, so neither falls",
 cfg:{razorAt:4}, deck:"plain",
 board:[{i:3,id:203,owner:"sky",l:6,r:6},{i:5,id:205,owner:"sky",l:9,r:9}],
 act:{lodge:{id:1,i:4,side:"you"}}, expect:{owner:{3:"sky",5:"sky"}}},
{law:"razor", night:3, station:4, note:"both would fall, so the stroke lands on both",
 cfg:{razorAt:4}, deck:"plain",
 board:[{i:3,id:203,owner:"sky",l:2,r:2},{i:5,id:205,owner:"sky",l:2,r:2}],
 act:{lodge:{id:1,i:4,side:"you"}}, expect:{owner:{3:"you",5:"you"}}},

// ---------------------------------------------------------------- the two posts (m1, recommended)
{law:"post", night:1, station:"3,5", note:"m4 and m6, both tiger ground. a sheltered card at either post strikes two lower",
 cfg:{postAt:[3,5],postN:2}, deck:"granted",
 board:[{i:3,id:2,owner:"you",l:6,r:6},{i:4,id:2,owner:"you",l:6,r:6},{i:5,id:2,owner:"you",l:6,r:6}],
 act:{faces:[{i:3,dir:1},{i:4,dir:1},{i:5,dir:1}]}, expect:{faces:[4,6,4]}},
// ---------------------------------------------------------------- DAWN (14 Sep, the second seat's compensation)
// hands: the cards each side still holds when the road fills. The road here is nine plain 6/6 cards not in either
// hand, five yours (0,2,4,6,8) and four hers, so the road counts 5 v 4 before dawn.
{law:"dawn", night:9, station:-1, note:"duel: pairings only, strongest against strongest by printed total; the spare card scores nothing; a tie scores nobody",
 cfg:{dawn:"duel"}, deck:"plain", hands:{you:[14,15,1], sky:[201,202,224,209]},   // you 14,11,12 v her 12,11,12,11 -> [14,12,11] v [12,12,11,11]: 14>12 you, 12=12 nobody, 11=11 nobody, her 4th unpaired
 board:[{i:0,id:2,owner:"you",l:6,r:6},{i:1,id:211,owner:"sky",l:6,r:6},{i:2,id:4,owner:"you",l:6,r:6},{i:3,id:213,owner:"sky",l:6,r:6},
        {i:4,id:6,owner:"you",l:6,r:6},{i:5,id:215,owner:"sky",l:6,r:6},{i:6,id:8,owner:"you",l:6,r:6},{i:7,id:217,owner:"sky",l:6,r:6},{i:8,id:10,owner:"you",l:6,r:6}],
 act:{count:true}, expect:{counts:[6,4]}},
{law:"dawn", night:9, station:-1, note:"duel: the leader's stronger hand wins both pairings",
 cfg:{dawn:"duel"}, deck:"plain", hands:{you:[14,24], sky:[201,202,209]},          // you 14,12 v her 12,11,11 -> 14>12 you, 12>11 you
 board:[{i:0,id:2,owner:"you",l:6,r:6},{i:1,id:211,owner:"sky",l:6,r:6},{i:2,id:4,owner:"you",l:6,r:6},{i:3,id:213,owner:"sky",l:6,r:6},
        {i:4,id:6,owner:"you",l:6,r:6},{i:5,id:215,owner:"sky",l:6,r:6},{i:6,id:8,owner:"you",l:6,r:6},{i:7,id:217,owner:"sky",l:6,r:6},{i:8,id:10,owner:"you",l:6,r:6}],
 act:{count:true}, expect:{counts:[7,4]}},
{law:"dawn", night:9, station:-1, note:"dawn is read only when the road is full",
 cfg:{dawn:"duel"}, deck:"plain", hands:{you:[14,15], sky:[201,202,209]},
 board:[{i:0,id:2,owner:"you",l:6,r:6},{i:1,id:211,owner:"sky",l:6,r:6}],
 act:{count:true}, expect:{counts:[1,1]}},
];

// ---- runner against research/v2.js, to prove every case above is green here first
const E=require("/tmp/now2/v2.js");
function deckFor(kind){
  if(kind==="granted"){
    const C=E.makeCards({lvl:2, grants:{1:true,2:true,3:true,4:true,5:true,6:true,28:true},
                         abOff:{1:true,2:true,3:true,4:true,5:true,6:true,24:true,26:true,28:true}});
    const c={}; for(const i of [1,2,3,4,5,6,24,26,28]) c[i]={...C[i], who:"you"};
    for(const i of [1,2,3,4,5,6,24,26,28]) c[200+i]={...C[i], id:200+i, who:"sky", homeM:i};
    c[226]={...C[26], id:226, who:"you", homeM:26, grant:null, ab:null};
    c[224]={...C[24], id:224, who:"sky", homeM:24, grant:null, ab:null};
    return c;
  }
  const C=E.makeCards({lvl:1});
  const c={}; for(let i=1;i<=28;i++){ c[i]={...C[i], who:"you"}; c[200+i]={...C[i], id:200+i, who:"sky", homeM:i}; }
  c[226]={...C[26], id:226, who:"you", homeM:26}; c[224]={...C[24], id:224, who:"sky", homeM:24};
  return c;
}
let pass=0, fail=0;
for(const t of CASES){
  const g=E.mkGame(Object.assign({C:deckFor(t.deck), tonight:t.night}, t.cfg, t.hands?{you:t.hands.you, sky:t.hands.sky}:{}));
  for(const b of t.board) g.slots[b.i]={id:b.id, owner:b.owner, l:b.l, r:b.r,
                                        ...(b.taken?{taken:true}:{}), ...(b.lodger?{lodger:b.lodger}:{})};
  let slots=g.slots, got={}, want={};
  if(t.act.strike!=null){ E.strike(g,slots,t.act.strike); }
  else if(t.act.strikeTwice){ for(const i of t.act.strikeTwice) E.strike(g,slots,i); }
  else if(t.act.lodge){ slots=E.resolve(g,slots,t.act.lodge.id,t.act.lodge.i,false,t.act.lodge.side).slots; }
  if(t.expect.owner){ for(const k in t.expect.owner){ got[k]=slots[k]&&slots[k].owner; want[k]=t.expect.owner[k]; } }
  if(t.expect.counts){ const [y,k]=t.hands?E.finalCounts(g,slots):E.counts(g,slots); got.counts=[y,k].join(","); want.counts=t.expect.counts.join(","); }
  if(t.expect.counts){ const r=E.settle(g,slots); const flat=x=>[x.you,x.sky];
    const sum=["stations","dominion","cards","law","dawn"].reduce((a,k)=>[a[0]+r[k].you,a[1]+r[k].sky],[0,0]);
    got.invariant=sum.join(",")+"="+flat(r.total).join(","); want.invariant=flat(r.total).join(",")+"="+flat(r.total).join(",");
    got.settleTotal=flat(r.total).join(","); want.settleTotal=t.expect.counts.join(",");
    const S={stations:flat(r.stations),dominion:flat(r.dominion),cards:flat(r.cards),law:flat(r.law),dawn:flat(r.dawn),total:flat(r.total),reason:r.reason,level:r.level};
    if(t.expect.settle){ got.settle=JSON.stringify(S); want.settle=JSON.stringify(t.expect.settle); } else t.expect.settle=S; }
  if(t.expect.face!=null){ got.face=E.faceOf(g,slots,t.act.face.i,t.act.face.dir); want.face=t.expect.face; }
  if(t.expect.faces){ got.faces=t.act.faces.map(f=>E.faceOf(g,slots,f.i,f.dir)).join(",");
                      want.faces=t.expect.faces.join(","); }
  const okAll=Object.keys(want).every(k=>String(got[k])===String(want[k]));
  if(okAll){pass++;} else {fail++;
    console.log("  FAIL  "+t.law+" — "+t.note+"\n        want "+JSON.stringify(want)+"  got "+JSON.stringify(got));}
}
console.log("\n  CONFORMANCE PACK: "+CASES.length+" cases, "+pass+" green, "+fail+" red (against the reference)");
if(!fail) require("fs").writeFileSync("/tmp/now2/conformance.json", JSON.stringify(CASES,null,1));
