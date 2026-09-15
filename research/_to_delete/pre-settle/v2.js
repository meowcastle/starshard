// MANZIL v2 — a purpose-built engine for measuring the 26 Aug card redraft.
// Nine stations, ties flip, NO tie cascade, dominion +1. The 28 v2 signatures.
// Not the production engine. Built so each signature can be measured against +1/+1.

const POOL = [
  ["the gate",6,6,"gate"],["the bearer",5,6,"bearer"],["the gathered stars",7,7,"gathered"],
  ["the follower",8,7,"follower"],["the blaze",6,6,"blaze"],["the storm",6,8,"storm"],
  ["the return",7,7,"return"],["the ghost",7,6,"ghost"],["the glance",5,6,"glance"],
  ["the throne",7,9,"throne"],["the mane",6,6,"mane"],["the turning",7,6,"turning"],
  ["the hand",5,7,"hand"],["the jewel",9,5,"jewel"],["the veil",3,8,"veil"],
  ["the claws",7,6,"claws"],["the crown",7,6,"crown"],["the heart",8,7,"heart"],
  ["the root",7,7,"root"],["the flock",7,6,"flock"],["the empty district",3,8,"district"],
  ["the listener",7,5,"listener"],["the drum",5,7,"drum"],["the void",9,3,"void"],
  ["the hideaway",6,6,"hideaway"],["the chamber",7,6,"chamber"],["the guide",6,6,"guide"],
  ["the thread",6,6,"thread"],
];
const QUAD = {};
[["byakko",[1,2,3,4,5,6,28]],["suzaku",[7,8,9,10,11,12,13]],
 ["seiryuu",[14,15,16,17,18,19,20]],["genbu",[21,22,23,24,25,26,27]]]
 .forEach(([n,ids])=>ids.forEach(i=>QUAD[i]=n));

function makeCards(o){
  o = o || {};
  const C = {};
  POOL.forEach((p,idx)=>{
    const id = idx+1;
    const lvl = (o.levels && o.levels[id] != null) ? o.levels[id] : (o.lvl || 2);
    const bump = (o.bump && o.bump[id]) || 0;          // the +1/+1 branch (old ladder)
    const aL = (o.addL && o.addL[id]) || 0;           // the one-side branch (new ladder)
    const aR = (o.addR && o.addR[id]) || 0;
    const abOff = !!(o.abOff && o.abOff[id]);         // force the signature off, independent of bump
    C[id] = { id, name:p[0],
              l:p[1]+bump+aL, r:p[2]+bump+aR,        // no ceiling: five levels can reach 14
              ab: (lvl >= 2 && !abOff && !(o.bump && o.bump[id])) ? p[3] : null,
              lvl, who:"you", homeM:id, quad:QUAD[id],
              grant: (o.grants && o.grants[id]) ? QUAD[id] : null };
  });
  return C;
}
const nb = (g,i,d) => { const k=i+d; return (k>=0 && k<g.len) ? k : -1; };
const boardM = (g,i) => ((g.tonight - 1 + i) % 28) + 1;
const isHome = (g,id,i) => (g.C[id].homeM || id) === boardM(g,i);
const on = (g,c) => !!c && c.lvl >= 2 && !!c.ab;
const near = (g,s,i,ab,ownerSide) => {      // is an awake `ab` standing beside i on ownerSide?
  for (const d of [-1,1]) { const k=nb(g,i,d); if(k<0||!s[k]) continue;
    const c=g.C[s[k].id];
    if (c.ab===ab && on(g,c) && (ownerSide==null || s[k].owner===ownerSide)) return k; }
  return -1;
};

function mkGame(cfg){
  // THE BARE STATION (m21 candidate 1a): one station holds nothing all night. Seeded with a
  // sentinel so openSlots refuses it, counts skip it, and tryFlip cannot take it — which also
  // means it blocks adjacency, splitting the road into two segments.
  const _slots = Array.from({length:cfg.len||9},()=>null);
  let _C = cfg.C;
  if(cfg.bareAt!=null && cfg.bareAt>=0){
    _slots[cfg.bareAt]={id:-1, owner:null, bare:true, l:0, r:0};
    // an inert card entry so every g.C[slot.id] lookup in the engine resolves harmlessly.
    // Copied, never mutating the caller's deck.
    _C = Object.assign({}, cfg.C, {"-1":{id:-1, name:"bare ground", l:0, r:0, ab:null,
                                          grant:null, lvl:1, who:null, homeM:-1, quad:null}});
  }
  return { C:_C, tonight:cfg.tonight||1, len:cfg.len||9,
           slots:_slots,
           you:(cfg.you||[]).slice(), sky:(cfg.sky||[]).slice(),
           turn:cfg.leader||"you", depth:cfg.depth==null?8:cfg.depth,
           youDepth:cfg.youDepth==null?8:cfg.youDepth, pending:[], taps:{},
           suzakuFree: !!cfg.suzakuFree, suzakuAgain: !!cfg.suzakuAgain,
           suzakuReach: !!cfg.suzakuReach,
           suzakuTap: !(cfg.suzakuAgain||cfg.suzakuReach), genbuKeep: !!cfg.genbuKeep, genbuShell: !!cfg.genbuShell, genbuDead: !!cfg.genbuDead,
           suzakuGap: !!cfg.suzakuGap, suzakuBase: !!cfg.suzakuBase,
           tieDefender: !!cfg.tieDefender,
           first: cfg.leader||"you", drawTo: cfg.drawTo||"you",
           ropeAt: (cfg.ropeAt==null ? -1 : cfg.ropeAt),
           strikeBonus: cfg.strikeBonus||0, allBeat: !!cfg.allBeat,
           beatAt: (cfg.beatAt==null ? -1 : cfg.beatAt),
           wardAt: (cfg.wardAt==null ? -1 : cfg.wardAt),
           feedAt: (cfg.feedAt==null ? -1 : cfg.feedAt),
           tentAt: (cfg.tentAt==null ? -1 : cfg.tentAt),
           shellAt: (cfg.shellAt==null ? -1 : cfg.shellAt),
           gateAt: (cfg.gateAt==null ? -1 : cfg.gateAt),
           holdAt: (cfg.holdAt==null ? -1 : cfg.holdAt),
           reachAt: (cfg.reachAt==null ? -1 : cfg.reachAt),
           resonAt: (cfg.resonAt==null ? -1 : cfg.resonAt),
           bareAt: (cfg.bareAt==null ? -1 : cfg.bareAt),
           hushAt: (cfg.hushAt==null ? -1 : cfg.hushAt),
           turnAt: (cfg.turnAt==null ? -1 : cfg.turnAt),
           setsAt: (cfg.setsAt==null ? -1 : cfg.setsAt),
           weatherAt: (cfg.weatherAt==null ? -1 : cfg.weatherAt),
           plantAt: (cfg.plantAt==null ? -1 : cfg.plantAt), plantOnTake: !!cfg.plantOnTake,
           stingAt: (cfg.stingAt==null ? -1 : cfg.stingAt), stingFree: !!cfg.stingFree,
           stingOther: !!cfg.stingOther,
           guestAt: (cfg.guestAt==null ? -1 : cfg.guestAt), guestStrip: !!cfg.guestStrip,
           guestQuad: cfg.guestQuad||null, lonePlus: cfg.lonePlus||0,
           strangerAt: (cfg.strangerAt==null ? -1 : cfg.strangerAt),
           strangerPlus: cfg.strangerPlus||0,
           pourAt: (cfg.pourAt==null ? -1 : cfg.pourAt),
           carryAt: (cfg.carryAt==null ? -1 : cfg.carryAt),
           tollAt: (cfg.tollAt==null ? -1 : cfg.tollAt), tollBy: cfg.tollBy||0,
           answerAt: (cfg.answerAt==null ? -1 : cfg.answerAt),
           crowAt: (cfg.crowAt==null ? -1 : cfg.crowAt), crowBoth: !!cfg.crowBoth, crowN: cfg.crowN||"both",
           byakkoGround: !!cfg.byakkoGround, shieldNoGate: !!cfg.shieldNoGate,
           brandAt: (cfg.brandAt==null ? -1 : cfg.brandAt), brandN: cfg.brandN||2,
           brandOnTake: !!cfg.brandOnTake,
           softAt: (cfg.softAt==null ? -1 : cfg.softAt), softBy: cfg.softBy||2,
           markAt: (cfg.markAt==null ? -1 : cfg.markAt), softShield: !!cfg.softShield,
           partyAt: (cfg.partyAt==null ? -1 : cfg.partyAt), partyTie: cfg.partyTie||"defender",
           watchAt: (cfg.watchAt==null ? -1 : cfg.watchAt),
           crowdAt: (cfg.crowdAt==null ? -1 : cfg.crowdAt), crowdN: cfg.crowdN||2,
           razorAt: (cfg.razorAt==null ? -1 : cfg.razorAt),
           hourAt: (cfg.hourAt==null ? -1 : cfg.hourAt), hourN: cfg.hourN||5,
           openAt: (cfg.openAt==null ? -1 : cfg.openAt), openN: cfg.openN||"all",
           postAt: cfg.postAt||null, postN: cfg.postN||2,
           eyeAt: (cfg.eyeAt==null ? -1 : cfg.eyeAt), eyeN: cfg.eyeN||"stand",
           scarAt: (cfg.scarAt==null ? -1 : cfg.scarAt), scarN: cfg.scarN||"once",
           tallyAt: (cfg.tallyAt==null ? -1 : cfg.tallyAt),
           coverAt: (cfg.coverAt==null ? -1 : cfg.coverAt), coverN: cfg.coverN||"first",
           hideAt: (cfg.hideAt==null ? -1 : cfg.hideAt), hideN: cfg.hideN||"struck",
           blind: cfg.blind||null,
           voidAt: (cfg.voidAt==null ? -1 : cfg.voidAt), voidN: cfg.voidN||"right", voidLodged: !!cfg.voidLodged,
           loneTally: !!cfg.loneTally,
           glanceAt: (cfg.glanceAt==null ? -1 : cfg.glanceAt), glanceWay: cfg.glanceWay||"both",
           glancePrinted: (cfg.glancePrinted==null ? true : !!cfg.glancePrinted),
           illAt: (cfg.illAt==null ? -1 : cfg.illAt), illN: cfg.illN||1,
           againAt: (cfg.againAt==null ? -1 : cfg.againAt),
           hauntAt: (cfg.hauntAt==null ? -1 : cfg.hauntAt),
           ribsAt: (cfg.ribsAt==null ? -1 : cfg.ribsAt),
           handAt: cfg.handAt||null, handN: cfg.handN||1,
           armAt: (cfg.armAt==null ? -1 : cfg.armAt), armN: cfg.armN||"min",
           scales: !!cfg.scales,
           vapourAt: (cfg.vapourAt==null ? -1 : cfg.vapourAt),
           gapAt: (cfg.gapAt==null ? -1 : cfg.gapAt),
           hornAt: cfg.hornAt||null,
           pinchAt: cfg.pinchAt||null,
           stillAt: (cfg.stillAt==null ? -1 : cfg.stillAt),
           earAt: (cfg.earAt==null ? -1 : cfg.earAt),
           dawn: cfg.dawn||null, dawnTie: cfg.dawnTie||"nobody" };
}

// ---- FACES. permanent marks live on the slot; neighbour effects are read live.
function faceOf(g,s,i,dir){
  const t=s[i]; if(!t) return 0;
  // THE TURN (m12 candidate 1a): while the law station is held, its neighbour up the road reads
  // its faces the other way round. A swap: both numbers conserved, the comparison reversed.
  const turned = (g.turnAt>=0 && i===g.turnAt+1 && s[g.turnAt]);
  let v = turned ? (dir===1 ? t.l : t.r) : (dir===1 ? t.r : t.l);
  // THE UNARMED / THE BRIGHT FACE (m14 candidates 14a/14b): the card at the law station fights
  // with its weaker (armN "min") or stronger ("max") face whichever way it is struck or strikes.
  if(g.armAt>=0 && i===g.armAt) v = g.armN==="max" ? Math.max(t.l,t.r) : Math.min(t.l,t.r);
  // THE HORN (m14 candidate 14c): the flanks fight with their weaker face; the crossing as printed.
  if(g.hornAt && g.hornAt.includes(i)) v = Math.min(t.l,t.r);
  let d = t.mark || 0;                                  // blaze -2, throne +1, hand +1
  // THE STORM'S BRAND (m6 candidate 1b): a card taken at the law station carries a mark, both
  // faces, for the rest of the board, whoever holds it. Stored on the slot, cleared with the board.
  if(t.scar) d -= t.scar;
  if(t.ill) d -= t.ill;                                 // the ill road: the traveller's own mark
  // THE ONE-FOOTED (m26 candidate 1b): a card standing with no card of its own hand beside it
  // fights higher. Board-wide, both sides, but conditional on position rather than flat.
  if(g.lonePlus){
    let friend=false;
    for(const dd of [-1,1]){ const k=nb(g,i,dd);
      if(k>=0&&s[k]&&!s[k].bare&&s[k].owner===t.owner){ friend=true; break; } }
    if(!friend) d += g.lonePlus;
  }
  // THE SOFT GROUND (m5 candidate 1b): whatever stands at the law station fights lower, both
  // faces, for as long as it stands there. Positional, no stored flag: a card that leaves takes
  // nothing with it. Counts as printed — the count path never reads faceOf.
  // softShield (diagnostic): the softness applies only to a card that cannot be taken — the
  // soft ground's verb with the toll's condition. Aimed at the grant rather than at the leader.
  if(g.softAt>=0 && i===g.softAt && (!g.softShield || shielded(g,s,i))) d -= g.softBy;
  // THE TWO POSTS (m1 candidate 1b): the price's clause, standing at the pair of stations either
  // side of the middle instead of on it. Same condition, same floor, twice the ground.
  if(g.postAt && g.postAt.includes(i) && shielded(g,s,i)) d -= g.postN;
  for (const dd of [-1,1]) { const k=nb(g,i,dd); if(k<0||!s[k]) continue;
    const c=g.C[s[k].id]; if(!on(g,c)) continue;
    if (c.ab==="mane" && s[k].owner===t.owner) d += 1;  // 11 lifts only cards you hold
    if (c.ab==="thread") d -= 1;                        // 28 lowers everything beside it
  }
  return Math.max(1, v+d);
}


// THE GUEST OF THE HOUSE (m26 candidate 1a): a card at the law station belongs to the house's
// quarter while it stands there, whoever played it. guestStrip: it loses its own grant and gains
// nothing. guestBoth: it loses its own and takes the house's.
function grantAt(g,i,c){
  // an ungranted card is unaffected: standing in the room does not hand a level-1 card a grant.
  if(i!==g.guestAt || !c.grant) return c.grant;
  return g.guestStrip ? null : (g.guestQuad||null);
}

// DIAGNOSTIC (not a proposal): the byakko grant as shipped is "this card cannot be taken",
// unconditional and board-wide. byakkoGround reads the sentence the narrow way instead — the
// ground holds only where the ground is the tiger's — so the two can be compared.
function tigerHolds(g,i){ return !g.byakkoGround || QUAD[boardM(g,i)]==="byakko"; }

// THE SHIELD TEST (m2 candidate 1b). One predicate for "cannot be taken", read at count time,
// listing every ABSOLUTE denial in tryFlip — the ones that refuse a strike whatever the attacker's
// numbers. Conditional refusals are not shelter and are excluded: the storm's tie only refuses an
// equal strike, and denebola's shelter only refuses one side. So is simply having no enemy beside
// you — that is position, not protection, and paying for position is what sank the one-footed.
function shielded(g,s,i){
  const t=s[i]; if(!t||t.bare) return false;
  const tC=g.C[t.id];
  if(i===g.tentAt) return true;                                    // the shelter (unshipped)
  if(i===g.gateAt && !t.lawGateUsed) return true;                  // the gate's law, first strike
  if(i===g.plantAt && (!g.plantOnTake || t.taken)) return true;     // the planted station
  if(t.crowned) return true;                                       // 17 the crown, kept for good
  if(grantAt(g,i,tC)==="byakko" && tigerHolds(g,i)) return true;   // L3 the tiger holds its ground
  // shieldNoGate: the live _shielded leaves the gate to the strike path; measure the difference.
  if(!g.shieldNoGate && tC.ab==="gate" && on(g,tC) && !t.gateUsed) return true;  // 1 the gate
  if(i===g.holdAt || (tC.ab==="gathered" && on(g,tC))){            // 3 while a neighbour is yours
    for(const d of[-1,1]){ const k=nb(g,i,d);
      if(k>=0 && s[k] && s[k].owner===t.owner) return true; }
  }
  return false;
}

function tryFlip(g,s,ai,ti,dir){
  const a=s[ai], t=s[ti];
  if(!t||!a||t.owner===a.owner) return false;
  if(t.bare||a.bare) return false;                 // bare ground neither strikes nor is struck
  // THE HIDDEN FACE: any strike against the covered station shows its numbers to everyone.
  if(t.hidden && g.hideN==="struck") t.hidden=false;
  // THE OPEN GATE (m1 candidate 1a): at the law station nothing is held. Every shelter the shield
  // test knows about is skipped, and so is the gate card's own one-time miss. openN 1 pierces only
  // the first strike against the station; "all" pierces every strike. The storm's tie refusal is a
  // comparison rather than a shelter and is left standing.
  let pierce = false;
  if(g.openAt>=0 && ti===g.openAt){
    if(g.openN==="all") pierce = true;
    else if(!t.openUsed){ pierce = true; t.openUsed = true; }
  }
  // DENEBOLA SETS (m12 candidate 1c): the law station cannot be struck from up the road.
  if(ti===g.setsAt && ai>ti) return false;
  // THE PLANTED STATION (m19 candidate 1a): what lodges in the middle takes root and cannot be
  // taken. plantOnTake: it roots only after it has already changed hands once.
  if(!pierce && ti===g.plantAt && (!g.plantOnTake || t.taken)) return false;
  const aC=g.C[a.id], tC=g.C[t.id];
  let av=faceOf(g,s,ai,dir), tv=faceOf(g,s,ti,-dir);
  // THE HEART'S LAW (proposed, mansion 18): every strike lands strikeBonus harder, both sides.
  // Symmetric — a board where attack beats defense, not a stat buff for either player.
  av += (g.strikeBonus||0);
  // THE CROWD (m3 candidate 2a): a card striking from the law station strikes lower for each
  // friend standing beside it. The price's shape with the sisters' own condition — company rather
  // than shelter. Attacking face only; the defending face and the count are untouched.
  if(g.crowdAt>=0 && ai===g.crowdAt){
    let friends=0;
    for(const d of[-1,1]){ const k=nb(g,ai,d);
      if(k>=0 && s[k] && !s[k].bare && s[k].owner===a.owner) friends++; }
    if(friends) av = Math.max(1, av - g.crowdN*friends);
  }
  // 2 the bearer: anything striking a card beside it fights two lower
  if (near(g,s,ti,"bearer",t.owner) >= 0) av -= 2;
  const tie = av===tv;
  // tie-rate telemetry, real strikes only (playBoard re-runs the chosen move with g.real set)
  if(g.real && g.tallyAt>=0 && ti===g.tallyAt){ g.tStrikes=(g.tStrikes||0)+1; if(tie) g.tTies=(g.tTies||0)+1; }
  // lonely-card telemetry (m24): how often a real strike lands on a card with no friend beside it.
  // The rate the void's dormant "a lonely card cannot be taken" branch would fire at, if it lived.
  if(g.real && g.loneTally){
    let friend=false;
    for(const dd of[-1,1]){ const k=nb(g,ti,dd); if(k>=0&&s[k]&&!s[k].bare&&s[k].owner===t.owner){friend=true;break;} }
    g.lStrikes=(g.lStrikes||0)+1; if(!friend) g.lLonely=(g.lLonely||0)+1;
  }
  // THE EYE (m6 candidate 1a): at the law station a tie takes nothing — the storm card's own
  // clause handed to the ground. eyeN "stand": equal numbers stand where they are. eyeN
  // "defender": a tie goes to the side that did not lead the board, the draw rule's shape brought
  // down to one station — so a tie succeeds for the follower and is refused for the leader.
  if(tie && g.eyeAt>=0 && ti===g.eyeAt){
    if(g.eyeN==="stand") return false;
    if(g.eyeN==="defender" && a.owner===g.first) return false;
  }
  // TIE GOES TO THE DEFENDER: the attacker must be strictly bigger. Blunts the unanswerable
  // last placement, which is where the seat advantage lives.
  if(g.tieDefender){ if(!(av>tv)) return false; }
  else if(!(av>tv || tie)) return false;
  // ---- DENY
  // THE SHELTER (redesign candidate A): the tent station cannot be taken, either side.
  if (!pierce && ti===g.tentAt) return false;
  // THE GATE'S LAW (mansion 1): the first strike against her station does not land. A shield
  // that spends itself — flag lives on the slot, so evaluator branches stay clean.
  if (!pierce && ti===g.gateAt && !t.lawGateUsed){ t.lawGateUsed=true; return false; }
  // THE GATHERED STARS' LAW (mansion 3): her station cannot be taken while a station beside it
  // belongs to the same side. Conditional hold, broken by sequencing.
  if (!pierce && ti===g.holdAt){
    for(const d of[-1,1]){ const k=nb(g,ti,d);
      if(k>=0 && s[k] && s[k].owner===t.owner) return false; }
  }
  if (tC.ab==="storm" && on(g,tC) && tie) return false;                    // 6 no tie takes it
  if (!pierce && t.crowned) return false;                                            // 17 kept for good
  if (!pierce && grantAt(g,ti,tC)==="byakko" && tigerHolds(g,ti)) return false;              // L3 the tiger holds its ground
  if (!pierce && tC.ab==="gate" && on(g,tC) && !t.gateUsed){ t.gateUsed=true; return false; }  // 1 first strike
  if (!pierce && tC.ab==="gathered" && on(g,tC)){                                    // 3 while a neighbour is yours
    for(const d of[-1,1]){const k=nb(g,ti,d); if(k>=0&&s[k]&&s[k].owner===t.owner) return false;}
  }
  // ---- the flip
  const victim = t.owner;
  t.owner = a.owner;
  t.taken = true;                                                          // 26 the chamber
  // THE STORM'S BRAND (m6 candidate 1b): the card taken at the law station is marked, and keeps
  // the mark if it is taken back. scarN "once": the mark does not stack. "each": every take deepens it.
  if(g.scarAt>=0 && ti===g.scarAt) t.scar = g.scarN==="each" ? (t.scar||0)+1 : 1;
  // THE BRAND, take form: the station brands whoever takes it, from the card that was taken.
  if(g.brandAt>=0 && g.brandOnTake && ti===g.brandAt) a.mark=(a.mark||0)-g.brandN;
  if (aC.ab==="throne" && on(g,aC)) t.mark = (t.mark||0) + 1;              // 10 what it takes, +1
  if (aC.ab==="crown"  && on(g,aC)) t.crowned = true;                      // 17 cannot be taken back
  // 8 THE GHOST: take it and you trade places with it. The striker changes hands too.
  if (tC.ab==="ghost" && on(g,tC)) a.owner = victim;
  return { victim };
}

// THE RAZOR (m3 candidate 2b): a card LODGING at the law station takes every enemy standing
// beside it, or none of them. Each near strike is tested on its own copy; only if all of them
// would land does the stroke happen for real. Far strikes (the reach) are untouched.
function razorStrike(g,s,i){
  let targets=0, would=0;
  for(const dir of [-1,1]){
    const to=nb(g,i,dir); if(to<0||!s[to]||s[to].bare) continue;
    if(s[to].owner===s[i].owner) continue;
    targets++;
    const s2=s.map(z=>z?{...z}:z);
    if(tryFlip({...g, razorAt:-1}, s2, i, to, dir)) would++;
  }
  if(targets===0 || would<targets) return 0;
  return strike({...g, razorAt:-1}, s, i);
}

// one exchange from station i
function strike(g,s,i,dirs){
  let flips=0;
  for(const dir of (dirs||[-1,1])){
    const to=nb(g,i,dir); if(to<0||!s[to]) continue;
    const r=tryFlip(g,s,i,to,dir); if(!r) continue;
    flips++;
    // THE HAUNTED STATION (m8 candidate 8a): whoever takes the card at the law station loses the
    // card they took it with. The striker's slot passes to the victim, and nothing strikes onward
    // from this take (the crow's rule: the transaction is one thing). The ghost's own signature as
    // a place.
    // THE GOAT'S GAP (m8 candidate 8c): a take at the law station takes both its flanks with it.
    if(g.gapAt>=0 && to===g.gapAt){
      for(const d of[-1,1]){ const k=nb(g,to,d); if(k<0||!s[k]||s[k].bare||k===i) continue;
        if(s[k].owner!==s[to].owner){ s[k]={...s[k], owner:s[to].owner, taken:true}; flips++; } }
    }
    if(g.hauntAt>=0 && to===g.hauntAt && s[i]){
      s[i]={...s[i], owner:r.victim, taken:true};
      continue;
    }
    // THE STING (m19 candidate 1b): the law station strikes back at whoever takes it, once,
    // terminal — the taken card answers the taker. Two readings of the sentence, both measured:
    //   stingFree false — a normal strike back (only lands where the take was won on a tie)
    //   stingFree true  — an automatic counter-take, no comparison ("the take still costs")
    //   stingOther      — the third reading: it answers with the face it was NOT showing. Still a
    //                     comparison, but a real threat rather than a tie-detector.
    if(to===g.stingAt && r){
      if(g.stingFree){ const v=s[i]; if(v && v.owner!==r.victim){ s[i]={...v, owner:r.victim, taken:true}; flips++; } }
      else {
        // the card answers on behalf of the hand it just left, so hold its former owner for the
        // one strike and hand the station back to the taker afterwards.
        const held=s[to].owner, hl=s[to].l, hr=s[to].r;
        s[to]= g.stingOther ? {...s[to], owner:r.victim, l:hr, r:hl}
                            : {...s[to], owner:r.victim};
        const got=tryFlip(g,s,to,i,-dir);
        s[to]={...s[to], owner:held, l:hl, r:hr};
        if(got) flips++;
      }
    }
    // THE DRUM'S LAW (mansion 23, shipped unmeasured): a strike whose origin OR target is the
    // resonant station carries one further — the beat keeps travelling. Matches the live
    // `_reson()` implementation: chains from the victim, one extra hop, not recursive.
    if(g.resonAt>=0 && (i===g.resonAt || to===g.resonAt)){
      const rf=nb(g,to,dir);
      if(rf>=0 && s[rf] && tryFlip(g,s,to,rf,dir)) flips++;
    }
    // 12 the turning: what it takes strikes onward the same way
    const aC=g.C[s[i].id];
    if (aC.ab==="turning" && on(g,aC)){
      const far=nb(g,to,dir);
      if(far>=0&&s[far]&&tryFlip(g,s,to,far,dir)) flips++;
    }
    // 4 THE FOLLOWER: when a card standing beside it is taken, it strikes back. Either side now,
    // and every time rather than once a board.
    for(const fd of[-1,1]){
      const fk=nb(g,to,fd); if(fk<0||fk===i||!s[fk]||s[fk].owner!==r.victim) continue;
      const f=g.C[s[fk].id];
      if(f.ab==="follower"&&on(g,f)&&tryFlip(g,s,fk,to,-fd)) flips++;
    }
    // THE ANSWER (m4 candidate 1a): when the crossing is taken, the cards beside it that still
    // belong to its old owner strike the taker back at once, with their own faces. Deduped
    // against the follower's own signature above, so one card answers once.
    if(to===g.answerAt && r){
      for(const fd of [-1,1]){
        const fk=nb(g,to,fd); if(fk<0||!s[fk]||s[fk].owner!==r.victim) continue;
        const f=g.C[s[fk].id];
        if(f.ab==="follower"&&on(g,f)) continue;
        if(tryFlip(g,s,fk,to,-fd)) flips++;
      }
    }
  }
  // THE THRONE'S LAW (mansion 10): strikes from her station carry two stations, printed faces at
  // the far one. The Suzaku grant as a place — side-neutral, whatever stands there.
  if(g.reachAt>=0 && i===g.reachAt && s[i]){
    for(const dir of (dirs||[-1,1])){
      const to=i+2*dir; if(to<0||to>=g.len||!s[to]) continue;
      const raw=s[i].id>200 ? POOL[s[i].id-201] : POOL[s[i].id-1];
      let keep=null;
      if(raw){ keep={l:s[i].l,r:s[i].r}; s[i].l=raw[1]; s[i].r=raw[2]; }
      const ok2=tryFlip(g,s,i,to,dir);
      if(keep){ s[i].l=keep.l; s[i].r=keep.r; }
      if(ok2) flips++;
    }
  }
  // L3 SUZAKU, candidate "reach": a granted card's strikes carry two stations, not one.
  if(g.suzakuReach && s[i] && grantAt(g,i,g.C[s[i].id])==="suzaku" && s[i].owner===g.C[s[i].id].who){
    for(const dir of (dirs||[-1,1])){
      const to=i+2*dir; if(to<0||to>=g.len||!s[to]) continue;
      // GAP: it reaches across an empty station, not through a card. Geometry, not arithmetic.
      const mid=i+dir;
      if(g.suzakuGap && mid>=0 && mid<g.len && s[mid]) continue;
      // BASE: at two stations it fights with its printed number, so levelling a face does not
      // travel with the reach. Stops the grant multiplying the number branch.
      let keep=null;
      if(g.suzakuBase){
        const raw=s[i].id>200 ? POOL[s[i].id-201] : POOL[s[i].id-1];
        if(raw){ keep={l:s[i].l,r:s[i].r}; s[i].l=raw[1]; s[i].r=raw[2]; }
      }
      const ok=tryFlip(g,s,i,to,dir);
      if(keep){ s[i].l=keep.l; s[i].r=keep.r; }
      if(ok) flips++;
    }
  }
  return flips;
}

function lodge(g,sIn,id,i,rev,side){
  const c=g.C[id], own=side||c.who;
  const s=sIn.map(x=>x?{...x,age:(x.age||0)+1}:x);
  // THE BEARER'S CARRY (m2 candidate 1a): nothing rests at the crossing. A card aimed at the law
  // station is carried on to the next open ground down the road. If every station beyond is
  // occupied it stays where it was aimed — the bounded exception Design named.
  if(g.carryAt>=0 && i===g.carryAt){
    let j=i+1; while(j<g.len && s[j]) j++;
    if(j<g.len) i=j;
  }
  // THE PINCH (m16 candidate 16a): the claws' shove as a place. A card aimed at a flank station is
  // pushed one further from the crossing if that square is empty; it strikes from where it lands.
  if(g.pinchAt && g.pinchAt.includes(i)){
    const mid=Math.floor(g.len/2), j = i<mid ? i-1 : i+1;
    if(j>=0 && j<g.len && !s[j]) i=j;
  }
  s[i]={id, l:rev?c.r:c.l, r:rev?c.l:c.r, owner:own, lodger:own, age:0, mark:0};
  // 13 the hand: what you lodge beside it lands one higher, for good
  const h=near(g,s,i,"hand",own); if(h>=0) s[i].mark+=1;
  // THE STEADY HAND (m13 candidate 13a): the hand's signature as a place. Whatever lodges at a
  // flank station lands handN higher on both faces, for good. Deduped against the hand card's own
  // lift so a card beside an awake hand on the flank is lifted once.
  if(g.handAt && g.handAt.includes(i) && h<0) s[i].mark+=g.handN;
  // 5 the blaze: mark one card beside it, two lower, permanently
  if(c.ab==="blaze"&&on(g,c)){ for(const d of[-1,1]){const k=nb(g,i,d);
    if(k>=0&&s[k]&&s[k].owner!==own){ s[k]={...s[k],mark:(s[k].mark||0)-2}; break; } } }
  // THE BRAND (m5 candidate 1a, lodge form): whatever lodges at the law station marks the enemy
  // card worth most beside it lower, for the rest of the board. "Worth most" is the higher face
  // FACING the crossing; ties go to the station nearer the door. Deduped against the blaze's own
  // signature: an awake blaze lodging here has already branded, and brands once.
  if(g.brandAt>=0 && !g.brandOnTake && i===g.brandAt && !(c.ab==="blaze"&&on(g,c))){
    let pick=-1, best=-1;
    for(const d of[-1,1]){ const k=nb(g,i,d); if(k<0||!s[k]||s[k].owner===own) continue;
      const facing = d===-1 ? s[k].r : s[k].l;
      if(facing>best){ best=facing; pick=k; } }
    if(pick>=0) s[pick]={...s[pick], mark:(s[pick].mark||0)-g.brandN};
  }
  // 8 the ghost has no lodge effect now. It works on being struck, in tryFlip.
  // 19 the root: both cards beside it turn
  if(c.ab==="root"&&on(g,c)){ for(const d of[-1,1]){const k=nb(g,i,d);
    if(k>=0&&s[k]&&k!==g.stillAt) s[k]={...s[k], l:s[k].r, r:s[k].l}; } }
  // THE CROSSBAR (m13 candidate 13b, stillAt): the card at the law station is immune to every turn
  // and move verb: the root's and the veil's turn, the jewel's turn, the flock's swap, the claws'
  // shove. The first law that reads the opponent's signatures. Guards below, one per verb.
  // 20 the flock: it and one card beside it trade places
  if(c.ab==="flock"&&on(g,c)){ for(const d of[-1,1]){const k=nb(g,i,d);
    if(k>=0&&s[k]&&k!==g.stillAt&&i!==g.stillAt){ const tmp=s[k]; s[k]=s[i]; s[i]=tmp; break; } } }
  // 15 the veil: the first card that lands beside it is turned
  let veiled=false;
  for(const d of[-1,1]){ const k=nb(g,i,d); if(k<0||!s[k]||s[k].owner===own) continue;
    const n=g.C[s[k].id];
    if(n.ab==="veil"&&on(g,n)&&!s[k].vUsed&&i!==g.stillAt){ s[k]={...s[k],vUsed:true};
      s[i]={...s[i], l:s[i].r, r:s[i].l}; veiled=true; } }
  // THE COVER (m15 candidate 1a): the first card to land beside the law station lands turned
  // around, and stays that way. The veil's own signature as a place. coverN "first": one card,
  // whichever side it comes from; "both": the first arrival on each side. The used-flag rides on
  // the turned card's slot (a flag on g would leak across search branches). Deduped against the
  // veil card's own signature: a card the veil has just turned is not turned back.
  if(g.coverAt>=0 && Math.abs(i-g.coverAt)===1 && !veiled){
    const d = i<g.coverAt ? -1 : 1;
    const used = s.some(x=>x && x.covered && (g.coverN==="first" || x.covered===d));
    if(!used) s[i]={...s[i], l:s[i].r, r:s[i].l, covered:d};
  }
  // THE HIDDEN FACE (m15 candidate 1b): a card lodged at the law station shows no numbers until
  // the first strike against it (hideN "struck") or until the count (hideN "count"). The rule
  // itself changes no arithmetic; what it changes is what the search is allowed to read, see
  // blindScore. hideN "count" is never cleared: the count does not read faces.
  if(g.hideAt>=0 && i===g.hideAt) s[i]={...s[i], hidden:true};
  // THE ILL ROAD (m9 candidate 1b): the first card to lodge at the law station fights illN lower on
  // both faces for the rest of the board. The mark is on the traveller, not the square: it rides
  // the slot object, so a card the claws shove or the flock trades keeps it. Once a board.
  if(g.illAt>=0 && i===g.illAt && !s.some(x=>x && x.ill)) s[i]={...s[i], ill:g.illN};
  // 16 the claws: anything of hers that lands beside them gets shoved along
  for(const d of[-1,1]){ const k=nb(g,i,d); if(k<0||!s[k]||!s[i]) continue;
    const n=g.C[s[k].id];
    if(n.ab!=="claws"||!on(g,n)||s[k].owner===own||i===g.stillAt) continue;
    let j=i-d; while(j>=0&&j<g.len&&s[j]) j-=d;          // push away from the claws
    if(j>=0&&j<g.len){ s[j]=s[i]; s[i]=null; } break; }
  // 14 the jewel: turns to face what lands beside it with its stronger number
  for(const d of[-1,1]){ const k=nb(g,i,d); if(k<0||!s[k]) continue;
    const n=g.C[s[k].id]; if(n.ab!=="jewel"||!on(g,n)||k===g.stillAt) continue;
    const facing = d===1 ? "l" : "r";                 // the jewel's face pointing back at i
    const other  = d===1 ? "r" : "l";
    if(s[k][other] > s[k][facing]) s[k]={...s[k], l:s[k].r, r:s[k].l}; }
  return s;
}

function resolve(g,sIn,id,i,rev,side){
  const s=lodge(g,sIn,id,i,rev,side);
  const c=g.C[id];
  let at=i; if(!s[at]||s[at].id!==id){ at=s.findIndex(x=>x&&x.id===id&&x.age===0); }
  if(at<0) return {slots:s, flips:0};
  const i2=at;
  let flips = (g.razorAt>=0 && i2===g.razorAt) ? razorStrike(g,s,i2) : strike(g,s,i2);
  // 9 THE GLANCE: it watches the station opposite it across the road, and strikes there.
  // Not two along — that is Suzaku's grant now, and a signature must not repeat its quadrant.
  {
    const mir = m => g.len-1-m;
    if(c.ab==="glance"&&on(g,c)){                       // it lands, and looks across
      const to=mir(i2);
      if(to!==i2&&s[to]&&tryFlip(g,s,i2,to,to>i2?1:-1)) flips++;
    }
    // and it keeps watching: anything landing on the station it watches is struck
    for(let k=0;k<g.len;k++){ const x=s[k]; if(!x||mir(k)!==i2||k===i2) continue;
      const wc=g.C[x.id];
      if(wc.ab==="glance"&&on(g,wc)&&x.owner!==s[i2].owner){
        if(tryFlip(g,s,k,i2,i2>k?1:-1)) flips++; }
    }
  }
  // THE TWO STARS (m9 candidate 1a): the law station and the station opposite it across the road
  // watch each other. Whatever lodges at either strikes the other as it lands, with its printed
  // faces (glancePrinted) so a raised face does not carry eight stations. glanceWay "both": either
  // end looks; "door": only the law station looks, the far end is a target. Deduped against the
  // glance card's own signature, which has just looked at the same station.
  if(g.glanceAt>=0){
    const opp=g.len-1-i2;
    const looks = i2===g.glanceAt || (g.glanceWay==="both" && i2===g.len-1-g.glanceAt);
    if(looks && opp!==i2 && !(c.ab==="glance"&&on(g,c))){
      if(g.real){ g.gLodges=(g.gLodges||0)+1; }
      if(s[opp]){
        if(g.real){ g.gFires=(g.gFires||0)+1; if(i2===g.glanceAt) g.gFireDoor=(g.gFireDoor||0)+1; if(side===g.first) g.gFireLeader=(g.gFireLeader||0)+1; }
        let keep=null;
        if(g.glancePrinted){
          const raw=s[i2].id>200 ? POOL[s[i2].id-201] : POOL[s[i2].id-1];
          if(raw){ keep={l:s[i2].l,r:s[i2].r}; s[i2].l=raw[1]; s[i2].r=raw[2]; }
        }
        const ok=tryFlip(g,s,i2,opp,opp>i2?1:-1);
        if(keep){ s[i2].l=keep.l; s[i2].r=keep.r; }
        if(ok){ flips++; if(g.real) g.gTakes=(g.gTakes||0)+1; }
      }
    }
  }
  // 7 the return: strike again at the end of your next turn
  // 7 the return: it comes back only if it took nothing on the way in
  // Real placements only: the search shares g.pending through its shallow copies, and before
  // 13 Sep every hypothetical return-lodge the search tried left a phantom entry behind that fired
  // a real strike two moves later. playBoard now re-runs the chosen move with g.real set, always.
  if(g.real && c.ab==="return"&&on(g,c)&&flips===0) g.pending.push({slot:i2, side, wait:2});
  // THE SECOND STRIKE (m7 candidate 7a): the return's signature as a place. A lodge at the law
  // station that takes nothing strikes again after the opponent's next card lands. Deduped
  // against the return card's own signature. Real placements only, as the return is.
  if(g.real && g.againAt>=0 && i2===g.againAt && flips===0 && !(c.ab==="return"&&on(g,c))){
    g.pending.push({slot:i2, side, wait:2, again:true});
    if(g.real) g.aArmed=(g.aArmed||0)+1;
  }
  // AL-RISHA, THE WELL-ROPE (design file, mansion 28 only): whatever lodges on the rope station
  // hauls one enemy neighbour in. A free take — no numbers are compared. Left neighbour first.
  if(g.ropeAt >= 0 && i2 === g.ropeAt){
    for(const d of [-1,1]){
      const k=nb(g,i2,d);
      if(k>=0 && s[k] && s[k].owner !== s[i2].owner){ s[k]={...s[k], owner:s[i2].owner, taken:true}; flips++; break; }
    }
  }
  // L3 SUZAKU, candidate "again": a granted card standing beside the newcomer strikes.
  // Persistent, costs no turn, gives the opponent nothing. The claws pattern.
  if(g.suzakuAgain){
    for(const d of[-1,1]){ const k=nb(g,i2,d); if(k<0||!s[k]) continue;
      const gc=g.C[s[k].id];
      if(gc.grant==="suzaku") flips+=strike(g,s,k);
    }
  }
  return {slots:s, flips};
}

// ---- THE COUNT
function counts(g,s){
  const sil={};
  s.forEach((x,i)=>{ if(!x||x.bare) return; const c=g.C[x.id];
    // 21 THE EMPTY DISTRICT silences only what is not yours. Silencing both sides was a gift.
    if(c.ab==="district"&&on(g,c)) for(const d of[-1,1]){const k=nb(g,i,d);
      if(k>=0&&s[k]&&s[k].owner!==x.owner) sil[k]=true;} });
  let you=0, sky=0; const W=[];
  s.forEach((x,i)=>{
    if(!x||sil[i]) return;
    // THE HIDEAWAY'S LAW (proposed, mansion 25): the ward station scores nothing at the count,
    // and each station beside it scores one extra. The empty tent feeds its neighbour.
    if(i===g.wardAt) return;
    if(x.bare) return;                                     // 1a: bare ground counts for nobody
    // THE HUSH (m21 candidate 1b): while the middle station is held, both its neighbours
    // count for nobody. Two stations silenced, so the counting parity stays odd.
    if(g.hushAt>=0 && Math.abs(i-g.hushAt)===1 && s[g.hushAt]) return;
    // THE WEATHER TURNS (m12 candidate 1b): the law station counts double while the road is less
    // than half full, and nothing once it is more.
    if(i===g.weatherAt){
      const filled=s.reduce((n,z)=>n+(z?1:0),0);
      if(filled > g.len/2) return;                          // counts nothing
    }
    // THE SHELL LAW (hideaway redesign C): take this station and it counts for nobody.
    // The Genbu grant as a place. Conditional — the count only empties if someone chose the theft.
    if(i===g.shellAt && x.taken) return;
    const c=g.C[x.id];
    let w = 1 + (isHome(g,x.id,i)?1:0);
    // THE STRANGER'S STATION (m27 candidate 1a): at the guide's station a card whose quarter is
    // not that ground's quarter counts one more, both sides. A card on its own quarter's ground
    // counts as it always did. Reads the night's geography rather than the board's shape.
    if(g.strangerPlus && i===g.strangerAt){
      const ground = QUAD[boardM(g,i)];
      if(c.quad && ground && c.quad!==ground) w += g.strangerPlus;
    }
    // THE TOLL (m2 candidate 1b): at the crossing, a card that cannot be taken counts one less.
    // Shelter is not free ground. Computed at count time from the shield test, never a flag
    // written at lodge, so it can never drift from what the strike path actually refuses.
    if(g.tollBy && i===g.tollAt && shielded(g,s,i)) w -= g.tollBy;
    if(g.wardAt>=0 && Math.abs(i-g.wardAt)===1) w+=1;
    // THE EMPTY CIRCLE (m24 candidate 1a): the void's own count as a place. The law station counts
    // two, and the station on its right counts one less (voidN "right", as printed) or the richer
    // of its two neighbours does (voidN "best", the crow's choice). Nothing stored; read at count.
    if(g.voidAt>=0){
      if(i===g.voidAt && g.voidN!=="debit") w+=1;
      else if(g.voidN==="both" && Math.abs(i-g.voidAt)===1) w=Math.max(0,w-1);
      else if(g.voidN==="debit" && i===g.voidAt-1) w=Math.max(0,w-1);
      else if(g.voidN==="right" && i===g.voidAt+1) w=Math.max(0,w-1);
      // THE RELEASE (m22 candidate 22b): the debit on the left flank. voidLodged (the lighter
      // release): the flank pays only while its card is still held by the hand that lodged it; a
      // taken card keeps its face. voidN "credit": the crossing counts two and nobody pays.
      else if(g.voidN==="left" && i===g.voidAt-1 && !(g.voidLodged && x.taken)) w=Math.max(0,w-1);
    }
    // THE FEED (redesign candidate B): the tent scores normally, its neighbour scores one extra.
    if(g.feedAt>=0 && Math.abs(i-g.feedAt)===1) w+=1;
    let owner = x.owner;
    if(on(g,c)){
      if(c.ab==="district") w+=1;                                   // 21 counts two
      if(c.ab==="void")     w+=1;                                   // 24 counts two
      // 26 THE CHAMBER: counts two while it has never been taken, and four if it is still
      // untouched when the road fills. Holding it becomes an objective rather than a hope.
      if(c.ab==="chamber" && !x.taken) w += s.some(z=>!z) ? 1 : 3;
      if(c.ab==="listener"){ for(const d of[-1,1]){const k=nb(g,i,d); if(k>=0&&s[k]) w+=1;} } // 22
      if(c.ab==="hideaway") w-=1;                                    // 25 counts nothing for itself
    }
    // L3 GENBU: the tortoise deepens the station — but only while you still hold the card.
    // Counting it for whoever owns the station made the grant a gift to the taker.
    // L3 GENBU: the tortoise endures. Once this station has counted for you it keeps counting
    // for you, whoever ends up holding the card. A flat +1 was the same lever as four of Genbu's
    // own signatures; this moves the count's OWNER, not its size, which no Genbu signature does.
    if(grantAt(g,i,c)==="genbu"){
      if(g.genbuKeep){ owner = c.who; }                     // she never gets the station's count
      else if(g.genbuShell){                                // the shell: she gets nothing, you get one
        if(x.owner!==c.who){ w = 1; owner = c.who; }
      }
      else if(g.genbuDead){                                 // the empty shell: neither side counts it
        if(x.owner!==c.who) w = 0;
      }
      else if(x.owner===c.who) w+=1;                        // the flat deepening
    }
    // neighbour effects on this station's worth
    for(const d of[-1,1]){ const k=nb(g,i,d); if(k<0||!s[k]) continue;
      const n=g.C[s[k].id]; if(!on(g,n)) continue;
      if(n.ab==="void" && d===-1) w-=1;                              // 24 the station to its right pays
      if(n.ab==="hideaway") w+=1;                                    // 25 shelters whoever stands there
      if(n.ab==="drum" && d===-1) owner = s[k].owner;                // 23 the station to its right
    }
    // 27 the guide: your cards on their own mansion count one more
    if(isHome(g,x.id,i)){
      for(let j=0;j<g.len;j++){ const y=s[j]; if(!y) continue;
        const gc=g.C[y.id]; if(gc.ab==="guide"&&on(g,gc)&&y.owner===owner){ w+=1; break; } }
    }
    // THE REAR SPOUT (m27 candidate 1b): the law station counts for nothing where it stands. Its
    // worth pours one station along the road and is counted for whoever holds THAT station.
    // ONE hop, terminal, off the end: if the next station is empty, or there is no next station,
    // the worth is lost. A poured worth never pours again.
    // THE MARK STAYS (m5 candidate 2a): whatever is taken from the law station keeps its mark —
    // it counts for the hand that lost it, to the board's end, whoever holds the card. The shell's
    // shape with the victim keeping the point instead of nobody. Worth unchanged; only the owner
    // is redirected, read at count time from the slot's lodger. Taken back by its first hand it
    // counts plainly again, which is the same hand.
    if(i===g.markAt && x.taken && x.lodger) owner = x.lodger;
    if(g.pourAt>=0 && i===g.pourAt){
      const k=nb(g,i,1);
      if(k>=0 && s[k]) owner = s[k].owner; else w = 0;
    }
    w=Math.max(0,w);
    W.push({i, w, owner});
  });
  // THE CROW (m4 candidate 1b): the crossing counts one more, and whichever card standing beside
  // it is worth most counts one less. Both sides, all night. Computed from the same per-station
  // worth the count itself uses, never a stored flag. Ties go to the station nearer the door.
  // crowN (13 Sep, the half-strength ask): "both" as shipped; "credit" the crossing counts one more
  // and nobody pays; "debit" the richest neighbour pays and the crossing counts as ever.
  if(g.crowAt>=0){
    const at=W.find(z=>z.i===g.crowAt);
    if(at){
      if(g.crowN!=="debit") at.w+=1;
      if(g.crowN==="credit"){ /* no debit */ } else {
      const near=[];
      for(const d of[-1,1]){ const k=nb(g,g.crowAt,d); if(k<0) continue;
        const n=W.find(z=>z.i===k); if(n) near.push(n); }
      if(near.length){
        const top=Math.max(...near.map(n=>n.w));
        // tie rule: crowBoth — both equally bright neighbours pay. Otherwise the one nearer the
        // door pays, which is the lower index and therefore the first found.
        const payers = g.crowBoth ? near.filter(n=>n.w===top) : [near.find(n=>n.w===top)];
        for(const n of payers) if(n) n.w=Math.max(0,n.w-1);
      }
      }
    }
  }
  // THE EMPTY CIRCLE, voidN "best": the crow's choice with the void's arithmetic. The richer of the
  // two neighbours pays one, whether or not the crossing is held; ties to the station nearer the door.
  if(g.voidAt>=0 && g.voidN==="best"){
    const near=[];
    for(const d of[-1,1]){ const k=nb(g,g.voidAt,d); if(k<0) continue;
      const n=W.find(z=>z.i===k); if(n) near.push(n); }
    if(near.length){ const top=Math.max(...near.map(n=>n.w)); const n=near.find(z=>z.w===top); n.w=Math.max(0,n.w-1); }
  }
  // THE VAPOUR (m8 candidate 8b): at the count the law station goes to whichever hand holds more
  // of its two flanks; equal, it counts as lodged.
  if(g.vapourAt>=0){
    const at=W.find(z=>z.i===g.vapourAt);
    if(at){ let ny=0,nk=0; for(const d of[-1,1]){ const k=nb(g,g.vapourAt,d); if(k<0||!s[k]||s[k].bare) continue; if(s[k].owner==="you") ny++; else nk++; }
      if(ny>nk) at.owner="you"; else if(nk>ny) at.owner="sky"; }
  }
  // THE EAR (m22 candidate 22a): the listener's count as a place. The law station is worth one
  // more for each flank its owner also holds.
  if(g.earAt>=0){
    const at=W.find(z=>z.i===g.earAt);
    if(at){ for(const d of[-1,1]){ const k=nb(g,g.earAt,d); if(k>=0&&s[k]&&!s[k].bare&&s[k].owner===at.owner) at.w+=1; } }
  }
  // THE TWO RIBS (m11 candidate 11b): at the count, whoever holds both flanks of the law station
  // holds the station. Owner read only; worth unchanged.
  if(g.ribsAt>=0){
    const at=W.find(z=>z.i===g.ribsAt), a=W.find(z=>z.i===g.ribsAt-1), b=W.find(z=>z.i===g.ribsAt+1);
    if(at && a && b && a.owner===b.owner) at.owner=a.owner;
  }
  // THE SCALES (m16 candidate 16b): at the count each hand's stations up the road (0..3) are
  // weighed against its stations down the road (5..8); the lighter side's stations count one
  // less each. The crossing is the beam and is not weighed. Equal pans, nothing moves.
  if(g.scales){
    const mid=Math.floor(g.len/2);
    for(const side of ["you","sky"]){
      let L=0,R=0; for(const z of W){ if(z.owner!==side) continue; if(z.i<mid) L+=z.w; else if(z.i>mid) R+=z.w; }
      if(L===R) continue;
      const light = L<R ? (z=>z.i<mid) : (z=>z.i>mid);
      for(const z of W) if(z.owner===side && light(z)) z.w=Math.max(0,z.w-1);
    }
  }
  // THE SMALLER PARTY (m3 candidate 1a): at the count the law station goes to whichever hand
  // holds fewer of the OTHER eight stations. Equal holdings go to the defender — the side that did
  // not lead this board — which is the draw rule's own tiebreak. Worth unchanged: dominion, the
  // shell's weight and a planet's two all still count, just for the smaller party.
  if(g.partyAt>=0){
    const at=W.find(z=>z.i===g.partyAt);
    if(at){
      let ny=0, nk=0;
      for(let j=0;j<g.len;j++){ const x=s[j]; if(j===g.partyAt||!x||x.bare) continue;
        if(x.owner==="you") ny++; else nk++; }
      if(ny<nk) at.owner="you";
      else if(nk<ny) at.owner="sky";
      else if(g.partyTie==="defender") at.owner = g.first==="you" ? "sky" : "you";
      else at.w=0;
    }
  }
  for(const z of W){ if(z.owner==="you") you+=z.w; else sky+=z.w; }
  return [you,sky];
}

// THE COCK'S HOUR (m3 candidate 2c): the law station is closed until hourN cards stand on the
// road. Nothing about who owns it or what it counts — only when it opens.
const openSlots = g => {
  const filled = g.slots.reduce((n,z)=>n+(z?1:0),0);
  const shut = (g.hourAt>=0 && filled < g.hourN) ? g.hourAt : -1;
  return g.slots.map((x,i)=>x?-1:i).filter(i=>i>=0 && i!==shut);
};

// The score the search reads. A full board is the end of the board, so the heart's last beat
// has to be inside the count the search is comparing against, not applied after it decides.
// DAWN (14 Sep 2026, the second seat's compensation). When the road fills, the cards each side
// still holds are shown and fight in the sky: strongest against strongest by printed total, each
// pairing worth one station to the higher card (dawnTie: "nobody" | "defender"), and a card with no
// opponent scores unopposed. The follower always holds one more card than the leader, so the
// follower always has the unopposed card: the seat's compensation is structural, not a flat komi.
//   dawn "pair"  — the duel above
//   dawn "count" — every held card counts one, no duel (a plain komi of one to the follower)
// Read at every full-board count, so the search weighs holding a card back against lodging it.
function dawnPoints(g, slots){
  if(!g.dawn) return [0,0];
  const held = side => (side==="you"?g.you:g.sky).filter(id => !slots.some(x=>x && x.id===id));
  const tot = id => { const c=g.C[id]; return c.l + c.r; };
  const Y=held("you").map(tot).sort((a,b)=>b-a), K=held("sky").map(tot).sort((a,b)=>b-a);
  if(g.dawn==="count") return [Y.length, K.length];
  //   dawn "duel"  — the pairings only; a card with no opponent scores nothing
  //   dawn "top"   — one duel: each side's strongest held card, winner takes one
  let y=0,k=0; const n = g.dawn==="top" ? 1 : g.dawn==="duel" ? Math.min(Y.length,K.length) : Math.max(Y.length,K.length);
  for(let i=0;i<n;i++){
    if(i>=Y.length){ if(g.dawn!=="top") k++; continue; } if(i>=K.length){ if(g.dawn!=="top") y++; continue; }
    if(Y[i]>K[i]) y++; else if(K[i]>Y[i]) k++;
    else if(g.dawnTie==="defender"){ if(g.first==="you") k++; else y++; }
  }
  return [y,k];
}
function finalCounts(g, slots){
  if(slots.some(x=>!x)) return counts(g, slots);
  const s = slots.map(z=>z?{...z}:z);
  lastBeat({...g, slots:s});
  const [a,b]=counts(g, s); const [dy,dk]=dawnPoints(g, s);
  return [a+dy, b+dk];
}
function moveKey(g,id,i){ let h=((id*73856093)^(i*19349663)^((g.tonight||1)*2654435761))>>>0;
  h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0; return h>>>0; }

// The opponent's best reply to a position. Every candidate move must be scored through this,
// or moves that skip it look better than they are simply because nobody answered them.
function replyCost(g, slots, side, depth){
  if(depth<=0) return 0;
  const foe = side==="you" ? "sky" : "you";
  let worst=null;
  const g2={...g, slots};
  for(const fid of (foe==="sky"?g.sky:g.you)){
    for(const fi of openSlots(g2)){
      const [y2,k2]=scoreLodge(g2,slots,fid,fi,false,foe,side);
      const v = side==="you" ? (k2-y2) : (y2-k2);
      if(worst===null||v>worst) worst=v;
    }
  }
  return worst===null ? 0 : worst*depth;
}

// THE BLIND ROW (m15 candidate 1b, harness side). The search is full-information on both
// sides, hands included. A covered card is covered only if the searcher is told not to read it,
// so: when g.blind is set and the board holds a hidden card the viewer does not own, every leaf
// is scored as the average over what the covered numbers could be. Two beliefs are modelled:
//   blind "deck" — the viewer cannot read the numbers but sees the art; the numbers could be any
//                  printed pair in the 28-card deck (the sentence exactly: numbers hidden, art shown)
//   blind "hand" — the viewer knows the opponent's hand but not which card was lodged: the
//                  numbers are those of one of (opponent's hand ∪ the lodged card). The PvP bluff.
// The real board keeps its real faces; only the score is blinded. Cost: K extra resolves a leaf
// while a hidden enemy card stands (K=28 for deck, ≤7 for hand).
function hiddenFor(g, slots, viewer){
  if(!g.blind || g.hideAt<0) return -1;
  const h=slots[g.hideAt];
  return (h && h.hidden && h.owner!==viewer) ? g.hideAt : -1;
}
function beliefs(g, slots, h, viewer){
  if(g.blind==="deck") return Object.keys(g.C).map(Number).filter(id=>id<=28 && g.C[id].l!=null)
    .map(id=>[g.C[id].l, g.C[id].r]);
  const foeHand = viewer==="you" ? g.sky : g.you;
  const ids=[...foeHand, slots[h].id];
  return ids.map(id=>[g.C[id].l, g.C[id].r]);
}
// score of lodging (id,i,rev) for `side`, judged by `viewer`, on `slots`. Returns [you,sky].
function scoreLodge(g, slots, id, i, rev, side, viewer){
  const h=hiddenFor(g, slots, viewer);
  if(h<0){ const r=resolve(g,slots,id,i,rev,side); return finalCounts(g,r.slots); }
  const B=beliefs(g, slots, h, viewer); let y=0,k=0;
  for(const [l,r] of B){
    const s2=slots.slice(); s2[h]={...s2[h], l, r};
    const rr=resolve(g,s2,id,i,rev,side); const [a,b]=finalCounts(g,rr.slots); y+=a; k+=b; }
  return [y/B.length, k/B.length];
}

function bestMove(g, side, depth){
  const hand = side==="you" ? g.you : g.sky;
  let best=null;
  for(const id of hand){
    const revs = g.C[id].grant==="seiryuu" ? [false,true] : [false];
    for(const i of openSlots(g)) for(const rev of revs){
      const r=resolve(g,g.slots,id,i,rev,side);
      const [y,k]=scoreLodge(g,g.slots,id,i,rev,side,side);
      let score = side==="you" ? (y-k)*10 : (k-y)*10;
      score -= replyCost(g, r.slots, side, depth);
      const key=moveKey(g,id,i)^(rev?7919:0);
      if(best===null||score>best.score||(score===best.score&&key>best.key)) best={id,i,rev,score,r,key};
    }
  }
  // L3 suzaku: once a board, tap a card of yours to strike its neighbours again
  for(let i=0;i<g.len;i++){
    const x=g.slots[i]; if(!x||x.owner!==side) continue;
    const c=g.C[x.id];
    if(c.grant!=="suzaku"||g.taps["s"+x.id]||g.suzakuFree||!g.suzakuTap) continue;
    const s2=g.slots.map(z=>z?{...z}:z);
    strike({...g,slots:s2},s2,i);
    const [y,k]=counts(g,s2);
    let score=(side==="you"?(y-k):(k-y))*10;
    score -= replyCost(g, s2, side, depth);      // the tap costs the turn, so it must be answered
    const key=moveKey(g,x.id,i);
    if(best===null||score>best.score||(score===best.score&&key>best.key))
      best={id:x.id,i,score,r:{slots:s2,flips:0},key,suzakuTap:true};
  }
  // 18 the heart is no longer a tap. It strikes when the road fills — see lastBeat.
  return best;
}

function playBoard(cfg){
  const g=mkGame(cfg);
  let guard=0;
  while(g.slots.some(x=>!x) && (g.you.length||g.sky.length) && guard++<60){
    const side=g.turn;
    const hand=side==="you"?g.you:g.sky;
    const mv = hand.length ? bestMove(g, side, side==="you"?g.youDepth:g.depth) : null;
    if(!mv){ g.turn = side==="you"?"sky":"you"; continue; }
    if(!mv.suzakuTap && !mv.heartTap){
      g.real=true; const rr=resolve(g,g.slots,mv.id,mv.i,mv.rev,side); g.real=false; g.slots=rr.slots;
    } else g.slots=mv.r.slots;
    // who lodges the watched station first? Real placements only.
    if(g.watchAt>=0 && !g.firstLodger && g.slots[g.watchAt]){ g.firstLodger = side; g.firstLodgerId = g.slots[g.watchAt].id; }
    // carry telemetry, real placements only (the search runs on copies, so it cannot inflate this)
    if(g.carryAt>=0 && !mv.suzakuTap && mv.i===g.carryAt){
      g.aimed=(g.aimed||0)+1;
      const at=g.slots[mv.i];
      if(at && at.id===mv.id && at.age===0) g.stayed=(g.stayed||0)+1;
    }
    if(mv.suzakuTap){ g.taps["s"+mv.id]=true; }
    else if(mv.heartTap){ g.taps[mv.id]=true; }
    else {
      if(side==="you") g.you=g.you.filter(x=>x!==mv.id); else g.sky=g.sky.filter(x=>x!==mv.id);
      // suzakuFree: the tap rides along with the placement instead of replacing it.
      if(g.suzakuFree){
        let pick=null;
        const [y0,k0]=counts(g,g.slots);
        const base = side==="you" ? (y0-k0) : (k0-y0);
        for(let i=0;i<g.len;i++){
          const x=g.slots[i]; if(!x||x.owner!==side) continue;
          const c=g.C[x.id]; if(c.grant!=="suzaku"||g.taps["s"+x.id]) continue;
          const s2=g.slots.map(z=>z?{...z}:z);
          strike({...g,slots:s2},s2,i);
          const [y,k]=counts(g,s2);
          const m = side==="you" ? (y-k) : (k-y);
          if(m>base && (pick===null||m>pick.m)) pick={m,i,id:x.id,s2};
        }
        if(pick){ g.slots=pick.s2; g.taps["s"+pick.id]=true; }
      }
    }
    // 7 the return's delayed strike
    g.pending=g.pending.filter(p=>{ p.wait--; if(p.wait>0) return true;
      if(g.slots[p.slot]&&g.slots[p.slot].owner===p.side){ const f=strike(g,g.slots,p.slot); if(p.again){ g.aFired=(g.aFired||0)+1; if(f) g.aTook=(g.aTook||0)+1; } }
      return false; });
    g.turn = side==="you"?"sky":"you";
  }
  lastBeat(g);
  let [you,sky]=counts(g,g.slots);
  const [dy,dk]=dawnPoints(g,g.slots); you+=dy; sky+=dk; g.dawnYou=dy; g.dawnSky=dk;
  // A LEVEL BOARD. About one board in eight ends equal, so this line is not a formality.
  //   "defender" the side that did not lead that board takes it
  //   "leader"   the side that led takes it
  //   "you"      the old behaviour, which quietly handed every level board to the player
  let winner;
  if(you>sky) winner="you";
  else if(sky>you) winner="sky";
  else if(g.drawTo==="defender") winner = g.first==="you" ? "sky" : "you";
  else if(g.drawTo==="leader")   winner = g.first;
  else winner="you";
  return { winner, you, sky, level: you===sky, slots:g.slots,
           aimed:g.aimed||0, stayed:g.stayed||0, firstLodger:g.firstLodger||null, firstLodgerId:g.firstLodgerId||0,
           tStrikes:g.tStrikes||0, tTies:g.tTies||0, lStrikes:g.lStrikes||0, lLonely:g.lLonely||0, gLodges:g.gLodges||0, gFires:g.gFires||0, gTakes:g.gTakes||0, gFireDoor:g.gFireDoor||0, gFireLeader:g.gFireLeader||0, aArmed:g.aArmed||0, aFired:g.aFired||0, aTook:g.aTook||0, dawnYou:g.dawnYou||0, dawnSky:g.dawnSky||0 };
}

// 18 THE HEART: when the road fills, every standing heart strikes both its neighbours once more.
// The count cannot be dodged, so an effect fixed to the count cannot be played around.
function lastBeat(g){
  for(let i=0;i<g.len;i++){
    const x=g.slots[i]; if(!x) continue;
    const c=g.C[x.id];
    // THE HEART'S LAW, geometry form (proposed, mansion 18): when the road fills, EVERY card
    // strikes its neighbours once more, in station order. The heart's own signature is this
    // exact rule for one card; on the heart's board it belongs to everyone.
    // beatAt: the SCOPED form — one station (the mansion's home, station 0) beats at the count,
    // for whoever holds it. The signature as a place, not as physics.
    if(g.allBeat || i===g.beatAt || (c.ab==="heart"&&on(g,c))) strike(g,g.slots,i);
  }
}

module.exports={ POOL, QUAD, makeCards, mkGame, lodge, resolve, strike, tryFlip, hiddenFor, beliefs, bestMove, finalCounts, dawnPoints,
                 faceOf, counts, finalCounts, razorStrike, lastBeat, isHome, on, nb, playBoard, openSlots, shielded };
