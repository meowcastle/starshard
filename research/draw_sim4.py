import random, json, statistics, time
import manzil_sim_cur as m
from drawlib import SIGS, ALL28
from nightrules import NIGHT_RULES, apply_rule, restore
OUT="/home/claude/draw4-results.json"; RES={}; T0=time.time()
def save(): json.dump(RES,open(OUT,"w"),indent=1)
Rp=m.Rules(owned=m.PROTO_OWNED)
print("=== L. do rotating night rules keep the skill gap? (fixed chart five) ===", flush=True)
for tag, fn in (("shipped: one rule",      lambda t: dict()),
                ("7 rules rotating",       lambda t: NIGHT_RULES[t % 7][1]),
                ("28 rules (7 x 4 phases)",lambda t: NIGHT_RULES[(t*3) % 7][1])):
    out={}
    for ag,nm in ((m.player_2ply,"careful"),(m.player_1ply,"casual")):
        W=T=0; per={}; F=[]
        for sd in (11,97):
            rng=random.Random(sd)
            for tonight in range(1,29):
                old=apply_rule(fn(tonight)); nw=nt=0
                for lead in (True,False):
                    for _ in range(8):
                        fl=[]
                        won,_,_=m.play_board(Rp,list(m.DEFAULT_FIVE),tonight,lead,ag,rng,flip_log=fl)
                        T+=1;nt+=1; F.append(sum(fl))
                        if won: W+=1;nw+=1
                restore(old); per.setdefault(tonight,[]).append(nw/nt)
        pn=[statistics.mean(v) for v in per.values()]
        out[nm]=dict(win=round(100*W/T,1), flips=round(statistics.mean(F),2),
                     night_sd=round(100*statistics.pstdev(pn),1),
                     night_min=round(100*min(pn),1), night_max=round(100*max(pn),1), n=T)
    out["skill_gap"]=round(out["careful"]["win"]-out["casual"]["win"],1)
    RES[tag]=out; save()
    print(f"  {tag:<26} careful {out['careful']['win']:5.1f}  casual {out['casual']['win']:5.1f}  "
          f"gap {out['skill_gap']:5.1f}  flips {out['careful']['flips']:4.2f}  night-sd {out['careful']['night_sd']:4.1f} "
          f" (nights {out['careful']['night_min']:.0f}-{out['careful']['night_max']:.0f}%)", flush=True)
print("PHASE 4 DONE %.0fs"%(time.time()-T0), flush=True)
