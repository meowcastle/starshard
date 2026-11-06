"""All 28 signed runs ~10 points hot. Does the reading-depth dial bring it back into band,
and does the board stay legible (flips, margin, comebacks)?"""
import random, json, statistics
import manzil_sim_cur as m
from drawlib import ALL28
SIG7={5:"blaze",6:"storm",10:"throne",17:"crown",18:"heart",14:"jewel",25:"hideaway"}
SPREAD=["storm","crown","heart","blaze","jewel","hideaway"]
A28={c:(SIG7[c] if c in SIG7 else SPREAD[c%len(SPREAD)]) for c in ALL28}
BEST12=[6,10,17,18,5,14,4,3,19,7,26,12]
PLAIN12=[c for c in ALL28 if c not in SIG7][:12]

def board(R,hand,t,ld,ag,rng):
    b=tuple([None]*9); h=tuple(hand); sky=tuple(m.SKY_HAND); you=ld; tr=[]; fl=0
    while any(s is None for s in b):
        if you:
            if not h: you=False; continue
            cid,i,rev=ag(R,b,h,sky,t,rng); b,n=m.resolve(R,b,cid,i,rev,None,t); h=tuple(x for x in h if x!=cid)
        else:
            if not sky: you=True; continue
            cid,i,rev=m.sky_move(R,b,sky,h,t); b,n=m.resolve(R,b,cid,i,rev,None,t); sky=tuple(x for x in sky if x!=cid)
        fl+=n; y,s=m.counts(R,b,t); tr.append(y-s); you=not you
    y,s=m.counts(R,b,t); won=y>s or (y==s and m.TIERULE=="you")
    at6=tr[5] if len(tr)>5 else 0
    return won, fl, abs(y-s), (won and at6<0) or ((not won) and at6>0)

def run(label, owned, pool, rw, reps=6):
    old=m.REPLY_W; m.REPLY_W=rw
    R=m.Rules(owned=owned); out={}
    for ag,nm in ((m.player_2ply,"careful"),(m.player_1ply,"casual")):
        W=T=0; F=[];MG=[];CB=[]
        for sd in (11,97):
            rng=random.Random(sd)
            for t in range(1,29):
                for ld in (True,False):
                    for _ in range(reps):
                        w,fl,mg,cb=board(R,rng.sample(pool,5),t,ld,ag,rng)
                        T+=1;F.append(fl);MG.append(mg);CB.append(cb)
                        if w: W+=1
        out[nm]=dict(win=round(100*W/T,1),flips=round(statistics.mean(F),2),
                     margin=round(statistics.mean(MG),2),comeback=round(100*statistics.mean(CB),1),n=T)
    out["gap"]=round(out["careful"]["win"]-out["casual"]["win"],1); m.REPLY_W=old
    RES[label]=out
    c=out["careful"]
    print(f"  {label:<46} careful {c['win']:5.1f}  casual {out['casual']['win']:5.1f}  gap {out['gap']:5.1f}  "
          f"flips {c['flips']:4.2f}  margin {c['margin']:4.2f}  comeback {c['comeback']:5.1f}%", flush=True)
RES={}
A28O={c:(3,A28[c]) for c in ALL28}
print("=== all 28 signed: bringing it back into band with her reading depth ===", flush=True)
for rw in (8,12,16,24):
    run(f"all 28 signed, BEST12, she reads {rw}", A28O, BEST12, rw)
print(flush=True)
for rw in (8,12):
    run(f"all 28 signed, PLAIN12, she reads {rw}", A28O, PLAIN12, rw)
print("\n=== reference rows ===", flush=True)
run("today's 7 signatures, BEST12, reads 8", {c:(3,SIG7.get(c)) for c in ALL28}, BEST12, 8)
json.dump(RES,open("/home/claude/confirm.json","w"),indent=1)
print("DONE", flush=True)
