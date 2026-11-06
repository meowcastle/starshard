"""The granular dial: how many of her five bodies carry the Jupiter-style +1 weight.
This is the step the difficulty curve is currently missing."""
import random, json
import manzil_sim_cur as m
from drawlib import SIGS, ALL28
BEST12=[6,10,17,18,5,14,4,3,19,7,26,12]
SIGS_IN_12=[c for c in BEST12 if c in SIGS]
def rules(k, ndignified):
    aw=set(SIGS_IN_12[:k])
    R=m.Rules(owned={c:(3, SIGS.get(c) if c in aw else None) for c in ALL28})
    order=[105,101,102,104,103]                 # jupiter first, then saturn, mars, mercury, venus
    for idx,pid in enumerate(order):
        R.cards[pid]=dict(R.cards[pid])
        R.cards[pid]["ab"]="jupiter" if idx<ndignified else None
    return R
def cell(R,rw=8,reps=6):
    old=m.REPLY_W; m.REPLY_W=rw; out={}
    for ag,nm in ((m.player_2ply,"careful"),(m.player_1ply,"casual")):
        W=T=0
        for sd in (11,97):
            rng=random.Random(sd)
            for t in range(1,29):
                for ld in (True,False):
                    for _ in range(reps):
                        won,_,_=m.play_board(R,rng.sample(BEST12,5),t,ld,ag,rng)
                        T+=1
                        if won: W+=1
        out[nm]=round(100*W/T,1)
    out["gap"]=round(out["careful"]-out["casual"],1); m.REPLY_W=old
    return out
RES={}
print("bodies carrying +1 weight ->     0         1         2         3         4         5", flush=True)
for k in (0,3,6):
    cs=[cell(rules(k,n)) for n in range(6)]
    RES[f"{k} abilities, reads 8"]={str(n):c for n,c in enumerate(cs)}
    print(f"  {k} abilities careful   " + "".join(f"{c['careful']:>10.1f}" for c in cs), flush=True)
    print(f"{'':<16}gap       " + "".join(f"{c['gap']:>10.1f}" for c in cs), flush=True)
print("\n=== and the fine dial on top: 6 abilities, 1 dignified body, varying depth ===", flush=True)
for rw in (0,8,12,24):
    c=cell(rules(6,1),rw=rw); RES[f"6 abilities, 1 dignified, reads {rw}"]=c
    print(f"  reads {rw:>2}:  careful {c['careful']:5.1f}  casual {c['casual']:5.1f}  gap {c['gap']:5.1f}", flush=True)
json.dump(RES,open("/home/claude/dignity.json","w"),indent=1)
print("DONE", flush=True)
