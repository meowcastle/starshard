"""Where the core loop stands on the 22 Aug build."""
import random, json, statistics, time
import manzil_v6 as v
T0=time.time(); RES={}
def save(): json.dump(RES,open("/home/claude/v6-results.json","w"),indent=1)
C=v.Cards(own_all=True)
CHART5=[5,6,10,17,18]
# a twelve: the chart five plus seven the measured slate liked
TWELVE=[5,6,10,17,18,16,15,13,19,23,24,4]
ALL28=list(range(1,29))

def cell(pack, rw=8, reps=6, seeds=(11,97), agents=("careful","casual"), guarantee=True):
    old=v.REPLY_W; v.REPLY_W=rw; out={}
    for nm in agents:
        ag = v.player_2ply if nm=="careful" else v.player_1ply
        W=T=0; F=[]; MG=[]; CB=[]; CL=[]
        for sd in seeds:
            rng=random.Random(sd)
            for t in range(1,29):
                for ld in (True,False):
                    for _ in range(reps):
                        hand=v.deal(pack,t,rng,guarantee)
                        fl=[]
                        won,y,s=v.play_board(C,hand,t,ld,ag,rng,flip_log=fl)
                        T+=1; F.append(sum(fl)); MG.append(abs(y-s)); CL.append(abs(y-s)<=1)
                        if won: W+=1
        out[nm]=dict(win=round(100*W/T,1),flips=round(statistics.mean(F),2),
                     margin=round(statistics.mean(MG),2),close=round(100*statistics.mean(CL),1),n=T)
    if len(agents)==2: out["gap"]=round(out["careful"]["win"]-out["casual"]["win"],1)
    v.REPLY_W=old
    return out

def show(label,r):
    c=r["careful"]
    line=f"  {label:<40} careful {c['win']:5.1f}"
    if "casual" in r: line+=f"  casual {r['casual']['win']:5.1f}  gap {r['gap']:5.1f}"
    line+=f"  flips {c['flips']:4.2f}  margin {c['margin']:4.2f}  close {c['close']:4.1f}%"
    print(line+f"   [{time.time()-T0:5.0f}s]", flush=True)

print("=== 1. the core loop, as deployed (reads 8) ===", flush=True)
for lab,pack in (("pack of 5 (default chart five)",CHART5),("pack of 12",TWELVE),("pack of 28 (own everything)",ALL28)):
    r=cell(pack); RES[f"core: {lab}"]=r; show(lab,r)
print("  target band: careful 55-65 · casual 35-45 · skill gap 20+", flush=True)

print("\n=== 2. does the moon guarantee matter? (pack of 12) ===", flush=True)
for g in (True,False):
    r=cell(TWELVE,guarantee=g); RES[f"guarantee={g}"]=r; show(f"tonight's mansion guaranteed: {g}",r)

print("\n=== 3. the walkers' road ladder, as coded [3,4,5,6,7,8,9,11] then boss 14 ===", flush=True)
for rw in (3,4,5,6,7,8,9,11,12,14):
    r=cell(TWELVE,rw=rw,reps=4); RES[f"ladder reads {rw}"]=r
    tag = {12:" (nightSky)",14:" (roadBoss)"}.get(rw,"")
    show(f"she reads {rw}{tag}",r)
save()
print("DONE %.0fs"%(time.time()-T0), flush=True)
