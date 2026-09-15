#!/usr/bin/env python3
"""Phase 2: separate card-quality from randomness; test hidden/symmetric randomness;
test rotating night rules; test the cube. Writes /home/claude/draw2gh-results.json."""
import random, json, statistics, copy, time
import manzil_sim_cur as m
from drawlib import play_board_draw, owned_k, SIG_ORDER, SIGS, ALL28

OUT="/home/claude/draw2gh-results.json"; RES={}; T0=time.time()
def save(): json.dump(RES, open(OUT,"w"), indent=1)
def log(s): print(s, flush=True)

def all_owned(lvl):
    return {cid: (lvl, SIGS.get(cid)) for cid in ALL28}

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
