"""Two curves, not one. Player power (abilities awake) vs sky difficulty (tier).
Find the diagonal that holds the experienced win rate flat while the skill gap grows."""
import random, statistics, json
import manzil_sim_cur as m
from drawlib import SIGS, ALL28
BEST12=[6,10,17,18,5,14,4,3,19,7,26,12]
SIGS_IN_12=[c for c in BEST12 if c in SIGS]

def rules(k, numlvl=3):
    awake=set(SIGS_IN_12[:k])
    return m.Rules(owned={c:(numlvl, SIGS.get(c) if c in awake else None) for c in ALL28})

# sky difficulty tiers: (label, reply weight, tie rule, leads)
TIERS=[("T0 soft: reads 1 ahead",      6,  "you", "both"),
       ("T1 shipped: reads 8",         8,  "you", "both"),
       ("T2 reads 12",                12,  "you", "both"),
       ("T3 reads 12, she leads",     12,  "you", "sky"),
       ("T4 reads 12, ties to her",   12,  "sky", "both"),
       ("T5 reads 12, ties, she leads",12, "sky", "sky")]

def cell(R, rw, tr, leads, reps=6):
    old=(m.REPLY_W, m.TIERULE); m.REPLY_W, m.TIERULE = rw, tr
    out={}
    for ag,nm in ((m.player_2ply,"careful"),(m.player_1ply,"casual")):
        W=T=0; MG=[]
        for sd in (11,97):
            rng=random.Random(sd)
            for t in range(1,29):
                lds = (True,False) if leads=="both" else (False,)
                for ld in lds:
                    for _ in range(reps if leads=="both" else reps*2):
                        hand=rng.sample(BEST12,5)
                        won,y,s=m.play_board(R,hand,t,ld,ag,rng)
                        T+=1; MG.append(abs(y-s))
                        if won: W+=1
        out[nm]=round(100*W/T,1)
    out["gap"]=round(out["careful"]-out["casual"],1); out["n"]=T
    m.REPLY_W, m.TIERULE = old
    return out

RES={}
print(f"{'':<32}" + "".join(f"{lab.split(':')[0]:>12}" for lab,_,_,_ in TIERS), flush=True)
for k in (0,2,4,6):
    R=rules(k); row={}
    cells=[]
    for lab,rw,tr,ld in TIERS:
        c=cell(R,rw,tr,ld); row[lab]=c; cells.append(c)
    RES[f"{k} of 6 abilities awake"]=row
    print(f"  {k} abilities  careful   " + "".join(f"{c['careful']:>12.1f}" for c in cells), flush=True)
    print(f"{'':<16}gap       " + "".join(f"{c['gap']:>12.1f}" for c in cells), flush=True)
json.dump(RES,open("/home/claude/scaling.json","w"),indent=1)
print("DONE", flush=True)
