"""Phase 5: the Chess960 option — five dealt from a drafted pool at the start of each board,
revealed in full, fixed for the board. Plus exploit scans under it and under simultaneity."""
import random, json, statistics, time
import manzil_sim_cur as m
from drawlib import SIGS, ALL28
from nightrules import NIGHT_RULES, apply_rule, restore
from draw_sim3 import play_board_sim
OUT="/home/claude/draw5-results.json"; RES={}; T0=time.time()
def save(): json.dump(RES,open(OUT,"w"),indent=1)
def L(s): print(s, flush=True)
def all_owned(lvl): return {cid:(lvl,SIGS.get(cid)) for cid in ALL28}
BEST12=[6,10,17,18,5,14,4,3,19,7,26,12]
Rp=m.Rules(owned=m.PROTO_OWNED)

def run(label, R, pool, reps=8, rulefn=None):
    out={}
    for ag,nm in ((m.player_2ply,"careful"),(m.player_1ply,"casual")):
        W=T=0; per={}; F=[]
        for sd in (11,97):
            rng=random.Random(sd)
            for tonight in range(1,29):
                old=apply_rule(rulefn(tonight)) if rulefn else None
                nw=nt=0
                for lead in (True,False):
                    for _ in range(reps):
                        hand=rng.sample(pool,5); fl=[]
                        won,_,_=m.play_board(R,hand,tonight,lead,ag,rng,flip_log=fl)
                        T+=1;nt+=1; F.append(sum(fl))
                        if won: W+=1;nw+=1
                if old: restore(old)
                per.setdefault(tonight,[]).append(nw/nt)
        pn=[statistics.mean(v) for v in per.values()]
        out[nm]=dict(win=round(100*W/T,1), flips=round(statistics.mean(F),2),
                     night_sd=round(100*statistics.pstdev(pn),1), n=T)
    out["skill_gap"]=round(out["careful"]["win"]-out["casual"]["win"],1)
    RES[label]=out; save()
    L(f"  {label:<52} careful {out['careful']['win']:5.1f}  casual {out['casual']['win']:5.1f}  gap {out['skill_gap']:5.1f}  flips {out['careful']['flips']:4.2f}  night-sd {out['careful']['night_sd']:4.1f}")

L("=== M. five dealt from a pool at the start of each board, revealed in full ===")
for lvl in (2,3):
    R=m.Rules(owned=all_owned(lvl))
    run(f"M L{lvl}: five of a drafted 12, revealed", R, BEST12)
    run(f"M L{lvl}: five of all 28, revealed",       R, ALL28)
run("M proto levels: five of a drafted 12, revealed", Rp, BEST12)
run("M L3 + 28 rotating night rules: five of 12", m.Rules(owned=all_owned(3)), BEST12,
    rulefn=lambda t: NIGHT_RULES[(t*3)%7][1])

L("=== N. exploit scan under the dealt-five ===")
def exploit_dealt(R, pool, label, reps=4):
    best=(None,0.0,0); all28=0; at100=0
    for cid in BEST12[:5]:
        for i in range(9):
            for rev in (False,True):
                w=t=0; pn=0
                for tonight in range(1,29):
                    nw=nt=0
                    for sd in (11,97):
                        rng=random.Random(sd+tonight*7)
                        for _ in range(reps):
                            hand=rng.sample(pool,5)
                            if cid not in hand: hand[rng.randrange(5)]=cid   # condition on holding it
                            st={"n":0}
                            def P(R,b,h,s,tn,rg,stats=None,_st=st):
                                if _st["n"]==0:
                                    _st["n"]=1
                                    if m.legal_slot(b,i) and cid in h: return (cid,i,rev)
                                return m.player_2ply(R,b,h,s,tn,rg,stats)
                            won,_,_=m.play_board(R,hand,tonight,True,P,rng)
                            t+=1;nt+=1
                            if won: w+=1;nw+=1
                    if nw==nt: pn+=1
                r=w/t
                if r>=0.999: at100+=1
                if pn==28: all28+=1
                if r>best[1]: best=((cid,i,rev),r,pn)
    nm=m.POOL[best[0][0]-1][0]
    RES[f"N {label}"]=dict(best=f"{nm} @{best[0][1]}", best_win=round(100*best[1],1),
                           best_perfect_nights=best[2], openings_at_100=at100, openings_all28=all28)
    save()
    L(f"  {label:<48} best opening {100*best[1]:5.1f}%  wins-all-28-nights: {all28}/90  (best is perfect on {best[2]}/28 nights)")

exploit_dealt(m.Rules(owned=all_owned(3)), BEST12, "dealt five of 12 @L3")
exploit_dealt(Rp, BEST12, "dealt five of 12, proto levels")

L("=== O. exploit scan under simultaneous placement ===")
def exploit_sim(k, reps=4):
    best=(None,0.0,0); all28=0
    for cid in m.DEFAULT_FIVE:
        for i in range(9):
            for rev in (False,True):
                w=t=0; pn=0
                for tonight in range(1,29):
                    nw=nt=0
                    for sd in (11,97):
                        rng=random.Random(sd+tonight*7)
                        for _ in range(reps):
                            won,_,_=play_board_sim(Rp,m.DEFAULT_FIVE,tonight,True,True,rng,k=k,
                                                   sky_hand=None)
                            t+=1;nt+=1
                            if won: w+=1;nw+=1
                    if nw==nt: pn+=1
                r=w/t
                if pn==28: all28+=1
                if r>best[1]: best=((cid,i,rev),r,pn)
    RES[f"O simultaneous k={k}"]=dict(best_win=round(100*best[1],1), openings_all28=all28)
    save()
    L(f"  simultaneous, sky picks 1 of top {k}: best line {100*best[1]:5.1f}%  wins-all-28-nights: {all28}/90")
for k in (1,2,3): exploit_sim(k)
L("PHASE 5 DONE %.0fs"%(time.time()-T0))
