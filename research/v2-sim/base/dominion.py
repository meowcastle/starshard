"""1) Is a deepened dominion enough to make a signature-less card worth drafting?
   2) Can the loop functionally carry a signature on all 28?
   3) Does drafting for tonight's road beat drafting once?"""
import random, json, statistics
import manzil_sim_cur as m
from drawlib import ALL28
SIG7={5:"blaze",6:"storm",10:"throne",17:"crown",18:"heart",14:"jewel",25:"hideaway"}
# a spread for the "all 28" test: throne kept rare (it doubles the move space)
SPREAD=["storm","crown","heart","blaze","jewel","hideaway"]
ALL28_SIGS={c: (SIG7[c] if c in SIG7 else SPREAD[c % len(SPREAD)]) for c in ALL28}
BEST12=[6,10,17,18,5,14,4,3,19,7,26,12]
PLAIN12=[c for c in ALL28 if c not in SIG7][:12]        # twelve cards with no signature at all

_orig=m.counts
def deep_counts(R, board, tonight):
    you=sky=0
    for i,s in enumerate(board):
        if s is None: continue
        c=R.cards[s[0]]
        w=1+(1 if c["ab"]=="jupiter" else 0)
        if R.dominion and c["home"]==((tonight-1+i)%28)+1:
            w += 2 if c["ab"] is None else 1      # a mansion with no signature is stronger at home
        if c["ab"]=="crown" and i in (0,8): w+=1
        if s[3]==0 or s[4]: you+=w
        else: sky+=w
    return you,sky

def rules(mode):
    if mode=="today":   o={c:(3, SIG7.get(c)) for c in ALL28}
    elif mode=="all28": o={c:(3, ALL28_SIGS[c]) for c in ALL28}
    elif mode=="none":  o={c:(3, None) for c in ALL28}
    return m.Rules(owned=o)

def run(label, R, poolfn, deep=False, reps=5):
    m.counts = deep_counts if deep else _orig
    out={}
    for ag,nm in ((m.player_2ply,"careful"),(m.player_1ply,"casual")):
        W=T=0; MG=[]
        for sd in (11,97):
            rng=random.Random(sd)
            for t in range(1,29):
                pool=poolfn(t)
                for ld in (True,False):
                    for _ in range(reps):
                        won,y,s=m.play_board(R,rng.sample(pool,5),t,ld,ag,rng)
                        T+=1; MG.append(abs(y-s))
                        if won: W+=1
        out[nm]=dict(win=round(100*W/T,1), margin=round(statistics.mean(MG),2), n=T)
    out["gap"]=round(out["careful"]["win"]-out["casual"]["win"],1)
    m.counts=_orig
    RES[label]=out
    print(f"  {label:<52} careful {out['careful']['win']:5.1f}  casual {out['casual']['win']:5.1f}  gap {out['gap']:5.1f}  margin {out['careful']['margin']:4.2f}", flush=True)
    return out

def road_twelve(t):
    road=[((t-1+i)%28)+1 for i in range(9)]
    rest=sorted([c for c in ALL28 if c not in road], key=lambda c:-(m.POOL[c-1][1]+m.POOL[c-1][2]))
    return road+rest[:3]

RES={}
print("=== 1. does a deepened dominion make signature-less cards draftable? ===", flush=True)
print("  (PLAIN12 = twelve mansions that have no signature at all)", flush=True)
run("PLAIN12, dominion as today",          rules("today"), lambda t: PLAIN12, deep=False)
run("PLAIN12, deepened dominion",          rules("today"), lambda t: PLAIN12, deep=True)
run("BEST12 (six signatures), as today",   rules("today"), lambda t: BEST12,  deep=False)
run("BEST12, deepened dominion",           rules("today"), lambda t: BEST12,  deep=True)

print("\n=== 2. can the loop carry a signature on all 28? ===", flush=True)
run("all 28 have a signature, BEST12",     rules("all28"), lambda t: BEST12,  deep=False)
run("all 28 have a signature, PLAIN12",    rules("all28"), lambda t: PLAIN12, deep=False)
run("no card has a signature (floor)",     rules("none"),  lambda t: BEST12,  deep=False)

print("\n=== 3. is drafting for tonight's road a real decision? ===", flush=True)
run("fixed twelve, signatures as today",   rules("today"), lambda t: BEST12,      deep=False)
run("drafted for tonight's road, as today",rules("today"), lambda t: road_twelve(t), deep=False)
run("fixed twelve, deepened dominion",     rules("today"), lambda t: BEST12,      deep=True)
run("drafted for tonight, deep dominion",  rules("today"), lambda t: road_twelve(t), deep=True)
run("drafted for tonight, all 28 signed",  rules("all28"), lambda t: road_twelve(t), deep=False)
json.dump(RES,open("/home/claude/dominion.json","w"),indent=1)
print("DONE", flush=True)
