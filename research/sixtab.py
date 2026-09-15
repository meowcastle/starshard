import sys,re; exec(open('shape.py').read().split('P=parse')[0])
def door(fn):
    d={}
    for s in (l.strip() for l in open(fn)):
        m=re.match(r'(fresh|deep)\s+([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%',s)
        if m: d[m.group(1)]=[float(m.group(k)) for k in range(2,8)]
    return d
def plainrow(name,pf):
    P=parse(pf); D=door(pf); sp=max(P[q] for q in Q)-min(P[q] for q in Q)
    print(f"{name:28s} seat {P['fresh_seat']:+5.1f}/{P['deep_seat']:+5.1f}  skill {P['fresh_skill']:+5.1f}/{P['deep_skill']:+5.1f}  "+"  ".join(f"{q[:3]} {P[q]:.1f}" for q in Q)+f"  spread {sp:.1f}")
    for k in ('fresh','deep'):
        v=D[k]; print(f"    door {k:5s}  leader {v[0]:.1f}%  answerer {v[1]:.1f}%   bya {v[2]:.1f}  suz {v[3]:.1f}  sei {v[4]:.1f}  gen {v[5]:.1f}")
def lawrow(name,pf,lf):
    P=parse(pf); L=parse(lf); po,lo,psp,lsp,topd,botd,rot,v=shape(P,L)
    print(f"{name:28s} seat {L['fresh_seat']-P['fresh_seat']:+5.1f}/{L['deep_seat']-P['deep_seat']:+5.1f}  skill {L['fresh_skill']-P['fresh_skill']:+5.1f}/{L['deep_skill']-P['deep_skill']:+5.1f}  spread {psp:.1f}->{lsp:.1f} ({lsp-psp:+.1f})  "+"  ".join(f"{q[:3]}{L[q]-P[q]:+.1f}" for q in Q)+f"  {v}   [law abs: seat {L['fresh_seat']:+.1f}/{L['deep_seat']:+.1f} skill {L['fresh_skill']:+.1f}/{L['deep_skill']:+.1f}]")
print("=== THE STALE SIX, slid windows, 896")
for m,pf,lf,law in [(21,'m21plain_slid','hush_slid','the hush'),(23,'m23plain_slid','reson_slid','the reson'),(25,'m25plain_slid','shell_slid','the shell'),(28,'m28plain_slid','rope_slid','the rope'),(2,'m2plain_slid','toll_slid','the toll'),(19,'m19plain_slid','plant_slid','the plant')]:
    plainrow(f"m{m} plain (slid)",pf+'.out'); lawrow(f"m{m} {law}",pf+'.out',lf+'.out'); print()
print("=== PRE-SHEET: m13 the hand")
plainrow("m13 standard (m13..m21)","m13plain.out"); plainrow("m13 slid = m9's road","m9plain.out")
print("\n=== PRE-SHEET: m22 the listener")
plainrow("m22 standard (m22..m2)","m22plain.out"); plainrow("m22 slid (m18..m26)","m22plain_slid.out")
print("\n=== THE ILL ROAD SPLIT, m9 standard")
plainrow("m9 plain","m9plain.out"); plainrow("m9 ill road 1","ill1.out")
