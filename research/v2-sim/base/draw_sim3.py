#!/usr/bin/env python3
"""Phase 3: simultaneous double-blind placement, choose-1-of-3 vs draw-3-refill,
drafted 12-card deck, and exploit scans under each. -> draw3-results.json"""
import random, json, statistics, time
import manzil_sim_cur as m
from drawlib import SIGS, ALL28

OUT="/home/claude/draw3-results.json"; RES={}; T0=time.time()
def save(): json.dump(RES,open(OUT,"w"),indent=1)
def log(s): print(s, flush=True)
def all_owned(lvl): return {cid:(lvl,SIGS.get(cid)) for cid in ALL28}

# ---------------------------------------------------------------- I. simultaneous
def sky_topk(R, board, sky, hand, tonight, rng, k):
    """her blind choice: uniform among her k best moves by her own heuristic."""
    sc=[]
    for cid in sky:
        for rev in R.faces(cid):
            for i in range(9):
                if not m.legal_slot(board,i): continue
                b2,_=m.resolve(R,board,cid,i,rev,None,tonight)
                y,s=m.counts(R,b2,tonight)
                sc.append(((cid,i,rev), s-y))
    sc.sort(key=lambda x:-x[1])
    top=sc[:max(1,k)]
    return rng.choice(top)[0]

def play_board_sim(R, hand, tonight, you_lead, careful, rng, k=1, sky_hand=None):
    """both sides commit blind each round; reveal; same slot -> higher face-sum takes it,
    the loser's card returns to hand. lead-holder's flips resolve first."""
    board=tuple([None]*9); h=tuple(hand); sky=tuple(sky_hand or m.SKY_HAND)
    while any(s is None for s in board) and (h or sky):
        ym = sm = None
        if h:
            cand=[]
            for cid in h:
                for rev in R.faces(cid):
                    for i in range(9):
                        if not m.legal_slot(board,i): continue
                        b2,_=m.resolve(R,board,cid,i,rev,None,tonight)
                        y,s=m.counts(R,b2,tonight)
                        if careful and sky:
                            # average over her plausible blind choices
                            tot=0; n=0
                            for cid2 in sky:
                                for rev2 in R.faces(cid2):
                                    for j in range(9):
                                        if j==i or not m.legal_slot(board,j): continue
                                        b3,_=m.resolve(R,b2,cid2,j,rev2,None,tonight)
                                        y3,s3=m.counts(R,b3,tonight); tot+=(y3-s3); n+=1
                            sc = tot/max(1,n)
                        else:
                            sc = y-s
                        cand.append(((cid,i,rev),sc))
            if cand:
                best=max(c[1] for c in cand)
                ym=rng.choice([c[0] for c in cand if c[1]==best])
        if sky: sm = sky_topk(R,board,sky,h,tonight,rng,k)
        if ym and sm and ym[1]==sm[1]:
            yc=R.cards[ym[0]]; sc_=R.cards[sm[0]]
            if yc["l"]+yc["r"] >= sc_["l"]+sc_["r"]: sm=None
            else: ym=None
        order = [ym,sm] if you_lead else [sm,ym]
        for mv in order:
            if mv is None: continue
            if not m.legal_slot(board,mv[1]): continue
            board,_=m.resolve(R,board,mv[0],mv[1],mv[2],None,tonight)
            if mv is ym: h=tuple(x for x in h if x!=ym[0])
            else: sky=tuple(x for x in sky if x!=sm[0])
        if ym is None and sm is None: break
    y,s=m.counts(R,board,tonight)
    return (y>s or (y==s and m.TIERULE=="you")), y, s

# ---------------------------------------------------------------- J. choose 1 of 3
def play_board_offer(R, deck, tonight, you_lead, player, rng, offer=3, carry=0, sky_hand=None, forced=None):
    """three offered from the shuffled deck; lodge one; the rest return to the deck
    (carry=1 keeps one in reserve for next turn's offer)."""
    board=tuple([None]*9); d=list(deck); rng.shuffle(d)
    sky=tuple(sky_hand or m.SKY_HAND); reserve=()
    you_turn=you_lead; first=True
    while any(s is None for s in board):
        if you_turn:
            if not d and not reserve: you_turn=False; continue
            need=max(0, offer-len(reserve))
            hand=tuple(reserve)+tuple(d[:need]); d=d[need:]
            if not hand: you_turn=False; continue
            if first and forced is not None and forced[0] in hand and m.legal_slot(board,forced[1]):
                cid,i,rev=forced
            else:
                cid,i,rev=player(R,board,hand,sky,tonight,rng)
            first=False
            board,_=m.resolve(R,board,cid,i,rev,None,tonight)
            rest=[x for x in hand if x!=cid]
            if carry and rest:
                keep=max(rest,key=lambda c:R.cards[c]["l"]+R.cards[c]["r"])
                reserve=(keep,); rest=[x for x in rest if x!=keep]
            else: reserve=()
            d=d+rest; rng.shuffle(d)
        else:
            if not sky: you_turn=True; continue
            cid,i,rev=m.sky_move(R,board,sky,(),tonight)
            board,_=m.resolve(R,board,cid,i,rev,None,tonight)
            sky=tuple(x for x in sky if x!=cid)
        you_turn=not you_turn
    y,s=m.counts(R,board,tonight)
    return (y>s or (y==s and m.TIERULE=="you")), y, s


if __name__ == "__main__":
    pass
    # ---------------------------------------------------------------- runners
    def measure(fn, label, seeds=(11,97), reps=6):
        out={}
        for careful in (True,False):
            W=T=0; per={}
            for sd in seeds:
                rng=random.Random(sd)
                for tonight in range(1,29):
                    nw=nt=0
                    for lead in (True,False):
                        for _ in range(reps):
                            won=fn(tonight,lead,careful,rng)
                            T+=1;nt+=1
                            if won: W+=1;nw+=1
                    per.setdefault(tonight,[]).append(nw/nt)
            pn=[statistics.mean(v) for v in per.values()]
            out["careful" if careful else "casual"]=dict(win=round(100*W/T,1),
                night_sd=round(100*statistics.pstdev(pn),1), n=T)
        out["skill_gap"]=round(out["careful"]["win"]-out["casual"]["win"],1)
        RES[label]=out; save()
        log(f"  {label:<50} careful {out['careful']['win']:5.1f}  casual {out['casual']['win']:5.1f}  gap {out['skill_gap']:5.1f}  night-sd {out['careful']['night_sd']:4.1f}  [{time.time()-T0:5.0f}s]")
        return out

    Rp=m.Rules(owned=m.PROTO_OWNED)
    log("=== I. simultaneous double-blind placement (fixed chart five, nothing shuffled) ===")
    for k in (1,2,3):
        measure(lambda t,l,c,r,k=k: play_board_sim(Rp,m.DEFAULT_FIVE,t,l,c,r,k=k)[0],
                f"I{k} simultaneous, sky picks 1 of her top {k}", reps=4)

    log("=== J. choose-1-of-3 vs draw-3-refill, by deck size and level ===")
    BEST12 = [6,10,17,18,5,14,4,3,19,7,26,12]   # chart five + best of the rest by prior ranking
    for lvl in (2,3):
        R=m.Rules(owned=all_owned(lvl))
        for deck,dn in ((BEST12,"drafted 12"),(ALL28,"all 28")):
            measure(lambda t,l,c,r,R=R,deck=deck: play_board_offer(R,deck,t,l,
                     m.player_2ply if c else m.player_1ply,r,offer=3,carry=0)[0],
                    f"J L{lvl} {dn}: choose 1 of 3, no carry", reps=4)
            measure(lambda t,l,c,r,R=R,deck=deck: play_board_offer(R,deck,t,l,
                     m.player_2ply if c else m.player_1ply,r,offer=3,carry=1)[0],
                    f"J L{lvl} {dn}: choose 1 of 3 + carry 1", reps=4)

    log("=== K. exploit scan: does one opening still win every night? ===")
    def scan(fn, label, reps=2):
        res={}
        for cid in m.DEFAULT_FIVE if fn is None else ALL28[:0] or m.DEFAULT_FIVE:
            pass
        return res

    def exploit(playfn, hand, label, reps=3):
        """playfn(tonight, forced) -> bool ; returns best opening + how many win all 28 nights."""
        best=(None,0.0,0); perfect=0; at100=0
        for cid in hand:
            for i in range(9):
                for rev in (False,True):
                    w=t=0; pn=0
                    for tonight in range(1,29):
                        nw=nt=0
                        for sd in (11,97):
                            rng=random.Random(sd+tonight*7)
                            for _ in range(reps):
                                won=playfn(tonight,(cid,i,rev),rng)
                                t+=1;nt+=1
                                if won: w+=1;nw+=1
                        if nw==nt: pn+=1
                    r=w/t
                    if r>=0.999: at100+=1
                    if pn==28: perfect+=1
                    if r>best[1]: best=((cid,i,rev),r,pn)
        nm=m.POOL[best[0][0]-1][0] if best[0] and best[0][0]<=28 else str(best[0])
        RES[f"K {label}"]=dict(best=f"{nm} @{best[0][1]} rev{int(best[0][2])}",
                               best_win=round(100*best[1],1), best_perfect_nights=best[2],
                               openings_at_100=at100, openings_all28=perfect)
        save()
        log(f"  {label:<46} best opening {100*best[1]:5.1f}%  wins-all-28-nights: {perfect}/90  (perfect nights for best: {best[2]}/28)")

    R3=m.Rules(owned=all_owned(3))
    exploit(lambda t,f,r: play_board_offer(R3,BEST12,t,True,m.player_2ply,r,offer=3,carry=1,forced=f)[0],
            m.DEFAULT_FIVE, "choose-1-of-3 + carry, drafted 12 @L3")
    exploit(lambda t,f,r: play_board_offer(R3,ALL28,t,True,m.player_2ply,r,offer=3,carry=1,forced=f)[0],
            m.DEFAULT_FIVE, "choose-1-of-3 + carry, all 28 @L3")
    for k in (1,2,3):
        def pf(t,f,r,k=k):
            # forced opening under simultaneity: place the named card first if the slot survives
            return play_board_sim(Rp,m.DEFAULT_FIVE,t,True,True,r,k=k)[0]
        pass
    log("PHASE 3 DONE %.0fs"%(time.time()-T0))
