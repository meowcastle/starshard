"""Drama proxies: lead changes, comebacks, final margin. Shipped vs the dealt five."""
import random, statistics, json
import manzil_sim_cur as m
from drawlib import SIGS, ALL28
BEST12=[6,10,17,18,5,14,4,3,19,7,26,12]
def all_owned(l): return {c:(l,SIGS.get(c)) for c in ALL28}

def board(R, hand, tonight, lead, ag, rng):
    b=tuple([None]*9); h=tuple(hand); sky=tuple(m.SKY_HAND); you=lead
    trace=[]; flips=0
    while any(s is None for s in b):
        if you:
            if not h: you=False; continue
            cid,i,rev=ag(R,b,h,sky,tonight,rng)
            b,nf=m.resolve(R,b,cid,i,rev,None,tonight); h=tuple(x for x in h if x!=cid)
        else:
            if not sky: you=True; continue
            cid,i,rev=m.sky_move(R,b,sky,h,tonight)
            b,nf=m.resolve(R,b,cid,i,rev,None,tonight); sky=tuple(x for x in sky if x!=cid)
        flips+=nf
        y,s=m.counts(R,b,tonight); trace.append(y-s)
        you=not you
    y,s=m.counts(R,b,tonight); won = y>s or (y==s and m.TIERULE=="you")
    sign=[(1 if d>0 else (-1 if d<0 else 0)) for d in trace]
    nz=[x for x in sign if x!=0]
    changes=sum(1 for a,bb in zip(nz,nz[1:]) if a!=bb)
    at6 = trace[5] if len(trace)>5 else 0
    comeback = (won and at6 < 0) or ((not won) and at6 > 0)
    return won, changes, comeback, abs(y-s), flips, (abs(trace[-1])<=1)

def run(label,R,pool,fixed=None,reps=8):
    out={}
    for ag,nm in ((m.player_2ply,"careful"),(m.player_1ply,"casual")):
        C=[];CB=[];MG=[];FL=[];CL=[]
        for sd in (11,97):
            rng=random.Random(sd)
            for t in range(1,29):
                for ld in (True,False):
                    for _ in range(reps):
                        hd = list(fixed) if fixed else rng.sample(pool,5)
                        w,c,cb,mg,fl,cl = board(R,hd,t,ld,ag,rng)
                        C.append(c);CB.append(cb);MG.append(mg);FL.append(fl);CL.append(cl)
        out[nm]=dict(lead_changes=round(statistics.mean(C),2),
                     comeback_pct=round(100*statistics.mean(CB),1),
                     margin=round(statistics.mean(MG),2),
                     close_pct=round(100*statistics.mean(CL),1),
                     flips=round(statistics.mean(FL),2), n=len(C))
    print(f"  {label:<40} lead-changes {out['careful']['lead_changes']:4.2f}  comeback {out['careful']['comeback_pct']:5.1f}%  "
          f"margin {out['careful']['margin']:4.2f}  close(<=1) {out['careful']['close_pct']:5.1f}%  flips {out['careful']['flips']:4.2f}", flush=True)
    return {label:out}
RES={}
print("=== drama proxies (careful play) ===", flush=True)
RES.update(run("shipped: fixed chart five", m.Rules(owned=m.PROTO_OWNED), None, fixed=m.DEFAULT_FIVE))
RES.update(run("dealt five of 12 @L3", m.Rules(owned=all_owned(3)), BEST12))
RES.update(run("dealt five of 12, proto levels", m.Rules(owned=m.PROTO_OWNED), BEST12))
RES.update(run("draw 3 from 28 (for contrast)", m.Rules(owned=all_owned(3)), ALL28))
json.dump(RES,open("/home/claude/drama.json","w"),indent=1)
print("DONE", flush=True)
