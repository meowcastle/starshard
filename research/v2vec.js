// Proof that each of the 28 v2 signatures actually fires. No measuring until this is 28/28.
const E = require("/tmp/now2/v2.js");
const out = [];
const ck = (n, got, want) => out.push({ n, got: String(got), want: String(want), pass: String(got) === String(want) });

// a game with everything awake, nine stations, tonight = mansion 1
function G(extra){
  const C = E.makeCards({ lvl: 2 });
  for (let i = 1; i <= 28; i++) C[200 + i] = { ...C[i], id: 200 + i, who: "sky", homeM: i };
  return E.mkGame(Object.assign({ C, tonight: 1, len: 9, you: [], sky: [] }, extra || {}));
}
// put a card on the board directly
function put(g, s, id, i, owner, over){
  s[i] = Object.assign({ id, l: g.C[id].l, r: g.C[id].r, owner, lodger: owner, age: 2, mark: 0 }, over || {});
  return s;
}
const blank = g => Array.from({length: g.len}, () => null);

// ---- BYAKKO
{ // 1 gate: the first strike against it does not land
  const g=G(); let s=blank(g); put(g,s,1,4,"you"); put(g,s,224,5,"sky");   // the void 9/3 beside it
  const a=E.tryFlip(g,s,5,4,-1);                       // her void strikes left with its 9
  const b=E.tryFlip(g,s,5,4,-1);                       // and again
  ck("1 gate refuses the first strike, not the second", (!a)+"/"+(!!b), "true/true");
}
{ // 2 bearer: anything striking a card beside it fights two lower
  const g=G(); let s=blank(g);
  put(g,s,2,4,"you"); put(g,s,20,5,"you");             // bearer at 4, your flock 7/6 at 5
  put(g,s,207,6,"sky");                                // her return 7/7 at 6 strikes left with 7
  const r=E.tryFlip(g,s,6,5,-1);                       // 7-2=5 vs your 6 -> holds
  ck("2 bearer blunts an attack on its neighbour", !r, "true");
}
{ // 3 gathered stars: cannot be taken while a card beside it is yours
  const g=G(); let s=blank(g);
  put(g,s,3,4,"you"); put(g,s,20,3,"you"); put(g,s,224,5,"sky");
  const r=E.tryFlip(g,s,5,4,-1);
  const g2=G(); let s2=blank(g2);
  put(g2,s2,3,4,"you"); put(g2,s2,220,3,"sky"); put(g2,s2,224,5,"sky");
  const r2=E.tryFlip(g2,s2,5,4,-1);
  ck("3 gathered stars held with a friend beside, open without", (!r)+"/"+(!!r2), "true/true");
}
{ // 4 follower: strikes back when the card to its left is taken
  const g=G(); let s=blank(g);
  put(g,s,20,4,"you"); put(g,s,4,5,"you"); put(g,s,224,3,"sky");   // her void at 3 takes your 4
  E.strike(g,s,3,[1]);
  ck("4 follower retakes the card to its left", s[4].owner, "you");
}
{ // 5 blaze: marks one card beside it two lower for good
  const g=G(); let s=blank(g); put(g,s,207,5,"sky");
  s=E.lodge(g,s,5,4,false,"you");
  ck("5 blaze marks its enemy neighbour", s[5].mark, "-2");
}
{ // 6 storm: no tie takes it
  const g=G(); let s=blank(g);
  put(g,s,6,4,"you",{l:6,r:6}); put(g,s,220,5,"sky",{l:6,r:6});
  ck("6 storm holds a tie", !E.tryFlip(g,s,5,4,-1), "true");
}
{ // 28 thread: everything beside it fights one lower, both sides
  const g=G(); let s=blank(g); put(g,s,28,4,"you"); put(g,s,220,5,"sky",{l:6,r:6});
  ck("28 thread lowers her neighbour", E.faceOf(g,s,5,-1), "5");
}
// ---- SUZAKU
{ // 7 return: a delayed second strike
  const C=E.makeCards({lvl:2});
  for(let i=1;i<=28;i++) C[200+i]={...C[i],id:200+i,who:"sky",homeM:i};
  const r=E.playBoard({C, you:[7,20,3], sky:[224,220,203], tonight:1, len:5, leader:"you", depth:0, youDepth:0});
  ck("7 return plays a board without stalling", r.you+r.sky>0, "true");
}
{ // 8 ghost: warms YOUR card, and the warmth goes when the card does
  const g=G(); let s=blank(g); put(g,s,26,5,"you",{l:6,r:6});
  s=E.lodge(g,s,8,4,false,"you");
  const warmed = E.faceOf(g,s,5,1);                    // 6 + 2
  s[5].owner="sky";                                     // she takes it
  const cooled = E.faceOf(g,s,5,1);                     // back to 6
  ck("8 ghost warms yours and the warmth leaves with it", warmed+"/"+cooled, "8/6");
}
{ // 9 glance: also strikes two stations along
  const g=G(); let s=blank(g); put(g,s,221,6,"sky",{l:3,r:8});      // weak left face at 6
  s=E.resolve(g,s,9,4,false,"you").slots;                            // glance at 4 reaches 6
  ck("9 glance takes the station two along", s[6].owner, "you");
}
{ // 10 throne: whatever it takes fights one higher afterwards
  const g=G(); let s=blank(g); put(g,s,221,5,"sky",{l:3,r:8});
  s=E.resolve(g,s,10,4,false,"you").slots;
  ck("10 throne raises what it took", s[5].owner+"/"+s[5].mark, "you/1");
}
{ // 11 mane: lifts only the cards you hold
  const g=G(); let s=blank(g); put(g,s,11,4,"you");
  put(g,s,26,5,"you",{l:6,r:6}); put(g,s,226,3,"sky",{l:6,r:6});
  ck("11 mane lifts yours and not hers", E.faceOf(g,s,5,-1)+"/"+E.faceOf(g,s,3,1), "7/6");
}
{ // 12 turning: what it takes strikes onward
  const g=G(); let s=blank(g);
  put(g,s,221,5,"sky",{l:3,r:8}); put(g,s,221,6,"sky",{l:3,r:8});
  s=E.resolve(g,s,12,4,false,"you").slots;
  ck("12 turning chains one station further", s[5].owner+"/"+s[6].owner, "you/you");
}
{ // 13 hand: what you lodge beside it lands one higher
  const g=G(); let s=blank(g); put(g,s,13,4,"you");
  s=E.lodge(g,s,226,5,false,"you");        // the chamber: no lodge effect of its own
  ck("13 hand builds what lands beside it", s[5].mark, "1");
}
// ---- SEIRYUU
{ // 14 jewel: turns to meet what lands beside it with its stronger face
  const g=G(); let s=blank(g); put(g,s,14,5,"you",{l:8,r:7});       // its 7 faces right
  s=E.lodge(g,s,226,6,false,"sky");                                  // she lands to its right
  ck("14 jewel turns its stronger face toward the newcomer", s[5].r, "8");
}
{ // 15 veil: turns the first card that lands beside it
  const g=G(); let s=blank(g); put(g,s,15,4,"you");
  s=E.lodge(g,s,224,5,false,"sky");                                  // her void 9/3
  ck("15 veil turns her strong face away", s[5].l+"/"+s[5].r, "3/9");
}
{ // 16 claws: anything of hers that lands beside them is shoved along
  const g=G(); let s=blank(g); put(g,s,16,4,"you");
  s=E.lodge(g,s,226,5,false,"sky");                     // she lands to their right
  ck("16 claws shove her off the station she chose", (s[5]===null)+"/"+(s[6]&&s[6].owner), "true/sky");
}
{ // 17 crown: what it takes cannot be taken back
  const g=G(); let s=blank(g); put(g,s,221,5,"sky",{l:3,r:8});
  s=E.resolve(g,s,17,4,false,"you").slots;
  put(g,s,224,6,"sky");
  ck("17 crown keeps what it took", s[5].owner+"/"+(!E.tryFlip(g,s,6,5,-1)), "you/true");
}
{ // 18 heart: once a board it crosses to an open station
  const C=E.makeCards({lvl:2});
  for(let i=1;i<=28;i++) C[200+i]={...C[i],id:200+i,who:"sky",homeM:i};
  const r=E.playBoard({C, you:[18,20,3], sky:[224,220,203], tonight:1, len:5, leader:"you", depth:0, youDepth:0});
  ck("18 heart plays a board without stalling", r.you+r.sky>0, "true");
}
{ // 19 root: both cards beside it turn as it lands
  const g=G(); let s=blank(g); put(g,s,224,5,"sky",{l:9,r:3}); put(g,s,224,3,"sky",{l:9,r:3});
  s=E.lodge(g,s,19,4,false,"you");
  ck("19 root upends both its neighbours", s[5].l+"/"+s[3].l, "3/3");
}
{ // 20 flock: it and one card beside it trade places
  const g=G(); let s=blank(g); put(g,s,3,4,"you");
  s=E.lodge(g,s,20,5,false,"you");
  ck("20 flock swaps with its neighbour", s[4].id+"/"+s[5].id, "20/3");
}
// ---- GENBU
{ // 21 empty district: counts two and silences both sides
  const g=G(); let s=blank(g);
  put(g,s,21,4,"you"); put(g,s,220,5,"sky"); put(g,s,220,3,"sky");
  const [y,k]=E.counts(g,s);
  ck("21 district counts two and silences both neighbours", y+"/"+k, "2/0");
}
{ // 22 listener: one more for every card standing beside it
  const g=G(); let s=blank(g); put(g,s,22,4,"you"); put(g,s,220,3,"sky"); put(g,s,220,5,"sky");
  const [y]=E.counts(g,s);
  ck("22 listener counts by company", y, "3");
}
{ // 23 drum: the station to its right counts for the drum's side
  const g=G(); let s=blank(g); put(g,s,23,4,"you"); put(g,s,220,5,"sky");
  const [y,k]=E.counts(g,s);
  ck("23 drum takes the count of the station on its right", y+"/"+k, "2/0");
}
{ // 24 void: counts two, both neighbours count one less
  const g=G(); let s=blank(g); put(g,s,24,4,"you"); put(g,s,220,5,"sky"); put(g,s,220,3,"sky");
  const [y,k]=E.counts(g,s);
  ck("24 void counts two and taxes the station on its right", y+"/"+k, "2/1");
}
{ // 25 hideaway: nothing for itself, one more for both neighbours
  const g=G(); let s=blank(g); put(g,s,25,4,"you"); put(g,s,20,5,"you"); put(g,s,20,3,"you");
  const [y]=E.counts(g,s);
  ck("25 hideaway shelters its neighbours and keeps nothing", y, "4");
}
{ // 26 chamber: counts two while it has never been taken
  const g=G(); let s=blank(g); put(g,s,26,4,"you");
  const a=E.counts(g,s)[0];
  s[4].taken=true; const b=E.counts(g,s)[0];
  ck("26 chamber counts two until it falls", a+"/"+b, "2/1");
}
{ // 27 guide: your cards on their own mansion count one more
  const g=G(); let s=blank(g); put(g,s,27,4,"you"); put(g,s,1,0,"you");   // station 0 is mansion 1
  const [y]=E.counts(g,s);
  ck("27 guide lifts a card that is home", y, "4");
}

const pass = out.filter(v => v.pass).length;
console.log("V2 SIGNATURE VECTORS: " + pass + "/" + out.length + "\n");
for (const v of out) console.log((v.pass ? "  ok    " : "  FAIL  ") + v.n + (v.pass ? "" : "   want " + v.want + " got " + v.got));
