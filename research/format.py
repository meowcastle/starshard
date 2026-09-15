# The live format: rungs 0-3 single boards, 4-7 best of three, rung 8 (the mansion) best of five.
# Three lanterns; a lost rung costs one and is retried. Clear = the mansion won before the third loss.
# Storm's night: every rung best of three, two lanterns.
from fractions import Fraction
def bo(p,n):
    if n==1: return p
    if n==3: return p*p*(3-2*p)
    if n==5: return p**3*(10-15*p+6*p*p)
def exp_boards(p,n):
    if n==1: return 1.0
    if n==3: return 2+2*p*(1-p)
    if n==5: return 3+ 3*p*(1-p)*(1+ 2*p*(1-p)) if False else (3 + 3*(p*(1-p))*1 + 0)  # placeholder, replaced below
def eb5(p):
    q=1-p; return 3*(p**3+q**3) + 4*(3*p**3*q+3*q**3*p) + 5*(6*p**3*q*q+6*q**3*p*p)
def eb3(p):
    q=1-p; return 2*(p*p+q*q)+3*(2*p*p*q+2*q*q*p)
def climb(p, rungs, lives):
    # state: (rung k, losses f). DP over probability mass.
    from collections import defaultdict
    dist={(0,0):1.0}; clear=0.0; wipes=[0.0]*len(rungs); boards=0.0; lost=0.0
    while dist:
        nd=defaultdict(float)
        for (k,f),m in dist.items():
            n=rungs[k]; q=bo(p,n); eb = 1.0 if n==1 else (eb3(p) if n==3 else eb5(p))
            boards+=m*eb
            if k==len(rungs)-1: clear+=m*q
            else: nd[(k+1,f)]+=m*q
            lost+=m*(1-q)
            if f+1>=lives: wipes[k]+=m*(1-q)
            else: nd[(k,f+1)]+=m*(1-q)
        dist=nd
    return clear, boards, lost, wipes
LIVE=[1,1,1,1,3,3,3,3,5]; STORM=[3]*9
print("THE LIVE FORMAT: 4 singles, 4 best-of-three, best-of-five; three lanterns, a lost rung is retried.")
print("  p(board)   P(clear)   E[boards]   E[lanterns lost]   wipes: singles / bo3 / mansion")
for i in range(0,8):
    p=0.50+0.05*i; c,b,l,w=climb(p,LIVE,3)
    print(f"   {p:.2f}      {100*c:5.1f}%     {b:5.1f}         {l:4.2f}            {100*sum(w[:4]):4.1f}% / {100*sum(w[4:8]):4.1f}% / {100*w[8]:4.1f}%")
print("\nTHE STORM'S FORMAT: nine best-of-threes, two lanterns.")
print("  p(board)   P(clear)   E[boards]   E[lanterns lost]   wipes: rungs 1-4 / 5-8 / mansion")
for i in range(0,8):
    p=0.50+0.05*i; c,b,l,w=climb(p,STORM,2)
    print(f"   {p:.2f}      {100*c:5.1f}%     {b:5.1f}         {l:4.2f}            {100*sum(w[:4]):4.1f}% / {100*sum(w[4:8]):4.1f}% / {100*w[8]:4.1f}%")
print("\nTHE BOARD WIN RATE A CLEAR RATE NEEDS (live format):")
import bisect
ps=[i/1000 for i in range(400,1000)]
cs=[climb(p,LIVE,3)[0] for p in ps]
for target in (0.10,0.25,0.33,0.50,0.75,0.90):
    j=bisect.bisect_left(cs,target); print(f"   clear {int(target*100):2d}%  needs p = {ps[j]:.3f}")
print("\nFor reference: the measured fresh board win rate on the reference (both careful, player leads / she leads) runs 41-56% by night; the mirror at exact 50% gives:")
c,b,l,w=climb(0.5,LIVE,3); print(f"   p=0.50: clear {100*c:.1f}%, {b:.1f} boards, wipes singles {100*sum(w[:4]):.0f}%")
