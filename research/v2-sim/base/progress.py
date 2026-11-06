"""Starter twelve: what does the progression runway look like if levelling grants
abilities rather than numbers? Numbers frozen at L3-equivalent; abilities unlock one by one."""
import random, statistics, json
import manzil_sim_cur as m
from drawlib import SIGS, ALL28
BEST12=[6,10,17,18,5,14,4,3,19,7,26,12]
SIGS_IN_12=[c for c in BEST12 if c in SIGS]          # storm, throne, crown, heart, blaze, jewel
print("signature cards in the starter twelve:", [m.POOL[c-1][0] for c in SIGS_IN_12], flush=True)

def rules(numlvl, k):
    """numbers at `numlvl`, abilities awake for the first k signature cards in the twelve."""
    awake=set(SIGS_IN_12[:k]); o={}
    for c in ALL28:
        ab = SIGS.get(c) if c in awake else None
        o[c]=(numlvl, ab)
    return m.Rules(owned=o)

def cell(R,pool,reps=8):
    out={}
    for ag,nm in ((m.player_2ply,"careful"),(m.player_1ply,"casual")):
        W=T=0; CB=[]; MG=[]
        for sd in (11,97):
            rng=random.Random(sd)
            for t in range(1,29):
                for ld in (True,False):
                    for _ in range(reps):
                        hand=rng.sample(pool,5)
                        won,y,s=m.play_board(R,hand,t,ld,ag,rng)
                        T+=1; MG.append(abs(y-s))
                        if won: W+=1
        out[nm]=dict(win=round(100*W/T,1), margin=round(statistics.mean(MG),2), n=T)
    out["gap"]=round(out["careful"]["win"]-out["casual"]["win"],1)
    return out

RES={}
print("\n=== the current ladder: what each level is actually worth ===", flush=True)
for lvl,tag in ((1,"L1 base numbers, no ability"),(2,"L2 base numbers, ability"),
                (3,"L3 +1 low face, ability"),(4,"L4 +1 both, ability")):
    r=cell(rules(lvl, 6), BEST12); RES[tag]=r
    print(f"  {tag:<32} careful {r['careful']['win']:5.1f}  casual {r['casual']['win']:5.1f}  gap {r['gap']:5.1f}", flush=True)

print("\n=== if numbers are frozen at L3 and only abilities unlock ===", flush=True)
for k in range(0,7):
    r=cell(rules(3,k), BEST12); RES[f"flat L3 numbers, {k} of 6 abilities awake"]=r
    print(f"  {k} of 6 abilities awake              careful {r['careful']['win']:5.1f}  casual {r['casual']['win']:5.1f}  gap {r['gap']:5.1f}  margin {r['careful']['margin']:4.2f}", flush=True)

print("\n=== same, but frozen at base numbers (L2 equivalent) ===", flush=True)
for k in (0,3,6):
    r=cell(rules(2,k), BEST12); RES[f"flat base numbers, {k} of 6 abilities awake"]=r
    print(f"  {k} of 6 abilities awake              careful {r['careful']['win']:5.1f}  casual {r['casual']['win']:5.1f}  gap {r['gap']:5.1f}", flush=True)
json.dump(RES,open("/home/claude/progress.json","w"),indent=1)
print("DONE", flush=True)
