"""One dial: how deep she reads. Find the setting that holds the experienced win rate
near target at each rung of player power, and check the skill gap holds up."""
import random, statistics, json
import manzil_sim_cur as m
from drawlib import SIGS, ALL28
BEST12=[6,10,17,18,5,14,4,3,19,7,26,12]
SIGS_IN_12=[c for c in BEST12 if c in SIGS]
def rules(k): 
    aw=set(SIGS_IN_12[:k])
    return m.Rules(owned={c:(3, SIGS.get(c) if c in aw else None) for c in ALL28})

def cell(R, rw, reps=6, weak=0):
    old=m.REPLY_W; m.REPLY_W=rw
    sh = m.SKY_HAND if weak==0 else tuple(list(m.SKY_HAND)[:5-weak]+[201+i for i in range(weak)])
    out={}
    for ag,nm in ((m.player_2ply,"careful"),(m.player_1ply,"casual")):
        W=T=0
        for sd in (11,97):
            rng=random.Random(sd)
            for t in range(1,29):
                for ld in (True,False):
                    for _ in range(reps):
                        hand=rng.sample(BEST12,5)
                        won,_,_=m.play_board(R,hand,t,ld,ag,rng,sky_hand=sh)
                        T+=1
                        if won: W+=1
        out[nm]=round(100*W/T,1)
    out["gap"]=round(out["careful"]-out["casual"],1)
    m.REPLY_W=old
    return out

RES={}
WS=[0,2,4,8,12,16,24]
print("how deep she reads ->" + "".join(f"{w:>10}" for w in WS), flush=True)
for k in (0,2,4,6):
    R=rules(k); cs=[cell(R,w) for w in WS]
    RES[f"{k} abilities"]={str(w):c for w,c in zip(WS,cs)}
    print(f"  {k} abilities careful " + "".join(f"{c['careful']:>10.1f}" for c in cs), flush=True)
    print(f"{'':<14}gap     " + "".join(f"{c['gap']:>10.1f}" for c in cs), flush=True)

print("\n=== the soft end: swap planets for plain mansion cards (for rung 1) ===", flush=True)
for weak in (0,1,2,3):
    c=cell(rules(0), 4, weak=weak)
    RES[f"0 abilities, reads 4, {weak} planets swapped"]=c
    print(f"  0 abilities, reads 4, {weak} of her 5 swapped for a plain card:  careful {c['careful']:5.1f}  casual {c['casual']:5.1f}  gap {c['gap']:5.1f}", flush=True)
json.dump(RES,open("/home/claude/ladder.json","w"),indent=1)
print("DONE", flush=True)
