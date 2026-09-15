import sys; sys.argv=['x','m24plain.out']; exec(open('shape.py').read().split('P=parse')[0])
def row(pf,lf,name):
    P=parse(pf); L=parse(lf); po,lo,psp,lsp,topd,botd,rot,v=shape(P,L)
    print(f"{name:34s} seat {L['fresh_seat']-P['fresh_seat']:+5.1f} / {L['deep_seat']-P['deep_seat']:+5.1f}   skill {L['fresh_skill']-P['fresh_skill']:+5.1f}/{L['deep_skill']-P['deep_skill']:+5.1f}   spread {psp:.1f}->{lsp:.1f} ({lsp-psp:+.1f})   "+"  ".join(f"{q[:3]}{L[q]-P[q]:+.1f}" for q in Q)+f"   {v}")
import glob,os
for win,pf in [("door",'m24plain.out'),("slid",'m24plain_slid.out')]:
    P=parse(pf); print(f"\n== {win} plain: seat {P['fresh_seat']:+.1f}/{P['deep_seat']:+.1f} skill {P['fresh_skill']:+.1f}/{P['deep_skill']:+.1f} "+"  ".join(f"{q[:3]} {P[q]:.1f}" for q in Q))
    for lf in ['void_right','void_best','eye_m24','price_m24','voideye']:
        f=f"{lf}_{win}.out"
        if os.path.exists(f) and 'genbu' in open(f).read(): row(pf,f,lf)
