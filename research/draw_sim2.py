#!/usr/bin/env python3
"""Phase 2: separate card-quality from randomness; test hidden/symmetric randomness;
test rotating night rules; test the cube. Writes /home/claude/draw2-results.json."""
import random, json, statistics, copy, time
import manzil_sim_cur as m
from drawlib import play_board_draw, owned_k, SIG_ORDER, SIGS, ALL28

OUT="/home/claude/draw2-results.json"; RES={}; T0=time.time()
def save(): json.dump(RES, open(OUT,"w"), indent=1)
def log(s): print(s, flush=True)

def all_owned(lvl):
    return {cid: (lvl, SIGS.get(cid)) for cid in ALL28}

# ============================================================ E. quality vs randomness
def basic(R, deck, hand_size, seeds=(11,97), reps=6, fixed=None, sky_hand=None):
    out={}
    for ag,nm in ((m.player_2ply,"careful"),(m.player_1ply,"casual")):
        W=T=0; F=[]; per={}
        for sd in seeds:
            rng=random.Random(sd)
            for tonight in range(1,29):
                nw=nt=0
                for lead in (True,False):
                    for _ in range(reps):
                        fl=[]
                        if fixed is not None:
                            won,_,_=m.play_board(R,list(fixed),tonight,lead,ag,rng,flip_log=fl,sky_hand=sky_hand)
                        else:
                            won,_,_=play_board_draw(R,deck,tonight,lead,ag,rng,hand_size,flip_log=fl,sky_hand=sky_hand)
                        T+=1;nt+=1; F.append(sum(fl))
                        if won: W+=1;nw+=1
                per.setdefault(tonight,[]).append(nw/nt)
        pn=[statistics.mean(v) for v in per.values()]
        out[nm]=dict(win=round(100*W/T,1), flips=round(statistics.mean(F),2),
                     night_sd=round(100*statistics.pstdev(pn),1), n=T)
    out["skill_gap"]=round(out["careful"]["win"]-out["casual"]["win"],1)
    return out

log("=== E. is the collapse randomness, or card quality? (draw 3 from 28) ===")
for lvl,tag in ((1,"all L1 loaners"),(2,"all L2 + signatures"),(3,"all L3"),(4,"all L4")):
    R = m.Rules(owned=all_owned(lvl))
    r = basic(R, ALL28, 3); RES[f"E{lvl} draw3/28, {tag}"]=r; save()
    log(f"  E{lvl} {tag:<22} careful {r['careful']['win']:5.1f}  casual {r['casual']['win']:5.1f}  gap {r['skill_gap']:5.1f}  flips {r['careful']['flips']:4.2f}")
# and the control: FIXED five at those levels
for lvl in (2,3):
    R = m.Rules(owned=all_owned(lvl))
    r = basic(R, None, 5, fixed=m.DEFAULT_FIVE); RES[f"E{lvl}c fixed five, all L{lvl}"]=r; save()
    log(f"  E{lvl}c control fixed five L{lvl}    careful {r['careful']['win']:5.1f}  casual {r['casual']['win']:5.1f}  gap {r['skill_gap']:5.1f}")

# ============================================================ F. symmetric + hidden
EXTRA = {106:("The Sun",8,7,None,None), 107:("The Moon",5,8,None,None),
         108:("Uranus",7,6,None,None), 109:("Neptune",6,7,None,None), 110:("Pluto",9,3,None,None)}
def sky_pool_rules(tonight, pool_ids, rng, base_owned):
    R = m.Rules(owned=base_owned)
    for pid,(nm,l,r,ab,_) in EXTRA.items():
        R.cards[pid]=dict(name=nm,l=l,r=r,who=1,ab=ab,lvl=3,two=False,home=rng.randrange(1,29))
    for pid in m.PLANETS:                      # drift her homes nightly, as the ephemeris does
        R.cards[pid]=dict(R.cards[pid]); R.cards[pid]["home"]=rng.randrange(1,29)
    return R

def blind_2ply(R, board, hand, sky, tonight, rng, stats=None):
    """careful play that cannot see WHICH bodies she holds: reasons against the whole pool."""
    return m.player_2ply(R, board, hand, BLIND_POOL, tonight, rng, stats)
BLIND_POOL = tuple(list(m.PLANETS.keys())+list(EXTRA.keys()))

log("=== F. she draws five from a larger pool; player open vs blind ===")
for poolsize in (5, 8, 10):
    pool = (list(m.PLANETS.keys())+list(EXTRA.keys()))[:poolsize]
    for blind in (False, True):
        agents = ((blind_2ply if blind else m.player_2ply,"careful"),(m.player_1ply,"casual"))
        out={}
        for ag,nm in agents:
            W=T=0; per={}
            for sd in (11,97):
                rng=random.Random(sd)
                for tonight in range(1,29):
                    nw=nt=0
                    for lead in (True,False):
                        for _ in range(6):
                            R = sky_pool_rules(tonight, pool, rng, m.PROTO_OWNED)
                            sh = tuple(rng.sample(pool, 5))
                            won,_,_=m.play_board(R,list(m.DEFAULT_FIVE),tonight,lead,ag,rng,sky_hand=sh)
                            T+=1;nt+=1
                            if won: W+=1;nw+=1
                    per.setdefault(tonight,[]).append(nw/nt)
            pn=[statistics.mean(v) for v in per.values()]
            out[nm]=dict(win=round(100*W/T,1), night_sd=round(100*statistics.pstdev(pn),1), n=T)
        out["skill_gap"]=round(out["careful"]["win"]-out["casual"]["win"],1)
        k=f"F{poolsize}{'b' if blind else 'o'} sky draws 5 of {poolsize}, {'blind' if blind else 'open'}"
        RES[k]=out; save()
        log(f"  {k:<44} careful {out['careful']['win']:5.1f}  casual {out['casual']['win']:5.1f}  gap {out['skill_gap']:5.1f}")

# ============================================================ G. rotating night rules
NIGHT_RULES = [
    ("plain",        dict()),
    ("ties to sky",  dict(TIERULE="sky")),
    ("no Same",      dict(SAME=False, COMBO=False)),
    ("no Combo",     dict(COMBO=False)),
    ("wrapped road", dict(SHAPE="wrapped")),
    ("she reads deep", dict(REPLY_W=12)),
    ("Storm off",    dict(STORM_MODE="off")),
]
def apply_rule(d):
    old = {k:getattr(m,k) for k in ("TIERULE","SAME","COMBO","SHAPE","REPLY_W","STORM_MODE")}
    for k,v in d.items(): setattr(m,k,v)
    return old
def restore(old):
    for k,v in old.items(): setattr(m,k,v)

def forced_scan(R, hand, rule_for_night, seeds=(11,97), reps=3):
    """for every (card,slot,face) opening: win rate, and how many nights it wins outright."""
    res={}
    for cid in hand:
        for i in range(9):
            for rev in (False,True):
                w=t=0; perfect=0
                for tonight in range(1,29):
                    old = apply_rule(rule_for_night(tonight))
                    nw=nt=0
                    for sd in seeds:
                        rng=random.Random(sd+tonight)
                        for lead in (True,)*1:
                            for _ in range(reps):
                                st={"n":0}
                                def P(R,b,h,s,tn,rg,stats=None,_st=st):
                                    if _st["n"]==0:
                                        _st["n"]=1
                                        if m.legal_slot(b,i) and cid in h: return (cid,i,rev)
                                    return m.player_2ply(R,b,h,s,tn,rg,stats)
                                won,_,_=m.play_board(R,list(hand),tonight,True,P,rng)
                                t+=1;nt+=1
                                if won: w+=1;nw+=1
                    restore(old)
                    if nt and nw==nt: perfect+=1
                res[(cid,i,rev)]=(w/t, perfect)
    return res

log("=== G. rotating night rules: does the lookup die? ===")
Rp=m.Rules(owned=m.PROTO_OWNED)
for tag, fn in (("shipped (one rule, all nights)", lambda t: dict()),
                ("7 rules rotating by night",      lambda t: NIGHT_RULES[t % 7][1]),
                ("28 rules (7 rules x 4 phases)",  lambda t: NIGHT_RULES[(t*3) % 7][1])):
    sc = forced_scan(Rp, m.DEFAULT_FIVE, fn)
    rows = sorted(sc.items(), key=lambda kv: -kv[1][0])
    best = rows[0]
    n100 = sum(1 for _,(r,p) in sc.items() if r>=0.999)
    nperf = sum(1 for _,(r,p) in sc.items() if p==28)
    RES[f"G {tag}"] = dict(best_win=round(100*best[1][0],1), best_perfect_nights=best[1][1],
                           openings_at_100=n100, openings_perfect_all_28=nperf,
                           top5=[[m.POOL[c-1][0], i, int(v), round(100*r,1), p] for (c,i,v),(r,p) in rows[:5]])
    save()
    log(f"  {tag:<34} best opening {100*best[1][0]:5.1f}%  wins-all-28-nights: {nperf} of 90 openings  (100%% openings: {n100})")

# ============================================================ H. the cube
def play_match_cube(R, hand, tonight, player, rng, cube=True, cube_thresh=2, sky_thresh=-3, target=3):
    """first to `target` points. each board worth 1; the player may double once per board
    after their second lodge if ahead by >= cube_thresh; the sky drops if behind by <= sky_thresh."""
    pts=[0,0]; lead=True; boards=0
    while max(pts)<target and boards<20:
        board=tuple([None]*9); h=tuple(hand); sky=tuple(m.SKY_HAND)
        you_turn=lead; val=1; doubled=False; lodges=0; folded=None
        while any(s is None for s in board):
            if you_turn:
                if not h: you_turn=False; continue
                cid,i,rev=player(R,board,h,sky,tonight,rng)
                board,_=m.resolve(R,board,cid,i,rev,None,tonight)
                h=tuple(x for x in h if x!=cid); lodges+=1
                if cube and not doubled and lodges==2:
                    y,s=m.counts(R,board,tonight)
                    if y-s>=cube_thresh:
                        doubled=True
                        if (y-s)>=-sky_thresh: folded="sky"; break   # she drops
                        val=2
            else:
                if not sky: you_turn=True; continue
                cid,i,rev=m.sky_move(R,board,sky,h,tonight)
                board,_=m.resolve(R,board,cid,i,rev,None,tonight)
                sky=tuple(x for x in sky if x!=cid)
            you_turn=not you_turn
        if folded=="sky": pts[0]+=1
        else:
            y,s=m.counts(R,board,tonight); won = y>s or (y==s and m.TIERULE=="you")
            pts[0 if won else 1]+=val
        lead=not lead; boards+=1
    return pts[0]>=target, boards

log("=== H. the cube in a first-to-N ===")
for cube in (False, True):
    for ag,nm in ((m.player_2ply,"careful"),(m.player_1ply,"casual")):
        W=T=0; B=[]
        for sd in (11,97):
            rng=random.Random(sd)
            for tonight in range(1,29):
                for _ in range(10):
                    w,b=play_match_cube(Rp,m.DEFAULT_FIVE,tonight,ag,rng,cube=cube)
                    T+=1; B.append(b)
                    if w: W+=1
        RES[f"H {'cube' if cube else 'no cube'} {nm}"]=dict(match_win=round(100*W/T,1), boards=round(statistics.mean(B),2), n=T)
        save()
        log(f"  {'cube ' if cube else 'plain'} {nm:<8} match win {100*W/T:5.1f}%   boards/match {statistics.mean(B):4.2f}")
gap_no = RES["H no cube careful"]["match_win"]-RES["H no cube casual"]["match_win"]
gap_cu = RES["H cube careful"]["match_win"]-RES["H cube casual"]["match_win"]
RES["H skill gap"]=dict(no_cube=round(gap_no,1), cube=round(gap_cu,1)); save()
log(f"  match-level skill gap: no cube {gap_no:.1f}  with cube {gap_cu:.1f}")
log("PHASE 2 DONE %.0fs" % (time.time()-T0))
