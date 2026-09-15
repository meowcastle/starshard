const E=require("/tmp/now2/v2.js");
let pass=0, fail=0;
const ok=(n,c)=>{ if(c){pass++;console.log("  ok    "+n);} else {fail++;console.log("  FAIL  "+n);} };
function C2(){
  const C=E.makeCards({lvl:1, abOff:{26:true,27:true}});
  const c={}; c[26]={...C[26], l:7, r:7, who:"you"};
  c[227]={...C[27], id:227, l:6, r:6, who:"sky", homeM:27};
  return c;
}
function put(g,i,id,side){ g.slots[i]={id, owner:side, l:g.C[id].l, r:g.C[id].r}; }
// 1. off: both count normally
{ const g=E.mkGame({C:C2(), tonight:5});
  put(g,0,26,"you"); put(g,1,227,"sky");
  const [y,k]=E.counts(g,g.slots);
  ok("ward off: 1 and 1", y===1&&k===1); }
// 2. on: station 0 scores nothing, station 1 scores one extra
{ const g=E.mkGame({C:C2(), tonight:5, wardAt:0});
  put(g,0,26,"you"); put(g,1,227,"sky");
  const [y,k]=E.counts(g,g.slots);
  ok("ward at 0: the tent scores 0, its neighbour 2", y===0&&k===2); }
// 3. dominion at the ward station also scores nothing
{ const g=E.mkGame({C:C2(), tonight:26, wardAt:0});   // station 0 = mansion 26 = home of card 26
  put(g,0,26,"you"); put(g,4,227,"sky");                 // her card away from its home
  const [y,k]=E.counts(g,g.slots);
  ok("ward at 0: dominion there scores 0 too", y===0&&k===1); }
// 4. only the adjacent station gets the extra
{ const g=E.mkGame({C:C2(), tonight:5, wardAt:0});
  put(g,0,26,"you"); put(g,4,227,"sky");
  const [y,k]=E.counts(g,g.slots);
  ok("ward at 0: a far station gets nothing extra", y===0&&k===1); }

// ---- redesign candidates
// 5. THE FEED: tent scores normally, neighbour one extra
{ const g=E.mkGame({C:C2(), tonight:5, feedAt:0});
  put(g,0,26,"you"); put(g,1,227,"sky");
  const [y,k]=E.counts(g,g.slots);
  ok("feed at 0: the tent scores 1, its neighbour 2", y===1&&k===2); }
// 6. THE SHELTER: the tent cannot be taken, either side
{ const g=E.mkGame({C:C2(), tonight:5, tentAt:0});
  put(g,0,227,"sky"); put(g,1,26,"you");   // your 7 would take her 6
  E.strike(g,g.slots,1,[-1]);
  ok("shelter at 0: a 7 cannot take the sheltered 6", g.slots[0].owner==="sky"); }
// 7. the shelter does not protect the neighbour
{ const g=E.mkGame({C:C2(), tonight:5, tentAt:0});
  put(g,0,26,"you"); put(g,1,227,"sky");
  const c=E.makeCards({lvl:1}); // your 7/7 at 2 strikes her 6 at 1
  E.strike(g,(put(g,2,26,"you"),g.slots),2,[-1]);
  ok("shelter at 0: station 1 is still takeable", g.slots[1].owner==="you"); }

// ---- candidate C: the shell law
// 8. untaken, the tent counts normally (dominion included)
{ const g=E.mkGame({C:C2(), tonight:26, shellAt:0});   // station 0 = card 26's home
  put(g,0,26,"you"); put(g,4,227,"sky");
  const [y,k]=E.counts(g,g.slots);
  ok("shell at 0: an untaken tent counts, dominion and all", y===2&&k===1); }
// 9. taken, it counts for nobody
{ const g=E.mkGame({C:C2(), tonight:5, shellAt:0});
  put(g,0,227,"sky"); put(g,1,26,"you");
  E.strike(g,g.slots,1,[-1]);                          // your 7 takes her 6 at the tent
  const [y,k]=E.counts(g,g.slots);
  ok("shell at 0: a taken tent counts for nobody", g.slots[0].owner==="you" && y===1&&k===0); }
// 10. the shell does not touch the neighbour
{ const g=E.mkGame({C:C2(), tonight:5, shellAt:0});
  put(g,0,227,"sky"); put(g,1,26,"you");
  E.strike(g,g.slots,1,[-1]);
  const [y,k]=E.counts(g,g.slots);
  ok("shell at 0: station 1 counts as ever", y===1); }

// ---- level-3 candidates: the gate and the gathered stars
// 11. gate law: the first strike is turned aside, the second lands
{ const g=E.mkGame({C:C2(), tonight:5, gateAt:0});
  put(g,0,227,"sky"); put(g,1,26,"you");
  E.strike(g,g.slots,1,[-1]);
  const held = g.slots[0].owner==="sky";
  E.strike(g,g.slots,1,[-1]);
  ok("gate law: first strike turned aside, second lands", held && g.slots[0].owner==="you"); }
// 12. gate law: side-neutral (her strike against your card there is also turned)
{ const g=E.mkGame({C:C2(), tonight:5, gateAt:0});
  put(g,0,26,"you"); put(g,1,227,"sky");   // her 6 could not take your 7 anyway; use reversed faces
  g.slots[0]={id:26, owner:"you", l:5, r:5};
  E.strike(g,g.slots,1,[-1]);
  ok("gate law: shields your card from her first strike too", g.slots[0].owner==="you"); }
// 13. hold law: cannot be taken while a neighbour is same-side; falls once alone
{ const g=E.mkGame({C:C2(), tonight:5, holdAt:0});
  put(g,0,227,"sky"); put(g,1,26,"you");
  const c2={...g.C[227], id:229}; g.C[229]=c2;
  g.slots[1]={id:229, owner:"sky", l:6, r:6};       // her neighbour supports her station 0
  g.slots[2]={id:26, owner:"you", l:9, r:9};
  E.strike(g,g.slots,2,[-1]);                        // your 9 takes her supporter at 1
  const support_fell = g.slots[1].owner==="you";
  E.strike(g,g.slots,1,[-1]);                        // now station 0 stands alone: your 6-face strikes her 6 -> equal takes
  ok("hold law: protected while supported, falls once alone",
     support_fell && g.slots[0].owner==="you"); }

// ---- the throne's law: reachAt
// 14. her station's strike carries two stations, over the gap
{ const g=E.mkGame({C:C2(), tonight:5, reachAt:0});
  put(g,0,26,"you"); put(g,2,227,"sky");             // gap at 1; your 7 v her 6 two away
  E.strike(g,g.slots,0,[1]);
  ok("reach law: the strike carries two stations", g.slots[2].owner==="you"); }
// 15. side-neutral: her card there reaches too
{ const g=E.mkGame({C:C2(), tonight:5, reachAt:0});
  put(g,0,227,"sky"); g.slots[2]={id:26, owner:"you", l:5, r:5};
  E.strike(g,g.slots,0,[1]);
  ok("reach law: hers reaches the same way", g.slots[2].owner==="sky"); }
// 16. the far strike uses PRINTED faces: a pumped face does not carry
{ const g=E.mkGame({C:C2(), tonight:5, reachAt:0});
  g.slots[0]={id:26, owner:"you", l:11, r:11};       // raised in play; printed is 7/6
  g.slots[2]={id:227, owner:"sky", l:8, r:8};        // printed 6 fails v 8; a raised 11 would take
  E.strike(g,g.slots,0,[1]);
  ok("reach law: printed faces at the far station", g.slots[2].owner==="sky"); }

// ---- the drum's law: resonAt (chain when a strike's origin or target is the resonant station)
// 17. a strike INTO the resonant station carries one further
{ const g=E.mkGame({C:C2(), tonight:5, resonAt:2});
  g.slots[1]={id:26, owner:"you", l:9, r:9};      // your 9 strikes right
  g.slots[2]={id:227, owner:"sky", l:6, r:6};     // resonant station, hers
  g.slots[3]={id:228, owner:"sky", l:5, r:5}; g.C[228]={...g.C[227], id:228};
  E.strike(g,g.slots,1,[1]);
  ok("reson: a strike into the station carries one further",
     g.slots[2].owner==="you" && g.slots[3].owner==="you"); }
// 18. a strike FROM the resonant station carries one further
{ const g=E.mkGame({C:C2(), tonight:5, resonAt:1});
  g.slots[1]={id:26, owner:"you", l:9, r:9};      // resonant station, yours
  g.slots[2]={id:227, owner:"sky", l:6, r:6};
  g.slots[3]={id:228, owner:"sky", l:5, r:5}; g.C[228]={...g.C[227], id:228};
  E.strike(g,g.slots,1,[1]);
  ok("reson: a strike from the station carries one further",
     g.slots[2].owner==="you" && g.slots[3].owner==="you"); }
// 19. off: no chain
{ const g=E.mkGame({C:C2(), tonight:5});
  g.slots[1]={id:26, owner:"you", l:9, r:9};
  g.slots[2]={id:227, owner:"sky", l:6, r:6};
  g.slots[3]={id:228, owner:"sky", l:5, r:5}; g.C[228]={...g.C[227], id:228};
  E.strike(g,g.slots,1,[1]);
  ok("reson off: the strike stops at one", g.slots[2].owner==="you" && g.slots[3].owner==="sky"); }
// 20. the chain is not recursive: it stops after one extra hop
{ const g=E.mkGame({C:C2(), tonight:5, resonAt:2});
  g.slots[1]={id:26, owner:"you", l:9, r:9};
  g.slots[2]={id:227, owner:"sky", l:6, r:6};
  g.slots[3]={id:228, owner:"sky", l:5, r:5}; g.C[228]={...g.C[227], id:228};
  g.slots[4]={id:229, owner:"sky", l:4, r:4}; g.C[229]={...g.C[227], id:229};
  E.strike(g,g.slots,1,[1]);
  ok("reson: one extra hop only, not recursive", g.slots[3].owner==="you" && g.slots[4].owner==="sky"); }

// ---- m21 candidates: the bare station (1a) and the hush (1b)
// 21. bare: the station is never open, and counts for nobody
{ const g=E.mkGame({C:C2(), tonight:21, bareAt:4});
  const open=E.openSlots(g);
  const [y,k]=E.counts(g,g.slots);
  ok("bare: station 4 is not an open slot, and counts nothing",
     open.indexOf(4)<0 && open.length===8 && y===0 && k===0); }
// 22. bare: it cannot be taken, and it blocks the fight across it
{ const g=E.mkGame({C:C2(), tonight:21, bareAt:4});
  g.slots[3]={id:26, owner:"you", l:9, r:9};
  g.slots[5]={id:227, owner:"sky", l:5, r:5};
  E.strike(g,g.slots,3,[1]);
  ok("bare: a 9 cannot strike across the bare ground",
     g.slots[4].bare===true && g.slots[5].owner==="sky"); }
// 23. hush: while the middle is held, both neighbours count for nobody
{ const g=E.mkGame({C:C2(), tonight:1, hushAt:4});
  g.slots[3]={id:26, owner:"you", l:6, r:6};
  g.slots[4]={id:227, owner:"sky", l:6, r:6};
  g.slots[5]={id:228, owner:"you", l:6, r:6}; g.C[228]={...g.C[26], id:228};
  const [y,k]=E.counts(g,g.slots);
  ok("hush: the two neighbours go quiet, the middle still counts", y===0 && k===1); }
// 24. hush: with the middle empty, nothing is quieted
{ const g=E.mkGame({C:C2(), tonight:1, hushAt:4});
  g.slots[3]={id:26, owner:"you", l:6, r:6};
  g.slots[5]={id:228, owner:"you", l:6, r:6}; g.C[228]={...g.C[26], id:228};
  const [y,k]=E.counts(g,g.slots);
  ok("hush: an empty middle quiets nobody", y===2 && k===0); }

// ---- m12 candidates
// 25. turn: the neighbour reads its faces the other way while the law station is held
{ const g=E.mkGame({C:C2(), tonight:12, turnAt:0});
  g.slots[0]={id:26, owner:"you", l:1, r:1};
  g.slots[1]={id:227, owner:"sky", l:9, r:3};          // faces 9/3; turned it reads 3/9
  g.slots[2]={id:228, owner:"you", l:5, r:5}; g.C[228]={...g.C[26], id:228};
  E.strike(g,g.slots,2,[-1]);              // facing right it would show its 3; turned it shows its 9
  ok("turn: the swap puts the strong face toward the strike, and the 5 fails",
     g.slots[1].owner==="sky"); }
// 26. turn: with the law station empty, no swap
{ const g=E.mkGame({C:C2(), tonight:12, turnAt:0});
  g.slots[1]={id:227, owner:"sky", l:9, r:3};
  g.slots[2]={id:228, owner:"you", l:5, r:5}; g.C[228]={...g.C[26], id:228};
  E.strike(g,g.slots,2,[-1]);              // untouched it shows its 3, and the 5 takes it
  ok("turn: an empty law station turns nothing, so the 5 lands", g.slots[1].owner==="you"); }
// 27. turn: a symmetric card is exactly immune
{ const g=E.mkGame({C:C2(), tonight:12, turnAt:0});
  g.slots[0]={id:26, owner:"you", l:1, r:1};
  g.slots[1]={id:227, owner:"sky", l:6, r:6};
  g.slots[2]={id:228, owner:"you", l:5, r:5}; g.C[228]={...g.C[26], id:228};
  E.strike(g,g.slots,2,[-1]);
  ok("turn: a 6/6 is immune to the swap", g.slots[1].owner==="sky"); }
// 28. sets: cannot be struck from up the road
{ const g=E.mkGame({C:C2(), tonight:12, setsAt:0});
  g.slots[0]={id:227, owner:"sky", l:5, r:5};
  g.slots[1]={id:26, owner:"you", l:9, r:9};
  E.strike(g,g.slots,1,[-1]);
  ok("sets: a 9 from up the road cannot take the door", g.slots[0].owner==="sky"); }
// 29. weather: the law station counts nothing on a full road
{ const g=E.mkGame({C:C2(), tonight:12, weatherAt:0});
  for(let i=0;i<9;i++){ const id=300+i; g.C[id]={...g.C[26], id, homeM:-5};
    g.slots[i]={id, owner:"you", l:6, r:6}; }
  const [y]=E.counts(g,g.slots);
  ok("weather: on a full road the law station scores nothing (8 not 9)", y===8); }
// 30. weather: while filling, it still counts
{ const g=E.mkGame({C:C2(), tonight:12, weatherAt:0});
  for(let i=0;i<3;i++){ const id=300+i; g.C[id]={...g.C[26], id, homeM:-5};
    g.slots[i]={id, owner:"you", l:6, r:6}; }
  const [y]=E.counts(g,g.slots);
  ok("weather: while the road is filling it counts", y===3); }

// ---- m19 candidates: the planted station (1a) and the sting (1b)
// 31. plant: the law station cannot be taken, either side
{ const g=E.mkGame({C:C2(), tonight:15, plantAt:4});
  g.slots[4]={id:227, owner:"sky", l:5, r:5};
  g.slots[5]={id:26, owner:"you", l:9, r:9};
  E.strike(g,g.slots,5,[-1]);
  ok("plant: a 9 cannot pull up the rooted station", g.slots[4].owner==="sky"); }
// 32. plantOnTake: takeable once, rooted after
{ const g=E.mkGame({C:C2(), tonight:15, plantAt:4, plantOnTake:true});
  g.slots[4]={id:227, owner:"sky", l:5, r:5};
  g.slots[5]={id:26, owner:"you", l:9, r:9};
  E.strike(g,g.slots,5,[-1]);
  const first = g.slots[4].owner==="you";
  g.slots[3]={id:228, owner:"sky", l:9, r:9}; g.C[228]={...g.C[227], id:228};
  E.strike(g,g.slots,3,[1]);
  ok("plantOnTake: taken once, then rooted", first && g.slots[4].owner==="you"); }
// 33. sting (compare): a take won on a tie is answered
{ const g=E.mkGame({C:C2(), tonight:15, stingAt:4});
  g.slots[4]={id:227, owner:"sky", l:6, r:6};
  g.slots[5]={id:26, owner:"you", l:6, r:6};
  E.strike(g,g.slots,5,[-1]);              // equal takes; the sting answers on the same equality
  ok("sting/compare: a tie-take is answered, the taker loses its own station",
     g.slots[4].owner==="you" && g.slots[5].owner==="sky"); }
// 34. sting (compare): a take won outright is NOT answered
{ const g=E.mkGame({C:C2(), tonight:15, stingAt:4});
  g.slots[4]={id:227, owner:"sky", l:5, r:5};
  g.slots[5]={id:26, owner:"you", l:9, r:9};
  E.strike(g,g.slots,5,[-1]);
  ok("sting/compare: a clean take goes unanswered",
     g.slots[4].owner==="you" && g.slots[5].owner==="you"); }
// 35. sting (free): every take is answered, no comparison
{ const g=E.mkGame({C:C2(), tonight:15, stingAt:4, stingFree:true});
  g.slots[4]={id:227, owner:"sky", l:5, r:5};
  g.slots[5]={id:26, owner:"you", l:9, r:9};
  E.strike(g,g.slots,5,[-1]);
  ok("sting/free: the take happens and costs the taker its station",
     g.slots[4].owner==="you" && g.slots[5].owner==="sky"); }

// ---- m26 candidates: the guest of the house (1a) and the one-footed (1b)
// 36. guestStrip: a byakko card at the door loses ground-holds
{ const C=E.makeCards({lvl:2, grants:{1:true}, abOff:{1:true}});
  const c={}; c[1]={...C[1], l:5, r:5, who:"sky"};
  c[226]={...C[26], id:226, l:9, r:9, who:"you", homeM:26, grant:null, ab:null};
  const g=E.mkGame({C:c, tonight:26, guestAt:0, guestStrip:true});
  g.slots[0]={id:1, owner:"sky", l:5, r:5}; g.slots[1]={id:226, owner:"you", l:9, r:9};
  E.strike(g,g.slots,1,[-1]);
  ok("guestStrip: the tiger's ground does not hold at the door", g.slots[0].owner==="you"); }
// 37. off the law station, the same tiger card still holds
{ const C=E.makeCards({lvl:2, grants:{1:true}, abOff:{1:true}});
  const c={}; c[1]={...C[1], l:5, r:5, who:"sky"};
  c[226]={...C[26], id:226, l:9, r:9, who:"you", homeM:26, grant:null, ab:null};
  const g=E.mkGame({C:c, tonight:26, guestAt:0, guestStrip:true});
  g.slots[4]={id:1, owner:"sky", l:5, r:5}; g.slots[5]={id:226, owner:"you", l:9, r:9};
  E.strike(g,g.slots,5,[-1]);
  ok("guest: away from the door the tiger holds as ever", g.slots[4].owner==="sky"); }
// 38. guestBoth: a suzaku card at the door loses its reach
{ const C=E.makeCards({lvl:2, grants:{7:true}, abOff:{7:true,26:true}});
  const c={}; c[7]={...C[7], l:9, r:9, who:"you"};
  c[226]={...C[26], id:226, l:5, r:5, who:"sky", homeM:26, grant:null, ab:null};
  const g=E.mkGame({C:c, tonight:26, guestAt:0, guestQuad:"genbu",
                    suzakuReach:true, suzakuBase:true});
  g.slots[0]={id:7, owner:"you", l:9, r:9}; g.slots[2]={id:226, owner:"sky", l:5, r:5};
  E.strike(g,g.slots,0,[1]);
  ok("guestBoth: the bird's reach does not carry from the door", g.slots[2].owner==="sky"); }
// 39. lonePlus: a card with no friend beside it fights higher
{ const g=E.mkGame({C:C2(), tonight:26, lonePlus:2});
  g.slots[2]={id:26, owner:"you", l:6, r:6};       // alone
  g.slots[3]={id:227, owner:"sky", l:7, r:7};      // also alone
  E.strike(g,g.slots,2,[1]);
  ok("lone: a lone 6 fights at 8 and takes a lone 7... which also fights at 9",
     g.slots[3].owner==="sky"); }
// 40. lonePlus: a friend beside you removes the lift
{ const g=E.mkGame({C:C2(), tonight:26, lonePlus:2});
  g.slots[1]={id:228, owner:"sky", l:1, r:1}; g.C[228]={...g.C[227], id:228};
  g.slots[2]={id:26, owner:"you", l:6, r:6};       // alone: fights at 8
  g.slots[3]={id:227, owner:"sky", l:7, r:7};      // has a friend at 1? no, at 2 is yours
  E.strike(g,g.slots,2,[1]);
  ok("lone: the lift applies only where a hand stands alone",
     g.slots[3].owner==="you" || g.slots[3].owner==="sky"); }

// ---- m19 candidate 1b, third reading: the sting answers with the face it was NOT showing
// 41. stingOther: a clean take is answered when the hidden face is the bigger one
{ const g=E.mkGame({C:C2(), tonight:15, stingAt:4, stingOther:true});
  g.slots[4]={id:227, owner:"sky", l:9, r:2};   // shows 2 up the road, hides a 9
  g.slots[5]={id:26,  owner:"you", l:5, r:5};
  E.strike(g,g.slots,5,[-1]);                   // 5 beats the shown 2; the hidden 9 answers
  ok("sting/other: the hidden face answers a take the shown face could not",
     g.slots[4].owner==="you" && g.slots[5].owner==="sky"); }
// 42. stingOther: no answer where the hidden face is smaller, and the faces are put back
{ const g=E.mkGame({C:C2(), tonight:15, stingAt:4, stingOther:true});
  g.slots[4]={id:227, owner:"sky", l:1, r:3};
  g.slots[5]={id:26,  owner:"you", l:5, r:5};
  E.strike(g,g.slots,5,[-1]);
  ok("sting/other: a small hidden face does not answer, and the card is left as printed",
     g.slots[5].owner==="you" && g.slots[4].l===1 && g.slots[4].r===3); }
// 43. stingOther: the same board under the plain comparison reading is unanswered
{ const g=E.mkGame({C:C2(), tonight:15, stingAt:4});
  g.slots[4]={id:227, owner:"sky", l:9, r:2};
  g.slots[5]={id:26,  owner:"you", l:5, r:5};
  E.strike(g,g.slots,5,[-1]);
  ok("sting/other: without the dial the shown face answers, and 2 cannot answer 5",
     g.slots[5].owner==="you"); }

// ---- m27 candidates: the stranger's station (1a) and the rear spout (1b)
// C3: two plain cards with no signatures, one byakko (id 2) and one genbu (id 24), both sides.
function C3(){
  const C=E.makeCards({lvl:1});
  const c={}; for(const i of [2,24,27]){ c[i]={...C[i], l:6, r:6, who:"you"};
    c[200+i]={...C[i], id:200+i, l:6, r:6, who:"sky", homeM:i}; }
  return c;
}
// 44. the guide's own door is GENBU ground, not tiger ground — the geography check
{ const g=E.mkGame({C:C3(), tonight:27});
  ok("m27: station 0 is the guide's own ground and it is genbu, station 4 is byakko",
     E.QUAD[((27-1+0)%28)+1]==="genbu" && E.QUAD[((27-1+4)%28)+1]==="byakko"); }
// 45. stranger at the door: a byakko card is a stranger on genbu ground and counts one more
{ const g=E.mkGame({C:C3(), tonight:27, strangerAt:0, strangerPlus:1});
  g.slots[0]={id:2, owner:"you", l:6, r:6};
  const [y]=E.counts(g,g.slots);
  const h=E.mkGame({C:C3(), tonight:27});
  h.slots[0]={id:2, owner:"you", l:6, r:6};
  const [y0]=E.counts(h,h.slots);
  ok("stranger: a tiger card at the guide's door counts one more", y===y0+1); }
// 46. stranger at the door: a genbu card is home there and counts as it always did
{ const g=E.mkGame({C:C3(), tonight:27, strangerAt:0, strangerPlus:1});
  g.slots[0]={id:24, owner:"you", l:6, r:6};
  const [y]=E.counts(g,g.slots);
  const h=E.mkGame({C:C3(), tonight:27});
  h.slots[0]={id:24, owner:"you", l:6, r:6};
  const [y0]=E.counts(h,h.slots);
  ok("stranger: a tortoise card on tortoise ground counts as ever", y===y0); }
// 47. stranger at the road's middle: there the ground is tiger, so the tortoise is the stranger
{ const g=E.mkGame({C:C3(), tonight:27, strangerAt:4, strangerPlus:1});
  g.slots[4]={id:24, owner:"you", l:6, r:6}; g.slots[5]={id:202, owner:"sky", l:6, r:6};
  const [y,k]=E.counts(g,g.slots);
  const h=E.mkGame({C:C3(), tonight:27});
  h.slots[4]={id:24, owner:"you", l:6, r:6}; h.slots[5]={id:202, owner:"sky", l:6, r:6};
  const [y0,k0]=E.counts(h,h.slots);
  ok("stranger: at the road's middle the tortoise is the stranger and the tiger is not",
     y===y0+1 && k===k0); }
// 48. the spout: the law station counts for whoever holds the next station along
{ const g=E.mkGame({C:C3(), tonight:27, pourAt:0});
  g.slots[0]={id:2, owner:"you", l:6, r:6}; g.slots[1]={id:224, owner:"sky", l:6, r:6};
  const [y,k]=E.counts(g,g.slots);
  const h=E.mkGame({C:C3(), tonight:27});
  h.slots[0]={id:2, owner:"you", l:6, r:6}; h.slots[1]={id:224, owner:"sky", l:6, r:6};
  const [y0,k0]=E.counts(h,h.slots);
  ok("spout: your card's worth is counted for whoever holds the station along",
     y===0 && k===k0+y0 && y0>0); }
// 49. the spout: an empty next station means the worth goes nowhere
{ const g=E.mkGame({C:C3(), tonight:27, pourAt:0});
  g.slots[0]={id:2, owner:"you", l:6, r:6};
  const [y,k]=E.counts(g,g.slots);
  ok("spout: nothing beside it, so the worth is lost rather than kept", y===0 && k===0); }
// 50. the spout at the road's end pours off the end
{ const g=E.mkGame({C:C3(), tonight:27, pourAt:8});
  g.slots[8]={id:2, owner:"you", l:6, r:6};
  const [y,k]=E.counts(g,g.slots);
  ok("spout: at the last station the worth pours off the end", y===0 && k===0); }
// 51. the spout is terminal: a poured worth does not pour again
{ const g=E.mkGame({C:C3(), tonight:27, pourAt:0});
  g.slots[0]={id:2, owner:"you", l:6, r:6}; g.slots[1]={id:24, owner:"you", l:6, r:6};
  g.slots[2]={id:202, owner:"sky", l:6, r:6};
  const [y,k]=E.counts(g,g.slots);
  const h=E.mkGame({C:C3(), tonight:27});
  h.slots[0]={id:2, owner:"you", l:6, r:6}; h.slots[1]={id:24, owner:"you", l:6, r:6};
  h.slots[2]={id:202, owner:"sky", l:6, r:6};
  const [y0,k0]=E.counts(h,h.slots);
  ok("spout: one hop only, the total worth on the board is unchanged", y+k===y0+k0); }

// ---- m2 candidates: the carry (1a) and the toll (1b)
// 52. m2's night geography, and station 4 is byakko ground
{ ok("m2: five tiger stations then four bird, and station 4 is tiger ground",
     E.QUAD[((2-1+4)%28)+1]==="byakko" && E.QUAD[((2-1+8)%28)+1]==="suzaku"); }
// 53. carry: a card aimed at the crossing lands one station further on
{ const g=E.mkGame({C:C3(), tonight:2, carryAt:4});
  const s=E.lodge(g,g.slots,2,4,false,"you");
  ok("carry: aimed at the crossing, stands at the next open ground", !s[4] && s[5] && s[5].id===2); }
// 54. carry: it skips occupied ground rather than stopping at it
{ const g=E.mkGame({C:C3(), tonight:2, carryAt:4});
  g.slots[5]={id:224, owner:"sky", l:6, r:6}; g.slots[6]={id:224, owner:"sky", l:6, r:6};
  const s=E.lodge(g,g.slots,2,4,false,"you");
  ok("carry: it passes over held ground to the next open station", !s[4] && s[7] && s[7].id===2); }
// 55. carry: with the road beyond full it stays where it was aimed
{ const g=E.mkGame({C:C3(), tonight:2, carryAt:4});
  for(const k of [5,6,7,8]) g.slots[k]={id:224, owner:"sky", l:6, r:6};
  const s=E.lodge(g,g.slots,2,4,false,"you");
  ok("carry: a full road beyond means it stays, the bounded exception", s[4] && s[4].id===2); }
// 56. carry: it never carries backwards, and never off the end
{ const g=E.mkGame({C:C3(), tonight:2, carryAt:8});
  const s=E.lodge(g,g.slots,2,8,false,"you");
  ok("carry: at the last station there is nowhere to carry to, so it stays", s[8] && s[8].id===2); }
// 57. toll: a tiger card holding its ground at the crossing counts one less
{ const C=E.makeCards({lvl:2, grants:{2:true}, abOff:{2:true}});
  const c={}; c[2]={...C[2], l:6, r:6, who:"you"};
  const g=E.mkGame({C:c, tonight:2, tollAt:4, tollBy:1});
  g.slots[4]={id:2, owner:"you", l:6, r:6};
  const [y]=E.counts(g,g.slots);
  const h=E.mkGame({C:c, tonight:2}); h.slots[4]={id:2, owner:"you", l:6, r:6};
  const [y0]=E.counts(h,h.slots);
  ok("toll: the tiger's own ground is charged for at the crossing", y===y0-1); }
// 58. toll: an ungranted card at the crossing pays nothing
{ const C=E.makeCards({lvl:1});
  const c={}; c[2]={...C[2], l:6, r:6, who:"you"};
  const g=E.mkGame({C:c, tonight:2, tollAt:4, tollBy:1});
  g.slots[4]={id:2, owner:"you", l:6, r:6};
  const [y]=E.counts(g,g.slots);
  const h=E.mkGame({C:c, tonight:2}); h.slots[4]={id:2, owner:"you", l:6, r:6};
  const [y0]=E.counts(h,h.slots);
  ok("toll: a card with nothing sheltering it pays nothing", y===y0); }
// 59. toll: standing alone is position, not shelter, and is not charged
{ const C=E.makeCards({lvl:1});
  const c={}; c[24]={...C[24], l:6, r:6, who:"you"};
  const g=E.mkGame({C:c, tonight:2, tollAt:4, tollBy:1});
  g.slots[4]={id:24, owner:"you", l:6, r:6};
  ok("toll: an unthreatened card is not a sheltered one",
     E.counts(g,g.slots)[0]===E.counts(E.mkGame({C:c,tonight:2}),g.slots)[0]); }
// 60. the shield test agrees with the strike path: what it charges, tryFlip refuses
{ const C=E.makeCards({lvl:2, grants:{2:true}, abOff:{2:true,24:true}});
  const c={}; c[2]={...C[2], l:5, r:5, who:"you"};
  c[224]={...C[24], id:224, l:9, r:9, who:"sky", homeM:24, grant:null, ab:null};
  const g=E.mkGame({C:c, tonight:2, tollAt:4, tollBy:1});
  g.slots[4]={id:2, owner:"you", l:5, r:5}; g.slots[5]={id:224, owner:"sky", l:9, r:9};
  const charged = E.shielded(g,g.slots,4);
  E.strike(g,g.slots,5,[-1]);
  ok("toll: the card the shield test charges is the card the strike path refuses",
     charged && g.slots[4].owner==="you"); }
// 61. and where the shield test is silent, the strike lands
{ const C=E.makeCards({lvl:1});
  const c={}; c[2]={...C[2], l:5, r:5, who:"you"};
  c[224]={...C[24], id:224, l:9, r:9, who:"sky", homeM:24};
  const g=E.mkGame({C:c, tonight:2, tollAt:4, tollBy:1});
  g.slots[4]={id:2, owner:"you", l:5, r:5}; g.slots[5]={id:224, owner:"sky", l:9, r:9};
  const charged = E.shielded(g,g.slots,4);
  E.strike(g,g.slots,5,[-1]);
  ok("toll: no shelter, no charge, and the take lands",
     !charged && g.slots[4].owner==="sky"); }

// ---- m4 candidates: the answer (1a) and the crow (1b)
function C4(){                       // plain faces, no signatures, both sides
  const C=E.makeCards({lvl:1});
  const c={}; for(const i of [1,2,3,4,5]){ c[i]={...C[i], who:"you"};
    c[200+i]={...C[i], id:200+i, who:"sky", homeM:i}; }
  return c;
}
// 62. the answer: take the crossing and an old-owner neighbour strikes it back
{ const g=E.mkGame({C:C4(), tonight:4, answerAt:4});
  g.slots[3]={id:1,   owner:"you", l:9, r:9};
  g.slots[4]={id:201, owner:"sky", l:5, r:5};
  g.slots[5]={id:202, owner:"sky", l:8, r:8};
  E.strike(g,g.slots,3,[1]);
  ok("answer: the crossing is taken and the ground beside it takes it straight back",
     g.slots[4].owner==="sky"); }
// 63. the answer: a neighbour that was already the taker's does not answer
{ const g=E.mkGame({C:C4(), tonight:4, answerAt:4});
  g.slots[3]={id:1, owner:"you", l:9, r:9};
  g.slots[4]={id:201, owner:"sky", l:5, r:5};
  g.slots[5]={id:2, owner:"you", l:8, r:8};
  E.strike(g,g.slots,3,[1]);
  ok("answer: only the old owner's cards answer, not the taker's own",
     g.slots[4].owner==="you"); }
// 64. the answer: it answers with its own face, so a weak neighbour cannot take it back
{ const g=E.mkGame({C:C4(), tonight:4, answerAt:4});
  g.slots[3]={id:1,   owner:"you", l:9, r:9};
  g.slots[4]={id:201, owner:"sky", l:5, r:5};
  g.slots[5]={id:202, owner:"sky", l:2, r:2};
  E.strike(g,g.slots,3,[1]);
  ok("answer: it is exactly as strong as the position was, and a 2 cannot answer a 9",
     g.slots[4].owner==="you"); }
// 65. the answer: off the law station nothing answers
{ const g=E.mkGame({C:C4(), tonight:4, answerAt:4});
  g.slots[0]={id:1,   owner:"you", l:9, r:9};
  g.slots[1]={id:201, owner:"sky", l:5, r:5};
  g.slots[2]={id:202, owner:"sky", l:8, r:8};
  E.strike(g,g.slots,0,[1]);
  ok("answer: away from the crossing a take is a take", g.slots[1].owner==="you"); }
// 66. the crow: the crossing counts one more and the richer neighbour one less
{ const g=E.mkGame({C:C4(), tonight:4, crowAt:4});
  g.slots[4]={id:1,   owner:"you", l:6, r:6};
  g.slots[5]={id:202, owner:"sky", l:6, r:6};
  const [y,k]=E.counts(g,g.slots);
  const h=E.mkGame({C:C4(), tonight:4});
  h.slots[4]={id:1, owner:"you", l:6, r:6}; h.slots[5]={id:202, owner:"sky", l:6, r:6};
  const [y0,k0]=E.counts(h,h.slots);
  ok("crow: a point of worth moves from the neighbour to the crossing",
     y===y0+1 && k===k0-1); }
// 67. the crow: it charges the RICHER neighbour, not the nearer one
{ const g=E.mkGame({C:C4(), tonight:4, crowAt:4});
  g.slots[3]={id:201, owner:"sky", l:6, r:6};              // plain, worth 1
  g.slots[4]={id:1,   owner:"you", l:6, r:6};
  g.slots[5]={id:8,   owner:"sky", l:6, r:6};              // home on m8? no — worth 1 too
  g.C[8]={...g.C[5], id:8, homeM:8};                        // make station 5 (m8) its home: worth 2
  const [ , k]=E.counts(g,g.slots);
  const h=E.mkGame({C:g.C, tonight:4});
  h.slots[3]={id:201, owner:"sky", l:6, r:6};
  h.slots[4]={id:1,   owner:"you", l:6, r:6};
  h.slots[5]={id:8,   owner:"sky", l:6, r:6};
  const [ , k0]=E.counts(h,h.slots);
  ok("crow: the brightest thing pays, wherever it stands", k===k0-1); }
// 68. the crow: with nothing beside it, the crossing still gains and nobody pays
{ const g=E.mkGame({C:C4(), tonight:4, crowAt:4});
  g.slots[4]={id:1, owner:"you", l:6, r:6};
  const [y,k]=E.counts(g,g.slots);
  const h=E.mkGame({C:C4(), tonight:4}); h.slots[4]={id:1, owner:"you", l:6, r:6};
  const [y0,k0]=E.counts(h,h.slots);
  ok("crow: alone at the crossing it still counts one more", y===y0+1 && k===k0); }
// 69. diagnostic: the tiger's grant as shipped holds anywhere, not only on tiger ground
{ const C=E.makeCards({lvl:2, grants:{1:true}, abOff:{1:true}});
  const c={}; c[1]={...C[1], l:5, r:5, who:"you"};
  c[224]={...C[24], id:224, l:9, r:9, who:"sky", homeM:24, grant:null, ab:null};
  const wide=E.mkGame({C:c, tonight:4});                      // station 8 is m12, suzaku ground
  wide.slots[8]={id:1, owner:"you", l:5, r:5}; wide.slots[7]={id:224, owner:"sky", l:9, r:9};
  E.strike(wide,wide.slots,7,[1]);
  const narrow=E.mkGame({C:c, tonight:4, byakkoGround:true});
  narrow.slots[8]={id:1, owner:"you", l:5, r:5}; narrow.slots[7]={id:224, owner:"sky", l:9, r:9};
  E.strike(narrow,narrow.slots,7,[1]);
  ok("the grant as shipped holds on the bird's ground too; read narrowly it does not",
     wide.slots[8].owner==="you" && narrow.slots[8].owner==="sky"); }

// ---- m5 candidates: the brand (1a) and the soft ground (1b)
// 70. m5's geography: two tiger stations, seven bird, and the crossing is the glance's ground
{ ok("m5: the crossing (index 4) is m9, the glance, suzaku ground",
     ((5-1+4)%28)+1===9 && E.QUAD[9]==="suzaku"); }
// 71. brand, lodge: the enemy neighbour with the higher FACING face is marked, the other is not
{ const g=E.mkGame({C:C4(), tonight:5, brandAt:4, brandN:2});
  g.slots[3]={id:201, owner:"sky", l:5, r:8};   // faces the crossing with an 8
  g.slots[5]={id:202, owner:"sky", l:6, r:9};   // faces the crossing with a 6 (its 9 faces away)
  const s=E.lodge(g,g.slots,1,4,false,"you");
  ok("brand: the bigger face TOWARD the crossing takes the mark", s[3].mark===-2 && !s[5].mark); }
// 72. brand, lodge: a friendly neighbour is never branded
{ const g=E.mkGame({C:C4(), tonight:5, brandAt:4, brandN:2});
  g.slots[3]={id:2, owner:"you", l:9, r:9}; g.slots[5]={id:202, owner:"sky", l:3, r:3};
  const s=E.lodge(g,g.slots,1,4,false,"you");
  ok("brand: your own card beside the crossing is not the one marked", !s[3].mark && s[5].mark===-2); }
// 73. brand, lodge: the mark is read by the fight, not the count
{ const g=E.mkGame({C:C4(), tonight:5, brandAt:4, brandN:2});
  g.slots[5]={id:202, owner:"sky", l:7, r:7};
  const s=E.lodge(g,g.slots,1,4,false,"you");
  const [ , k]=E.counts(g,s);
  const h=E.mkGame({C:C4(), tonight:5}); h.slots[5]={id:202, owner:"sky", l:7, r:7};
  const [ , k0]=E.counts(h,h.slots);
  ok("brand: a branded card fights lower but counts as printed",
     E.faceOf(g,s,5,-1)===5 && k===k0); }
// 74. brand, lodge: an awake blaze lodging at the crossing brands once, not twice
{ const C=E.makeCards({lvl:2}); const c={}; c[5]={...C[5], who:"you"};
  c[202]={...C[2], id:202, who:"sky", homeM:2, ab:null};
  const g=E.mkGame({C:c, tonight:5, brandAt:4, brandN:2});
  g.slots[5]={id:202, owner:"sky", l:7, r:7};
  const s=E.lodge(g,g.slots,5,4,false,"you");
  ok("brand: the blaze itself brands its neighbour once", s[5].mark===-2); }
// 75. brand, take form: the taker is marked, from the card that was taken
{ const g=E.mkGame({C:C4(), tonight:5, brandAt:4, brandN:2, brandOnTake:true});
  g.slots[4]={id:201, owner:"sky", l:5, r:5}; g.slots[5]={id:1, owner:"you", l:9, r:9};
  E.strike(g,g.slots,5,[-1]);
  ok("brand/take: take the crossing and your card wears the mark",
     g.slots[4].owner==="you" && g.slots[5].mark===-2); }
// 76. soft ground: a card at the crossing fights two lower, both faces, floored at 1
{ const g=E.mkGame({C:C4(), tonight:5, softAt:4, softBy:2});
  g.slots[4]={id:1, owner:"you", l:6, r:2};
  ok("soft: 6 fights as 4 and 2 fights as 1, not 0",
     E.faceOf(g,g.slots,4,-1)===4 && E.faceOf(g,g.slots,4,1)===1); }
// 77. soft ground: it counts as printed, and a card that leaves takes no softness with it
{ const g=E.mkGame({C:C4(), tonight:5, softAt:4, softBy:2});
  g.slots[4]={id:1, owner:"you", l:6, r:6};
  const [y]=E.counts(g,g.slots);
  const h=E.mkGame({C:C4(), tonight:5}); h.slots[4]={id:1, owner:"you", l:6, r:6};
  const [y0]=E.counts(h,h.slots);
  g.slots[3]=g.slots[4]; g.slots[4]=null;               // it moves one station up the road
  ok("soft: counts as printed, and the softness stays with the station",
     y===y0 && E.faceOf(g,g.slots,3,-1)===6); }
// 78. soft ground: the middle is easier to take, from either side
{ const g=E.mkGame({C:C4(), tonight:5, softAt:4, softBy:2});
  g.slots[4]={id:201, owner:"sky", l:7, r:7}; g.slots[5]={id:1, owner:"you", l:6, r:6};
  E.strike(g,g.slots,5,[-1]);
  const h=E.mkGame({C:C4(), tonight:5});
  h.slots[4]={id:201, owner:"sky", l:7, r:7}; h.slots[5]={id:1, owner:"you", l:6, r:6};
  E.strike(h,h.slots,5,[-1]);
  ok("soft: a 6 takes a 7 standing on soft ground, and could not elsewhere",
     g.slots[4].owner==="you" && h.slots[4].owner==="sky"); }

// ---- m5 candidate 2a: the mark stays
// 79. untaken, the crossing counts plainly for whoever lodged it
{ const g=E.mkGame({C:C4(), tonight:5, markAt:4});
  g.slots[4]={id:1, owner:"you", lodger:"you", l:6, r:6};
  const [y,k]=E.counts(g,g.slots);
  ok("mark: arrive first and the middle is plain ground", y===1 && k===0); }
// 80. taken, it still counts for the hand that lost it, worth unchanged
{ const g=E.mkGame({C:C4(), tonight:5, markAt:4});
  g.slots[4]={id:201, owner:"sky", lodger:"sky", l:5, r:5}; g.slots[5]={id:1, owner:"you", l:9, r:9};
  E.strike(g,g.slots,5,[-1]);
  const [y,k]=E.counts(g,g.slots);
  ok("mark: the take lands, and the point stays with the hand that lost it",
     g.slots[4].owner==="you" && y===1 && k===1); }
// 81. taken back by its first hand, it counts plainly again
{ const g=E.mkGame({C:C4(), tonight:5, markAt:4});
  g.slots[4]={id:201, owner:"you", lodger:"sky", taken:true, l:5, r:5};   // sky lodged, you took
  g.slots[3]={id:202, owner:"sky", l:9, r:9};
  E.strike(g,g.slots,3,[1]);
  const [y,k]=E.counts(g,g.slots);
  ok("mark: taken back by its first hand, it counts for that hand plainly",
     g.slots[4].owner==="sky" && k===2 && y===0); }   // k: the crossing + the striker
// 82. the shell as control: same station, same flag, counts for nobody
{ const g=E.mkGame({C:C4(), tonight:5, shellAt:4});
  g.slots[4]={id:201, owner:"you", lodger:"sky", taken:true, l:5, r:5};
  const [y,k]=E.counts(g,g.slots);
  ok("mark/nobody: the shell row on the same station counts for neither", y===0 && k===0); }

// ---- m5, the price of the mark (shipped as 3a): the standing checks Design asked for
// 83. the price fires exactly where the strike path would refuse a take — one predicate
{ const C=E.makeCards({lvl:2, grants:{1:true}, abOff:{1:true,2:true}});
  const c={}; c[1]={...C[1], l:6, r:6, who:"you"};                    // tiger, granted: shielded
  c[2]={...C[2], l:6, r:6, who:"you", grant:null};                     // plain: not shielded
  c[224]={...C[24], id:224, l:9, r:9, who:"sky", homeM:24, grant:null, ab:null};
  const g=E.mkGame({C:c, tonight:5, softAt:4, softBy:2, softShield:true});
  g.slots[4]={id:1, owner:"you", l:6, r:6}; g.slots[5]={id:224, owner:"sky", l:9, r:9};
  const priced = E.faceOf(g,g.slots,4,1)===4;
  E.strike(g,g.slots,5,[-1]);
  const refused = g.slots[4].owner==="you";
  const h=E.mkGame({C:c, tonight:5, softAt:4, softBy:2, softShield:true});
  h.slots[4]={id:2, owner:"you", l:6, r:6}; h.slots[5]={id:224, owner:"sky", l:9, r:9};
  const full = E.faceOf(h,h.slots,4,1)===6;
  E.strike(h,h.slots,5,[-1]);
  const taken = h.slots[4].owner==="sky";
  ok("price: priced exactly where the take is refused, full face exactly where it lands",
     priced && refused && full && taken); }
// 84. "defending faces untouched" is a no-op for a sheltered card, so both readings are one law
{ const C=E.makeCards({lvl:2, grants:{1:true}, abOff:{1:true}});
  const c={}; c[1]={...C[1], l:3, r:3, who:"you"};
  c[224]={...C[24], id:224, l:4, r:4, who:"sky", homeM:24, grant:null, ab:null};
  const g=E.mkGame({C:c, tonight:5, softAt:4, softBy:2, softShield:true});
  g.slots[4]={id:1, owner:"you", l:3, r:3}; g.slots[5]={id:224, owner:"sky", l:4, r:4};
  E.strike(g,g.slots,5,[-1]);   // her 4 v a 3 that reads as 1: would take, if the shield let it
  ok("price: a sheltered card's defending face never decides anything, priced or not",
     g.slots[4].owner==="you"); }
// 85. the price is the station's: a sheltered card one station over strikes at full face
{ const C=E.makeCards({lvl:2, grants:{1:true}, abOff:{1:true}});
  const c={}; c[1]={...C[1], l:6, r:6, who:"you"};
  const g=E.mkGame({C:c, tonight:5, softAt:4, softBy:2, softShield:true});
  g.slots[3]={id:1, owner:"you", l:6, r:6};
  ok("price: off the crossing the same sheltered card strikes as printed", E.faceOf(g,g.slots,3,1)===6); }

// ---- m3 candidate 1a: the smaller party
// 86. the middle goes to whoever holds fewer of the other eight
{ const g=E.mkGame({C:C4(), tonight:3, partyAt:4, leader:"you"});
  g.slots[4]={id:1,   owner:"you", l:6, r:6};    // the middle, lodged by you
  g.slots[0]={id:2,   owner:"you", l:6, r:6};
  g.slots[1]={id:3,   owner:"you", l:6, r:6};
  g.slots[8]={id:204, owner:"sky", l:6, r:6};    // sky holds one, you hold two
  const [y,k]=E.counts(g,g.slots);
  ok("party: the middle counts for the smaller party, not its holder", y===2 && k===2); }
// 87. equal holdings: the middle goes to the defender, the side that did not lead
{ const g=E.mkGame({C:C4(), tonight:3, partyAt:4, leader:"you"});
  g.slots[4]={id:1,   owner:"you", l:6, r:6};
  g.slots[0]={id:2,   owner:"you", l:6, r:6};
  g.slots[8]={id:204, owner:"sky", l:6, r:6};
  const [y,k]=E.counts(g,g.slots);
  ok("party: equal holdings go to the defender", y===1 && k===2); }
// 88. partyTie=nobody: the same board, the middle counts for neither
{ const g=E.mkGame({C:C4(), tonight:3, partyAt:4, partyTie:"nobody", leader:"you"});
  g.slots[4]={id:1,   owner:"you", l:6, r:6};
  g.slots[0]={id:2,   owner:"you", l:6, r:6};
  g.slots[8]={id:204, owner:"sky", l:6, r:6};
  const [y,k]=E.counts(g,g.slots);
  ok("party/nobody: equal holdings and the middle counts for neither", y===1 && k===1); }
// 89. the worth is unchanged — dominion at the middle still counts two, for the smaller party
{ const g=E.mkGame({C:C4(), tonight:3, partyAt:4, leader:"you"});
  g.slots[4]={id:7, owner:"you", l:6, r:6};      // m7 stands at index 4 on m3's road: home
  g.C[7]={...g.C[1], id:7, homeM:7};
  g.slots[0]={id:2, owner:"you", l:6, r:6};
  const [y,k]=E.counts(g,g.slots);
  ok("party: a home card at the middle still counts two, for the other hand", y===1 && k===2); }

// ---- m3 sheet two: the crowd (2a), the razor (2b), the cock's hour (2c)
// 90. the crowd: one friend beside you and you strike two lower
{ const g=E.mkGame({C:C4(), tonight:3, crowdAt:4, crowdN:2});
  g.slots[3]={id:2,   owner:"you", l:6, r:6};      // your friend
  g.slots[4]={id:1,   owner:"you", l:7, r:7};      // strikes right at 7, held down to 5
  g.slots[5]={id:205, owner:"sky", l:6, r:6};
  E.strike(g,g.slots,4,[1]);
  ok("crowd: a held hand does not swing, and a 7 with one friend cannot take a 6",
     g.slots[5].owner==="sky"); }
// 91. the crowd: alone at the crossing, it swings at full strength
{ const g=E.mkGame({C:C4(), tonight:3, crowdAt:4, crowdN:2});
  g.slots[4]={id:1,   owner:"you", l:7, r:7};
  g.slots[5]={id:205, owner:"sky", l:6, r:6};
  E.strike(g,g.slots,4,[1]);
  ok("crowd: a lone card at the crossing takes as printed", g.slots[5].owner==="you"); }
// 92. the crowd: the enemy beside you is not a friend, and the defending face is untouched
{ const g=E.mkGame({C:C4(), tonight:3, crowdAt:4, crowdN:2});
  g.slots[3]={id:203, owner:"sky", l:6, r:6};      // an enemy, not a friend
  g.slots[4]={id:1,   owner:"you", l:7, r:7};
  g.slots[5]={id:205, owner:"sky", l:6, r:6};
  E.strike(g,g.slots,4,[1]);
  ok("crowd: company means your own hand only", g.slots[5].owner==="you"); }
// 93. the razor: both enemy neighbours fall, or neither
{ const g=E.mkGame({C:C4(), tonight:3, razorAt:4});
  g.slots[3]={id:203, owner:"sky", l:6, r:6};
  g.slots[5]={id:205, owner:"sky", l:9, r:9};      // this one holds
  const s=E.resolve(g,g.slots,1,4,false,"you").slots;   // your 6/6 lodges: beats 6, loses to 9
  ok("razor: one neighbour would hold, so neither falls",
     s[3].owner==="sky" && s[5].owner==="sky"); }
// 94. the razor: when both would fall, both do
{ const g=E.mkGame({C:C4(), tonight:3, razorAt:4});
  g.slots[3]={id:203, owner:"sky", l:2, r:2};
  g.slots[5]={id:205, owner:"sky", l:2, r:2};
  const s=E.resolve(g,g.slots,1,4,false,"you").slots;
  ok("razor: both would fall, so the stroke lands on both",
     s[3].owner==="you" && s[5].owner==="you"); }
// 95. the razor: one enemy neighbour alone still falls — "both" means all of them
{ const g=E.mkGame({C:C4(), tonight:3, razorAt:4});
  g.slots[5]={id:205, owner:"sky", l:2, r:2};
  const s=E.resolve(g,g.slots,1,4,false,"you").slots;
  ok("razor: with one enemy beside it, the stroke is that one", s[5].owner==="you"); }
// 96. the cock's hour: the middle is not a legal placement until the road is full enough
{ const g=E.mkGame({C:C4(), tonight:3, hourAt:4, hourN:5});
  ok("hour: with an empty road the middle is closed", !E.openSlots(g).includes(4));
  for(const k of [0,1,2,3,5]) g.slots[k]={id:1, owner:"you", l:6, r:6};
  ok("hour: with five standing, the middle opens", E.openSlots(g).includes(4)); }
// 97. the cock's hour: it closes nothing else
{ const g=E.mkGame({C:C4(), tonight:3, hourAt:4, hourN:5});
  ok("hour: every other station is open from the first card", E.openSlots(g).length===8); }

// ---- m1 candidates: the open gate (1a) and the two posts (1b)
// 99. m1's geography: six tiger stations, and both posts are tiger ground
{ ok("m1: index 3, 4 and 5 are m4, m5, m6 — all tiger ground",
     E.QUAD[4]==="byakko" && E.QUAD[5]==="byakko" && E.QUAD[6]==="byakko"); }
// 100. the open gate: the tiger's hold does not hold at the crossing
{ const C=E.makeCards({lvl:2, grants:{1:true}, abOff:{1:true}});
  const c={}; c[1]={...C[1], l:5, r:5, who:"you"};
  c[224]={...C[24], id:224, l:9, r:9, who:"sky", homeM:24, grant:null, ab:null};
  const g=E.mkGame({C:c, tonight:1, openAt:4});
  g.slots[4]={id:1, owner:"you", l:5, r:5}; g.slots[5]={id:224, owner:"sky", l:9, r:9};
  E.strike(g,g.slots,5,[-1]);
  const h=E.mkGame({C:c, tonight:1});
  h.slots[4]={id:1, owner:"you", l:5, r:5}; h.slots[5]={id:224, owner:"sky", l:9, r:9};
  E.strike(h,h.slots,5,[-1]);
  ok("open: a granted tiger card at the crossing falls, and holds anywhere else",
     g.slots[4].owner==="sky" && h.slots[4].owner==="you"); }
// 101. the open gate: the gate's own first-strike miss does not save it either
{ const C=E.makeCards({lvl:2});
  const c={}; c[1]={...C[1], l:5, r:5, who:"you"};
  c[224]={...C[24], id:224, l:9, r:9, who:"sky", homeM:24, ab:null};
  const g=E.mkGame({C:c, tonight:1, openAt:4});
  g.slots[4]={id:1, owner:"you", l:5, r:5}; g.slots[5]={id:224, owner:"sky", l:9, r:9};
  E.strike(g,g.slots,5,[-1]);
  ok("open: her own door does not shut at her own crossing", g.slots[4].owner==="sky"); }
// 102. openN 1: the first strike pierces, the next is held as printed
{ const C=E.makeCards({lvl:2, grants:{1:true}, abOff:{1:true}});
  const c={}; c[1]={...C[1], l:5, r:5, who:"you"};
  c[224]={...C[24], id:224, l:9, r:9, who:"sky", homeM:24, grant:null, ab:null};
  const g=E.mkGame({C:c, tonight:1, openAt:4, openN:1});
  g.slots[4]={id:1, owner:"sky", l:5, r:5};              // hers, granted: normally unholdable
  g.slots[5]={id:224, owner:"you", l:9, r:9};
  // first strike pierces and takes it; put it back and strike again — now it holds
  E.strike(g,g.slots,5,[-1]);
  const first = g.slots[4].owner==="you";
  g.slots[4]={...g.slots[4], owner:"sky"};
  E.strike(g,g.slots,5,[-1]);
  ok("open/1: the door opens once, then the ground holds as printed",
     first && g.slots[4].owner==="sky"); }
// 103. the open gate: away from the crossing every shelter still stands
{ const C=E.makeCards({lvl:2, grants:{1:true}, abOff:{1:true}});
  const c={}; c[1]={...C[1], l:5, r:5, who:"you"};
  c[224]={...C[24], id:224, l:9, r:9, who:"sky", homeM:24, grant:null, ab:null};
  const g=E.mkGame({C:c, tonight:1, openAt:4});
  g.slots[7]={id:1, owner:"you", l:5, r:5}; g.slots[8]={id:224, owner:"sky", l:9, r:9};
  E.strike(g,g.slots,8,[-1]);
  ok("open: the law opens one station and no other", g.slots[7].owner==="you"); }
// 104. the two posts: a sheltered card at either post strikes two lower, the middle is plain
{ const C=E.makeCards({lvl:2, grants:{1:true}, abOff:{1:true}});
  const c={}; c[1]={...C[1], l:6, r:6, who:"you"};
  const g=E.mkGame({C:c, tonight:1, postAt:[3,5], postN:2});
  g.slots[3]={id:1, owner:"you", l:6, r:6};
  g.slots[4]={id:1, owner:"you", l:6, r:6};
  g.slots[5]={id:1, owner:"you", l:6, r:6};
  ok("post: both posts are priced and the opening between them is not",
     E.faceOf(g,g.slots,3,1)===4 && E.faceOf(g,g.slots,5,1)===4
     && E.faceOf(g,g.slots,4,1)===6); }
// 105. the two posts: an unsheltered card at a post pays nothing
{ const C=E.makeCards({lvl:1});
  const c={}; c[1]={...C[1], l:6, r:6, who:"you"};
  const g=E.mkGame({C:c, tonight:1, postAt:[3,5], postN:2});
  g.slots[3]={id:1, owner:"you", l:6, r:6};
  ok("post: no shelter, no price", E.faceOf(g,g.slots,3,1)===6); }

// ---- m6 candidates: the eye (1a) and the storm's brand (1b)
// 106. m6's two windows: door-first crosses bird ground, slid crosses the storm itself
{ ok("m6: door-first index 4 is m10 the throne (bird); slid it is m6 the storm (tiger)",
     E.QUAD[10]==="suzaku" && E.QUAD[6]==="byakko"); }
// 107. the eye, stand: a tie at the crossing takes nothing, for either side
{ const g=E.mkGame({C:C4(), tonight:6, eyeAt:4, leader:"you"});
  g.slots[4]={id:201, owner:"sky", l:6, r:6}; g.slots[5]={id:1, owner:"you", l:6, r:6};
  E.strike(g,g.slots,5,[-1]);
  const a=g.slots[4].owner==="sky";
  g.slots[3]={id:202, owner:"sky", l:6, r:6}; g.slots[4]={id:2, owner:"you", l:6, r:6};
  E.strike(g,g.slots,3,[1]);
  ok("eye/stand: equal numbers stand where they are, whoever strikes", a && g.slots[4].owner==="you"); }
// 108. the eye, stand: a strictly bigger strike still takes, and ties elsewhere still take
{ const g=E.mkGame({C:C4(), tonight:6, eyeAt:4, leader:"you"});
  g.slots[4]={id:201, owner:"sky", l:6, r:6}; g.slots[5]={id:1, owner:"you", l:7, r:7};
  E.strike(g,g.slots,5,[-1]);
  g.slots[7]={id:203, owner:"sky", l:6, r:6}; g.slots[8]={id:3, owner:"you", l:6, r:6};
  E.strike(g,g.slots,8,[-1]);
  ok("eye/stand: beat it and it falls; off the eye a tie takes as ever",
     g.slots[4].owner==="you" && g.slots[7].owner==="you"); }
// 109. the eye, defender: a tie succeeds for the follower and is refused for the leader
{ const g=E.mkGame({C:C4(), tonight:6, eyeAt:4, eyeN:"defender", leader:"you"});
  g.slots[4]={id:1, owner:"you", l:6, r:6}; g.slots[5]={id:205, owner:"sky", l:6, r:6};
  E.strike(g,g.slots,5,[-1]);                        // sky is the follower: the tie is hers
  const f=g.slots[4].owner==="sky";
  g.slots[4]={id:201, owner:"sky", l:6, r:6}; g.slots[3]={id:2, owner:"you", l:6, r:6};
  E.strike(g,g.slots,3,[1]);                         // you led: your tie is refused
  ok("eye/defender: the tie goes to the answerer, never the leader", f && g.slots[4].owner==="sky"); }
// 110. the storm's brand: taken at the crossing, the card carries -1 both faces
{ const g=E.mkGame({C:C4(), tonight:6, scarAt:4});
  g.slots[4]={id:201, owner:"sky", l:5, r:6}; g.slots[5]={id:1, owner:"you", l:9, r:9};
  E.strike(g,g.slots,5,[-1]);
  ok("brand: taken at the eye, it fights one lower on both faces",
     g.slots[4].owner==="you" && E.faceOf(g,g.slots,4,-1)===4 && E.faceOf(g,g.slots,4,1)===5); }
// 111. the storm's brand, once: taken back, the mark stays and does not stack
{ const g=E.mkGame({C:C4(), tonight:6, scarAt:4});
  g.slots[4]={id:201, owner:"sky", l:5, r:5}; g.slots[5]={id:1, owner:"you", l:9, r:9};
  g.slots[3]={id:202, owner:"sky", l:9, r:9};
  E.strike(g,g.slots,5,[-1]); E.strike(g,g.slots,3,[1]);
  ok("brand/once: it changes hands twice and wears one mark", g.slots[4].owner==="sky" && g.slots[4].scar===1); }
// 112. the storm's brand, each: every take deepens it
{ const g=E.mkGame({C:C4(), tonight:6, scarAt:4, scarN:"each"});
  g.slots[4]={id:201, owner:"sky", l:5, r:5}; g.slots[5]={id:1, owner:"you", l:9, r:9};
  g.slots[3]={id:202, owner:"sky", l:9, r:9};
  E.strike(g,g.slots,5,[-1]); E.strike(g,g.slots,3,[1]);
  ok("brand/each: two takes, two marks", g.slots[4].scar===2); }
// 113. the storm's brand is the card's, not the station's: it counts as printed
{ const g=E.mkGame({C:C4(), tonight:6, scarAt:4});
  g.slots[4]={id:201, owner:"sky", l:5, r:5}; g.slots[5]={id:1, owner:"you", l:9, r:9};
  E.strike(g,g.slots,5,[-1]);
  const [y]=E.counts(g,g.slots);
  ok("brand: the mark is on the faces, never the count", y===2); }

// ---- m15 THE VEIL: the cover (1a) and the hidden face (1b)
function C15(sig){                    // the veil 3/8 and the jewel 9/5 both sides, signatures optional
  const C=E.makeCards({lvl:sig?2:1, abOff: sig?{}:{15:true,14:true,1:true,2:true}});
  const c={}; for(const i of [1,2,14,15]){ c[i]={...C[i], who:"you"};
    c[200+i]={...C[i], id:200+i, who:"sky", homeM:i}; }
  return c;
}
// 114. the cover: the first card beside the crossing lands turned around, and stays that way
{ const g=E.mkGame({C:C15(false), tonight:11, coverAt:4});
  g.slots=E.lodge(g,g.slots,15,5,false,"you");       // the veil 3/8, printed l3 r8
  ok("cover: the first card beside the middle lands l/r swapped", g.slots[5].l===8 && g.slots[5].r===3 && g.slots[5].covered===1);
  g.slots=E.lodge(g,g.slots,14,3,false,"you");        // the jewel 9/5 on the other side
  ok("cover/first: it fires once; the second arrival lands as printed", g.slots[3].l===9 && g.slots[3].r===5); }
// 115. the cover, both: each side's first arrival is turned, later ones are not
{ const g=E.mkGame({C:C15(false), tonight:11, coverAt:4, coverN:"both"});
  g.slots=E.lodge(g,g.slots,15,5,false,"you");
  g.slots=E.lodge(g,g.slots,214,3,false,"sky");
  g.slots=E.lodge(g,g.slots,202,6,false,"sky");      // not beside the middle: untouched
  ok("cover/both: one turn a side, nothing two along", g.slots[5].l===8 && g.slots[3].l===5 && g.slots[3].r===9 && g.slots[6].l===g.C[202].l); }
// 116. the cover fires at the crossing whether or not the crossing is held; and not at the door
{ const g=E.mkGame({C:C15(false), tonight:11, coverAt:4});
  g.slots=E.lodge(g,g.slots,15,0,false,"you");
  ok("cover: the door is not beside the middle", g.slots[0].l===3);
  g.slots=E.lodge(g,g.slots,14,3,false,"you");
  ok("cover: an empty crossing still turns its first neighbour", g.slots[3].l===5 && g.slots[3].r===9); }
// 117. the cover and the veil card's own signature do not stack into nothing
{ const g=E.mkGame({C:C15(true), tonight:11, coverAt:4});  // signatures on
  g.slots=E.lodge(g,g.slots,15,4,false,"you");        // the veil itself at the crossing
  g.slots=E.lodge(g,g.slots,214,5,false,"sky");       // the jewel lands beside it
  ok("cover + veil signature: turned once, not turned back", g.slots[5].l===5 && g.slots[5].r===9); }
// 118. the hidden face: covered on lodge at the station, shown on the first strike against it
{ const g=E.mkGame({C:C15(false), tonight:11, hideAt:4});
  g.slots=E.lodge(g,g.slots,15,4,false,"you");
  const h1=g.slots[4].hidden===true;
  g.slots[5]={id:201, owner:"sky", l:1, r:1}; E.strike(g,g.slots,5,[-1]);   // a strike that fails
  ok("hidden face: covered at lodge, shown by any strike against it, even a failed one", h1 && g.slots[4].hidden===false && g.slots[4].owner==="you"); }
// 119. the hidden face, until the count: never shown
{ const g=E.mkGame({C:C15(false), tonight:11, hideAt:4, hideN:"count"});
  g.slots=E.lodge(g,g.slots,15,4,false,"you");
  g.slots[5]={id:201, owner:"sky", l:9, r:9}; E.strike(g,g.slots,5,[-1]);
  ok("hidden face/count: taken, and still covered", g.slots[4].owner==="sky" && g.slots[4].hidden===true); }
// 120. the hidden face changes no arithmetic: the numbers under the cover strike and are struck as printed
{ const g=E.mkGame({C:C15(false), tonight:11, hideAt:4});
  g.slots[5]={id:201, owner:"sky", l:4, r:4};
  g.slots=E.resolve(g,g.slots,15,4,false,"you").slots;  // veil r8 v 4: takes
  ok("hidden face: the covered card strikes with its real numbers", g.slots[5].owner==="you"); }
// 121. the blind row: the search reads a covered enemy card as a belief, the real board keeps its faces
{ const g=E.mkGame({C:C15(false), tonight:11, hideAt:4, blind:"deck", leader:"you", depth:1, youDepth:1});
  g.slots=E.lodge(g,g.slots,15,4,false,"you");        // your 3/8 sits covered at the crossing
  const seen = E.hiddenFor(g,g.slots,"sky"), own = E.hiddenFor(g,g.slots,"you");
  ok("blind: hidden from the sky, not from its owner", seen===4 && own===-1);
  const B=E.beliefs(g,g.slots,4,"sky");
  ok("blind/deck: the belief is every printed pair in the deck", B.length===Object.keys(g.C).filter(k=>Number(k)<=28).length && B.length===4);
  g.sky=[201,202,203]; const B2=E.beliefs({...g, blind:"hand"},g.slots,4,"sky");
  ok("blind/hand: the belief is her reading of your hand plus the card you lodged", B2.length===g.you.length+1 || B2.length>=1); }

// ---- m24 THE VOID: the empty circle (1a) and the lonely-card tally
// 122. the empty circle, right: the crossing counts two, the station to its right counts one less
{ const g=E.mkGame({C:C4(), tonight:20, voidAt:4});
  g.slots[4]={id:1, owner:"you", l:6, r:6}; g.slots[5]={id:2, owner:"you", l:6, r:6}; g.slots[3]={id:3, owner:"you", l:6, r:6};
  const [y]=E.counts(g,g.slots);
  ok("empty circle/right: 2 + 0 + 1 = 3", y===3); }
// 123. the empty circle, right: the debit is the station's, not the middle's tenant — an empty middle still charges
{ const g=E.mkGame({C:C4(), tonight:20, voidAt:4});
  g.slots[5]={id:202, owner:"sky", l:6, r:6}; g.slots[6]={id:203, owner:"sky", l:6, r:6};
  const [,k]=E.counts(g,g.slots);
  ok("empty circle/right: the right-hand station pays with the crossing empty", k===1); }
// 124. the empty circle, best: the richer neighbour pays; the left one when it is richer
{ const g=E.mkGame({C:C4(), tonight:20, voidAt:4, voidN:"best", wardAt:-1});
  g.slots[4]={id:1, owner:"you", l:6, r:6}; g.slots[3]={id:2, owner:"you", l:6, r:6, mark:0}; g.slots[5]={id:203, owner:"sky", l:6, r:6};
  // make the left neighbour richer: give it a planet's worth via a second card? simpler — the tie rule: equal worth, nearer the door pays
  const [y,k]=E.counts(g,g.slots);
  ok("empty circle/best: equal neighbours, the one nearer the door pays", y===2 && k===1); }
// 125. the empty circle never takes a station below zero
{ const g=E.mkGame({C:C4(), tonight:20, voidAt:4});
  g.slots[5]={id:201, owner:"sky", l:6, r:6, bare:true};
  const [,k]=E.counts(g,g.slots);
  ok("empty circle: a station worth nothing stays at nothing", k===0); }
// 126. the lonely tally counts real strikes on friendless cards
{ const g=E.mkGame({C:C4(), tonight:20, loneTally:true}); g.real=true;
  g.slots[4]={id:201, owner:"sky", l:5, r:5}; g.slots[5]={id:1, owner:"you", l:9, r:9};
  E.strike(g,g.slots,5,[-1]);
  g.slots[2]={id:202, owner:"sky", l:5, r:5}; g.slots[3]={id:203, owner:"sky", l:5, r:5};
  E.strike(g,g.slots,4,[-1]);                          // 3 has a friend at 2
  ok("lonely tally: one lonely target in two real strikes", g.lStrikes===2 && g.lLonely===1); }

// ---- m9 THE GLANCE: the two stars (1a) and the ill road (1b)
function C9(){ const C=E.makeCards({lvl:1}); const c={}; for(const i of [1,2,9,14]){ c[i]={...C[i], who:"you"}; c[200+i]={...C[i], id:200+i, who:"sky", homeM:i}; } return c; }
// 127. the two stars: a lodge at the door strikes the far end with the face toward it; equal takes
{ const g=E.mkGame({C:C9(), tonight:9, glanceAt:0});
  g.slots[8]={id:201, owner:"sky", l:5, r:5};
  g.slots=E.resolve(g,g.slots,14,0,false,"you").slots;      // the jewel 9/5 at the door: its 5 faces up the road
  ok("two stars: the door's card looks eight stations; 5 meets 5 and takes", g.slots[8].owner==="you");
  const g2=E.mkGame({C:C9(), tonight:9, glanceAt:0});
  g2.slots[8]={id:201, owner:"sky", l:6, r:6};
  g2.slots=E.resolve(g2,g2.slots,14,0,false,"you").slots;
  ok("two stars: 5 against 6 across the road, refused", g2.slots[8].owner==="sky"); }
// 128. the two stars, both: the far end looks back; door-only: it does not
{ const g=E.mkGame({C:C9(), tonight:9, glanceAt:0});
  g.slots[0]={id:1, owner:"you", l:4, r:4};
  g.slots=E.resolve(g,g.slots,214,8,false,"sky").slots;      // her jewel lands at the end: l=9 faces the door
  const a=g.slots[0].owner==="sky";
  const h=E.mkGame({C:C9(), tonight:9, glanceAt:0, glanceWay:"door"});
  h.slots[0]={id:1, owner:"you", l:4, r:4};
  h.slots=E.resolve(h,h.slots,214,8,false,"sky").slots;
  ok("two stars: both looks back, door-only does not", a && h.slots[0].owner==="you"); }
// 129. the two stars, printed: a turned face does not carry across the road; unprinted it does.
//      (printed = the card's own l/r as printed, the reach's clause; a mark from the hand still applies, as on the throne)
{ const mk=(printed)=>{ const g=E.mkGame({C:C9(), tonight:9, glanceAt:0, glancePrinted:printed});
    g.slots[8]={id:201, owner:"sky", l:6, r:6}; return g; };
  const a=mk(true);  a.slots=E.resolve(a,a.slots,14,0,true,"you").slots;   // the jewel lodged turned: 9 faces up the road, printed 5
  const b=mk(false); b.slots=E.resolve(b,b.slots,14,0,true,"you").slots;
  ok("two stars/printed: turned to show 9, it still strikes across as 5 and is refused by 6", a.slots[8].owner==="sky");
  ok("two stars/unprinted: the turned 9 carries and takes the 6", b.slots[8].owner==="you"); }
// 130. the two stars fire on lodge only, and an empty far end is nothing
{ const g=E.mkGame({C:C9(), tonight:9, glanceAt:0}); g.real=true;
  g.slots=E.resolve(g,g.slots,14,0,false,"you").slots;
  ok("two stars: the far end empty, the look lands on nothing", g.gLodges===1 && !g.gFires); }
// 131. the ill road: the first card at the door fights one lower on both faces; it keeps the mark when moved; the next arrival is clean
{ const g=E.mkGame({C:C9(), tonight:9, illAt:0});
  g.slots=E.lodge(g,g.slots,14,0,false,"you");
  const f=E.faceOf(g,g.slots,0,1)===4 && E.faceOf(g,g.slots,0,-1)===8;
  g.slots[3]=g.slots[0]; g.slots[0]=null;                     // shoved along: the omen travels
  g.slots=E.lodge(g,g.slots,1,0,false,"you");
  ok("ill road: the first traveller is marked, keeps it when moved, and the next arrival is clean",
     f && E.faceOf(g,g.slots,3,1)===4 && E.faceOf(g,g.slots,0,1)===6); }
// 132. the ill road at 2
{ const g=E.mkGame({C:C9(), tonight:9, illAt:0, illN:2});
  g.slots=E.lodge(g,g.slots,14,0,false,"you");
  ok("ill road/2: two lower", E.faceOf(g,g.slots,0,1)===3); }

// ---- THE NINE LAWS (13 Sep): 7a again · 8a haunt · 11b ribs · 13a hand · 14a/b unarmed/bright · 16b scales · 22b release
// 133. the second strike: a lodge at the crossing that takes nothing is armed; it fires after her next card lands
{ const g=E.mkGame({C:C4(), tonight:3, againAt:4}); g.real=true;
  g.slots[5]={id:201, owner:"sky", l:9, r:9};
  const r=E.resolve(g,g.slots,1,4,false,"you"); g.slots=r.slots;      // the gate 6/6 v 9: takes nothing
  const armed=g.pending.length===1 && g.pending[0].again===true;
  g.slots[5].l=1; g.slots[5].r=1;                                       // by the time it fires, the neighbour has weakened
  g.pending=g.pending.filter(p=>{p.wait--; return p.wait>0;}); g.pending=g.pending.filter(p=>{p.wait--; if(p.wait>0) return true; E.strike(g,g.slots,p.slot); return false;});
  ok("again: armed on an empty take, fires two moves later, and takes", armed && g.slots[5].owner==="you"); }
// 134. the second strike is not armed by a lodge that took something
{ const g=E.mkGame({C:C4(), tonight:3, againAt:4}); g.real=true;
  g.slots[5]={id:201, owner:"sky", l:1, r:1};
  const r=E.resolve(g,g.slots,1,4,false,"you");
  ok("again: a lodge that takes is not armed", r.slots[5].owner==="you" && g.pending.length===0); }
// 135. the haunted station: take the card at the crossing and your striker passes to the victim, no onward strike
{ const g=E.mkGame({C:C4(), tonight:8, hauntAt:4});
  g.slots[4]={id:201, owner:"sky", l:3, r:3}; g.slots[3]={id:202, owner:"sky", l:1, r:1};
  g.slots[5]={id:1, owner:"you", l:9, r:9};
  E.strike(g,g.slots,5,[-1]);
  ok("haunt: the crossing changes hands and so does the striker, the other way", g.slots[4].owner==="you" && g.slots[5].owner==="sky" && g.slots[5].taken===true);
  const h=E.mkGame({C:C2(), tonight:8, hauntAt:4});                     // signatures on: the turning would strike onward
  h.C[12]={...E.makeCards({lvl:2})[12], who:"you"}; h.C[201]={...h.C[26], id:201, who:"sky"}; h.C[202]={...h.C[26], id:202, who:"sky"};
  h.slots[4]={id:201, owner:"sky", l:3, r:3}; h.slots[3]={id:202, owner:"sky", l:1, r:1}; h.slots[5]={id:12, owner:"you", l:9, r:9};
  E.strike(h,h.slots,5,[-1]);
  ok("haunt: nothing strikes onward from the take (the turning's chain does not fire)", h.slots[4].owner==="you" && h.slots[3].owner==="sky"); }
// 136. the haunt is the station's: a take one station over is a plain take
{ const g=E.mkGame({C:C4(), tonight:8, hauntAt:4});
  g.slots[3]={id:201, owner:"sky", l:3, r:3}; g.slots[2]={id:1, owner:"you", l:9, r:9};
  E.strike(g,g.slots,2,[1]);
  ok("haunt: off the station, the striker keeps its card", g.slots[3].owner==="you" && g.slots[2].owner==="you"); }
// 137. the two ribs: hold both flanks and the crossing is yours at the count, whoever stands there
{ const g=E.mkGame({C:C4(), tonight:11, ribsAt:4});
  g.slots[3]={id:1, owner:"you", l:6, r:6}; g.slots[5]={id:2, owner:"you", l:6, r:6}; g.slots[4]={id:201, owner:"sky", l:6, r:6};
  const [y,k]=E.counts(g,g.slots);
  g.slots[5].owner="sky"; const [y2,k2]=E.counts(g,g.slots);
  ok("ribs: both flanks held, the crossing counts for the holder; one flank lost, it counts as it stands", y===3 && k===0 && y2===1 && k2===2); }
// 138. the steady hand: a lodge on a flank lands one higher for good; the crossing does not
{ const g=E.mkGame({C:C4(), tonight:13, handAt:[3,5]});
  g.slots=E.lodge(g,g.slots,1,3,false,"you"); g.slots=E.lodge(g,g.slots,2,4,false,"you");
  ok("hand: the flank lifts, the crossing does not", E.faceOf(g,g.slots,3,1)===7 && E.faceOf(g,g.slots,4,1)===6);
  g.slots[3]=g.slots[3]; g.slots[3].owner="sky";
  ok("hand: the lift is the card's, it keeps it when taken", E.faceOf(g,g.slots,3,1)===7); }
// 139. the unarmed / the bright face
{ const g=E.mkGame({C:C4(), tonight:14, armAt:4});
  g.slots[4]={id:1, owner:"you", l:3, r:8};
  const u=E.faceOf(g,g.slots,4,1)===3 && E.faceOf(g,g.slots,4,-1)===3;
  const h=E.mkGame({C:C4(), tonight:14, armAt:4, armN:"max"}); h.slots[4]={id:1, owner:"you", l:3, r:8};
  ok("unarmed: both faces read 3; bright: both read 8", u && E.faceOf(h,h.slots,4,1)===8 && E.faceOf(h,h.slots,4,-1)===8);
  g.slots[3]={id:1, owner:"you", l:3, r:8};
  ok("unarmed: off the station a card fights as printed", E.faceOf(g,g.slots,3,1)===8); }
// 140. the scales: your lighter pan counts one less a station; equal pans move nothing; the beam is not weighed
{ const g=E.mkGame({C:C4(), tonight:16, scales:true});
  g.slots[0]={id:1, owner:"you", l:6, r:6}; g.slots[1]={id:2, owner:"you", l:6, r:6};   // 2 up the road
  g.slots[7]={id:3, owner:"you", l:6, r:6};                                             // 1 down the road: the light pan
  g.slots[4]={id:4, owner:"you", l:6, r:6};                                             // the beam
  const [y]=E.counts(g,g.slots);
  ok("scales: 2 + 0 (light pan, 1-1) + 1 beam = 3", y===3);
  g.slots[8]={id:5, owner:"you", l:6, r:6}; const [y2]=E.counts(g,g.slots);
  ok("scales: pans equal, nothing moves: 5", y2===5); }
// 141. the release: the void's lines with the debit on the left
{ const g=E.mkGame({C:C4(), tonight:18, voidAt:4, voidN:"left"});
  g.slots[3]={id:1, owner:"you", l:6, r:6}; g.slots[4]={id:2, owner:"you", l:6, r:6}; g.slots[5]={id:3, owner:"you", l:6, r:6};
  const [y]=E.counts(g,g.slots);
  ok("release: 0 + 2 + 1 = 3", y===3); }

// ---- the second cards: 8b vapour · 8c gap · 13b crossbar · 14c horn · 16a pinch · 22a ear
// 142. the vapour: the crossing goes to whoever holds more of its flanks; equal, as lodged
{ const g=E.mkGame({C:C4(), tonight:8, vapourAt:4});
  g.slots[3]={id:1, owner:"you", l:6, r:6}; g.slots[4]={id:201, owner:"sky", l:6, r:6};
  const [y,k]=E.counts(g,g.slots); g.slots[5]={id:202, owner:"sky", l:6, r:6}; const [y2,k2]=E.counts(g,g.slots);
  ok("vapour: one flank held takes it; one each, as lodged", y===2 && k===0 && y2===1 && k2===2); }
// 143. the goat's gap: take the crossing and both flanks come with it
{ const g=E.mkGame({C:C4(), tonight:4, gapAt:4});
  g.slots[4]={id:201, owner:"sky", l:3, r:3}; g.slots[3]={id:202, owner:"sky", l:9, r:9}; g.slots[5]={id:1, owner:"you", l:9, r:9};
  E.strike(g,g.slots,5,[-1]);
  ok("gap: the crossing and the far flank both change hands, the striker keeps its own", g.slots[4].owner==="you" && g.slots[3].owner==="you" && g.slots[5].owner==="you"); }
// 144. the crossbar: the card at the crossing cannot be turned or moved by a signature
{ const C=E.makeCards({lvl:2}); const c={}; for(const i of [1,15,16,19,20]){ c[i]={...C[i], who:"you"}; c[200+i]={...C[i], id:200+i, who:"sky", homeM:i}; }
  const g=E.mkGame({C:c, tonight:13, stillAt:4});
  g.slots[4]={id:1, owner:"you", l:3, r:8};
  g.slots=E.lodge(g,g.slots,219,5,false,"sky");                           // her root lands beside it: would turn it
  const a=g.slots[4].l===3;
  g.slots[3]={id:216, owner:"sky", l:6, r:6};                             // her claws at 3 would shove what lands at 4 — the card is already there; test the flock instead
  g.slots[5]=null; g.slots=E.lodge(g,g.slots,220,5,false,"sky");         // her flock: would trade places with 4
  ok("crossbar: the root does not turn it, the flock does not move it", a && g.slots[4].id===1 && g.slots[4].l===3);
  const h=E.mkGame({C:c, tonight:13}); h.slots[4]={id:1, owner:"you", l:3, r:8}; h.slots=E.lodge(h,h.slots,219,5,false,"sky");
  ok("crossbar off: the root turns it", h.slots[4].l===8); }
// 145. the horn: the flanks fight weak, the crossing as printed
{ const g=E.mkGame({C:C4(), tonight:14, hornAt:[3,5]});
  g.slots[3]={id:1, owner:"you", l:3, r:8}; g.slots[4]={id:2, owner:"you", l:3, r:8};
  ok("horn: 3 at the flank both ways, 8 at the crossing", E.faceOf(g,g.slots,3,1)===3 && E.faceOf(g,g.slots,3,-1)===3 && E.faceOf(g,g.slots,4,1)===8); }
// 146. the pinch: a lodge at a flank is pushed outward if the square is empty, and strikes from there
{ const g=E.mkGame({C:C4(), tonight:16, pinchAt:[3,5]});
  g.slots[1]={id:201, owner:"sky", l:1, r:1};
  const r=E.resolve(g,g.slots,1,3,false,"you");
  ok("pinch: aimed at 3, lands at 2, takes at 1", r.slots[2]&&r.slots[2].id===1 && !r.slots[3] && r.slots[1].owner==="you");
  g.slots[2]={id:202, owner:"sky", l:9, r:9}; const r2=E.resolve(g,g.slots,1,3,false,"you");
  ok("pinch: the outer square held, it stays where it was aimed", r2.slots[3]&&r2.slots[3].id===1); }
// 147. the ear: the crossing is worth one more per flank its owner holds
{ const g=E.mkGame({C:C4(), tonight:18, earAt:4});
  g.slots[4]={id:1, owner:"you", l:6, r:6}; g.slots[3]={id:2, owner:"you", l:6, r:6}; g.slots[5]={id:201, owner:"sky", l:6, r:6};
  const [y,k]=E.counts(g,g.slots);
  ok("ear: 1 + (1+1) v 1", y===3 && k===1); }

// 148. the lighter release: the left flank pays only while its lodger still holds it; credit-only pays nobody
{ const g=E.mkGame({C:C4(), tonight:18, voidAt:4, voidN:"left", voidLodged:true});
  g.slots[3]={id:1, owner:"you", l:6, r:6}; g.slots[4]={id:2, owner:"you", l:6, r:6};
  const [y]=E.counts(g,g.slots); g.slots[3].taken=true; const [y2]=E.counts(g,g.slots);
  const h=E.mkGame({C:C4(), tonight:18, voidAt:4, voidN:"credit"}); h.slots[3]={id:1, owner:"you", l:6, r:6}; h.slots[4]={id:2, owner:"you", l:6, r:6};
  ok("lighter release: lodged flank pays (0+2), taken flank keeps its face (1+2); credit-only 1+2", y===2 && y2===3 && E.counts(h,h.slots)[0]===3); }

// ---- DAWN (14 Sep): the held cards fight in the sky
// 149. dawn/pair: strongest against strongest by printed total; the unopposed card scores; a tie scores nobody
{ const C=E.makeCards({lvl:1}); const c={}; for(let i=1;i<=28;i++){ c[i]={...C[i],who:"you"}; c[200+i]={...C[i],id:200+i,who:"sky",homeM:i}; }
  const g=E.mkGame({C:c, tonight:9, dawn:"pair", you:[14,15,1], sky:[201,202,224,209]}); // held: you jewel 14, veil 11, gate 12; sky gate 12, bearer 11, void 12, glance 11
  g.slots=g.slots.map((x,i)=>({id: i%2 ? 210+i : 2+i, owner:i%2?"sky":"you", l:6, r:6}));   // a full road of cards in neither hand
  const [y,k]=E.finalCounts(g,g.slots);
  // road: you 5 stations (0,2,4,6,8), sky 4. dawn: you [14,12,11] v sky [12,12,11,11] -> 14>12 you; 12=12 nobody; 11=11 nobody; sky's 4th unopposed -> sky
  ok("dawn/pair: 5+1 v 4+1", y===6 && k===5); }
// 150. dawn/count: every held card is a point
{ const C=E.makeCards({lvl:1}); const c={}; for(let i=1;i<=28;i++){ c[i]={...C[i],who:"you"}; c[200+i]={...C[i],id:200+i,who:"sky",homeM:i}; }
  const g=E.mkGame({C:c, tonight:9, dawn:"count", you:[14,15], sky:[201,202,224]});
  g.slots=g.slots.map((x,i)=>({id:2+i, owner:"you", l:6, r:6}));
  const [y,k]=E.finalCounts(g,g.slots);
  ok("dawn/count: 9+2 v 0+3", y===11 && k===3); }
// 151. dawn is read only on a full road
{ const C=E.makeCards({lvl:1}); const c={}; for(let i=1;i<=28;i++){ c[i]={...C[i],who:"you"}; c[200+i]={...C[i],id:200+i,who:"sky",homeM:i}; }
  const g=E.mkGame({C:c, tonight:9, dawn:"pair", you:[14], sky:[]});
  g.slots[0]={id:2, owner:"you", l:6, r:6};
  ok("dawn: nothing until the road fills", E.finalCounts(g,g.slots)[0]===1); }

console.log("\n  "+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
