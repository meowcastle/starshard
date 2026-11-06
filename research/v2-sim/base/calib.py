"""The calibration table: her hand strength (how many true planets) x player power
(abilities awake). Target: careful play near 55-60%, skill gap 20+."""
import random, json
import manzil_sim_cur as m
from drawlib import SIGS, ALL28
BEST12=[6,10,17,18,5,14,4,3,19,7,26,12]
SIGS_IN_12=[c for c in BEST12 if c in SIGS]
def rules(k):
    aw=set(SIGS_IN_12[:k])
    return m.Rules(owned={c:(3, SIGS.get(c) if c in aw else None) for c in ALL28})
def sky(nplanets):
    ps=list(m.SKY_HAND)[:nplanets]
    return tuple(ps+[201,202,203,207,219][:5-nplanets])
def cell(R,nplanets,rw=8,reps=6):
    old=m.REPLY_W; m.REPLY_W=rw; sh=sky(nplanets); out={}
    for ag,nm in ((m.player_2ply,"careful"),(m.player_1ply,"casual")):
        W=T=0
        for sd in (11,97):
            rng=random.Random(sd)
            for t in range(1,29):
                for ld in (True,False):
                    for _ in range(reps):
                        won,_,_=m.play_board(R,rng.sample(BEST12,5),t,ld,ag,rng,sky_hand=sh)
                        T+=1
                        if won: W+=1
        out[nm]=round(100*W/T,1)
    out["gap"]=round(out["careful"]-out["casual"],1); m.REPLY_W=old
    return out
RES={}
print("her hand ->      1 planet  2 planets 3 planets 4 planets 5 planets", flush=True)
for k in (0,2,4,6):
    R=rules(k); cs=[cell(R,n) for n in (1,2,3,4,5)]
    RES[f"{k} abilities"]={str(n):c for n,c in zip((1,2,3,4,5),cs)}
    print(f"  {k} abilities  careful " + "".join(f"{c['careful']:>10.1f}" for c in cs), flush=True)
    print(f"{'':<15}gap     " + "".join(f"{c['gap']:>10.1f}" for c in cs), flush=True)
json.dump(RES,open("/home/claude/calib.json","w"),indent=1)
print("DONE", flush=True)
