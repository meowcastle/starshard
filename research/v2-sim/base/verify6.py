"""Verification: replicate the headline row on a third and fourth seed at larger n,
and probe flip density under the dealt five."""
import random, json, statistics, time
import manzil_sim_cur as m
from drawlib import SIGS, ALL28
OUT="/home/claude/verify6.json"; RES={}; T0=time.time()
def save(): json.dump(RES,open(OUT,"w"),indent=1)
def all_owned(lvl): return {cid:(lvl,SIGS.get(cid)) for cid in ALL28}
BEST12=[6,10,17,18,5,14,4,3,19,7,26,12]

def run(label,R,pool,seeds,reps=10):
    out={}
    for ag,nm in ((m.player_2ply,"careful"),(m.player_1ply,"casual")):
        per_seed=[]; F=[]
        for sd in seeds:
            rng=random.Random(sd); W=T=0
            for tonight in range(1,29):
                for lead in (True,False):
                    for _ in range(reps):
                        fl=[]; hand=rng.sample(pool,5)
                        won,_,_=m.play_board(R,hand,tonight,lead,ag,rng,flip_log=fl)
                        T+=1; F.append(sum(fl))
                        if won: W+=1
            per_seed.append(100*W/T)
        out[nm]=dict(mean=round(statistics.mean(per_seed),1),
                     per_seed=[round(x,1) for x in per_seed],
                     spread=round(max(per_seed)-min(per_seed),1),
                     flips=round(statistics.mean(F),2), n_per_seed=T)
    out["skill_gap"]=round(out["careful"]["mean"]-out["casual"]["mean"],1)
    RES[label]=out; save()
    print(f"  {label:<44} careful {out['careful']['mean']:5.1f} {out['careful']['per_seed']}  "
          f"casual {out['casual']['mean']:5.1f}  gap {out['skill_gap']:5.1f}  flips {out['careful']['flips']:4.2f}", flush=True)

print("=== V. four-seed replication of the headline row ===", flush=True)
R3=m.Rules(owned=all_owned(3))
run("dealt five of 12 @L3 (4 seeds)", R3, BEST12, (11,97,404,7919))
run("shipped fixed five (4 seeds)", m.Rules(owned=m.PROTO_OWNED), None, (11,97,404,7919)) if False else None
# shipped control needs a fixed hand, run separately
out={}
for ag,nm in ((m.player_2ply,"careful"),(m.player_1ply,"casual")):
    ps=[]; F=[]
    Rp=m.Rules(owned=m.PROTO_OWNED)
    for sd in (11,97,404,7919):
        rng=random.Random(sd); W=T=0
        for tonight in range(1,29):
            for lead in (True,False):
                for _ in range(10):
                    fl=[]
                    won,_,_=m.play_board(Rp,list(m.DEFAULT_FIVE),tonight,lead,ag,rng,flip_log=fl)
                    T+=1; F.append(sum(fl))
                    if won: W+=1
        ps.append(100*W/T)
    out[nm]=dict(mean=round(statistics.mean(ps),1), per_seed=[round(x,1) for x in ps],
                 spread=round(max(ps)-min(ps),1), flips=round(statistics.mean(F),2))
out["skill_gap"]=round(out["careful"]["mean"]-out["casual"]["mean"],1)
RES["shipped control (4 seeds)"]=out; save()
print(f"  {'shipped control (4 seeds)':<44} careful {out['careful']['mean']:5.1f} {out['careful']['per_seed']}  casual {out['casual']['mean']:5.1f}  gap {out['skill_gap']:5.1f}  flips {out['careful']['flips']:4.2f}", flush=True)

print("=== W. flip density under the dealt five ===", flush=True)
for tag,setter in (("shipped rules", lambda: None),
                   ("tie goes to sky", lambda: setattr(m,"TIERULE","sky")),
                   ("Storm off", lambda: setattr(m,"STORM_MODE","off")),
                   ("Storm strikes +1", lambda: (setattr(m,"STORM_MODE","off"), setattr(m,"STORM_STRIKE",True)))):
    old=(m.TIERULE,m.STORM_MODE,m.STORM_STRIKE)
    setter()
    run(f"dealt five of 12 @L3, {tag}", R3, BEST12, (11,97), reps=8)
    m.TIERULE,m.STORM_MODE,m.STORM_STRIKE=old
print("VERIFY DONE %.0fs"%(time.time()-T0), flush=True)
