"""Measure the 28 signatures: aggregate balance, then each card's individual worth,
so wrong-signed ones are caught before anyone builds them."""
import random, json, statistics, sys
import manzil_sim_cur as m
import sig28
from drawlib import ALL28
BEST12=[6,10,17,18,5,14,4,3,19,7,26,12]
PLAIN12=[c for c in ALL28 if c not in (5,6,10,14,17,18,25)][:12]

def measure(R, pool, rw=8, reps=6, seeds=(11,97)):
    old=m.REPLY_W; m.REPLY_W=rw; out={}
    for ag,nm in ((m.player_2ply,"careful"),(m.player_1ply,"casual")):
        W=T=0; F=[]; MG=[]
        for sd in seeds:
            rng=random.Random(sd)
            for t in range(1,29):
                for ld in (True,False):
                    for _ in range(reps):
                        fl=[]
                        won,y,s=m.play_board(R,rng.sample(pool,5),t,ld,ag,rng,flip_log=fl)
                        T+=1; F.append(sum(fl)); MG.append(abs(y-s))
                        if won: W+=1
        out[nm]=dict(win=round(100*W/T,1),flips=round(statistics.mean(F),2),
                     margin=round(statistics.mean(MG),2),n=T)
    out["gap"]=round(out["careful"]["win"]-out["casual"]["win"],1); m.REPLY_W=old
    return out

RES={}
print("=== A. aggregate: all 28 signed, real signatures ===", flush=True)
sig28.install()
R28=m.Rules(owned=sig28.owned28(3))
for rw in (8,12,16):
    r=measure(R28,BEST12,rw); RES[f"all28 real sigs, BEST12, reads {rw}"]=r
    print(f"  BEST12,  reads {rw:>2}   careful {r['careful']['win']:5.1f}  casual {r['casual']['win']:5.1f}  gap {r['gap']:5.1f}  flips {r['careful']['flips']:4.2f}  margin {r['careful']['margin']:4.2f}", flush=True)
for rw in (8,12):
    r=measure(R28,PLAIN12,rw); RES[f"all28 real sigs, PLAIN12, reads {rw}"]=r
    print(f"  PLAIN12, reads {rw:>2}   careful {r['careful']['win']:5.1f}  casual {r['casual']['win']:5.1f}  gap {r['gap']:5.1f}  flips {r['careful']['flips']:4.2f}", flush=True)
r=measure(R28,ALL28,8); RES["all28 real sigs, full 28 pool, reads 8"]=r
print(f"  all 28,  reads  8   careful {r['careful']['win']:5.1f}  casual {r['casual']['win']:5.1f}  gap {r['gap']:5.1f}", flush=True)
sig28.uninstall()
print("  (reference) today's 7 sigs, BEST12, reads 8: careful 60.4  casual 37.8  gap 22.6", flush=True)

print("\n=== B. what each signature is worth (card forced into every hand, sig on vs off) ===", flush=True)
sig28.install()
def worth(cid, reps=5):
    """force cid into the hand; measure with its signature live vs silenced."""
    out=[]
    for off in (False, True):
        o=sig28.owned28(3)
        if off: o[cid]=(3,None)
        R=m.Rules(owned=o)
        W=T=0
        for sd in (11,97):
            rng=random.Random(sd)
            for t in range(1,29):
                for ld in (True,False):
                    for _ in range(reps):
                        hand=rng.sample([c for c in ALL28 if c!=cid],4)+[cid]
                        won,_,_=m.play_board(R,hand,t,ld,m.player_2ply,rng)
                        T+=1
                        if won: W+=1
        out.append(100*W/T)
    return out[0]-out[1], out[0], out[1]
rows=[]
for cid in range(1,29):
    d,on,offv=worth(cid)
    rows.append((d,cid,m.POOL[cid-1][0],sig28.SIG28[cid],on,offv))
    print(f"  {m.POOL[cid-1][0]:<20} {sig28.SIG28[cid]:<10} {d:+6.1f}  (on {on:.1f} / off {offv:.1f})", flush=True)
rows.sort()
RES["per-signature worth"]=[{"card":n,"sig":s,"delta":round(d,1),"on":round(o,1),"off":round(f,1)} for d,c,n,s,o,f in rows]
print("\n  weakest five:", ", ".join(f"{n} ({d:+.1f})" for d,c,n,s,o,f in rows[:5]), flush=True)
print("  strongest five:", ", ".join(f"{n} ({d:+.1f})" for d,c,n,s,o,f in rows[-5:]), flush=True)
sig28.uninstall()
json.dump(RES,open("/home/claude/sigtest.json","w"),indent=1)
print("DONE", flush=True)
