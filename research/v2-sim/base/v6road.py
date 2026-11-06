"""The real walkers' road: eight walker hands at their coded reply weights, then the sky."""
import random, json, statistics, time
import manzil_v6 as v
C=v.Cards(own_all=True); T0=time.time()
TWELVE=[5,6,10,17,18,16,15,13,19,23,24,4]
RUNGS=[([201,202,208,211,227],3),([203,207,212,219,222],4),([204,214,213,226,216],5),
       ([205,209,217,223,225],6),([202,210,216,220,228],7),([206,215,218,210,220],8),
       ([201,213,219,224,226],9),([206,215,218,221,224],11)]
def cell(sky_hand, rw, pack=TWELVE, reps=6):
    old=v.REPLY_W; v.REPLY_W=rw; out={}
    for nm,ag in (("careful",v.player_2ply),("casual",v.player_1ply)):
        W=T=0; F=[]
        for sd in (11,97):
            rng=random.Random(sd)
            for t in range(1,29):
                for ld in (True,False):
                    for _ in range(reps):
                        fl=[]
                        won,_,_=v.play_board(C,v.deal(pack,t,rng),t,ld,ag,rng,
                                             sky_hand=sky_hand,flip_log=fl)
                        T+=1; F.append(sum(fl))
                        if won: W+=1
        out[nm]=round(100*W/T,1); out[nm+"_flips"]=round(statistics.mean(F),2)
    out["gap"]=round(out["careful"]-out["casual"],1); out["n"]=T
    v.REPLY_W=old
    return out
R={}
print("=== the walkers' road as coded: eight walker hands, then the sky ===", flush=True)
print("  (player carries a pack of twelve, five dealt)", flush=True)
for n,(hand,rw) in enumerate(RUNGS,1):
    r=cell(hand,rw); R[f"rung {n}"]=dict(r,reads=rw)
    print(f"  rung {n} (reads {rw:>2})   careful {r['careful']:5.1f}  casual {r['casual']:5.1f}  gap {r['gap']:5.1f}  flips {r['careful_flips']:4.2f}   [{time.time()-T0:4.0f}s]", flush=True)
r=cell(list(v.SKY_HAND),14); R["rung 9 the sky"]=dict(r,reads=14)
print(f"  rung 9: the sky (reads 14)  careful {r['careful']:5.1f}  casual {r['casual']:5.1f}  gap {r['gap']:5.1f}", flush=True)
json.dump(R,open("/home/claude/v6-road.json","w"),indent=1)
print("DONE %.0fs"%(time.time()-T0), flush=True)
