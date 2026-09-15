import sys; exec(open('shape.py').read().split('P=parse')[0])
import os
def row(pf,lf,name):
    P=parse(pf); L=parse(lf); po,lo,psp,lsp,topd,botd,rot,v=shape(P,L)
    print(f"{name:26s} seat {L['fresh_seat']-P['fresh_seat']:+5.1f} / {L['deep_seat']-P['deep_seat']:+5.1f}   skill {L['fresh_skill']-P['fresh_skill']:+5.1f}/{L['deep_skill']-P['deep_skill']:+5.1f}   spread {psp:.1f}->{lsp:.1f} ({lsp-psp:+.1f})   "+"  ".join(f"{q[:3]}{L[q]-P[q]:+.1f}" for q in Q)+f"   {v}")
for win,pf in [("standard (m9 at the door)",'m9plain.out'),("slid = m5's road (m9 at the middle)",'m5plain.out')]:
    P=parse(pf); print(f"\n== {win} plain: seat {P['fresh_seat']:+.1f}/{P['deep_seat']:+.1f} skill {P['fresh_skill']:+.1f}/{P['deep_skill']:+.1f} "+"  ".join(f"{q[:3]} {P[q]:.1f}" for q in Q)+f"   spread {max(P[q] for q in Q)-min(P[q] for q in Q):.1f}")
for lf in ['glance_both','glance_door','glance_both_raw','glance_door_raw','ill1','ill2','price_m9']:
    row('m9plain.out',lf+'.out',lf)
print("\nthe price on the same station under m5's moon (softshield.out v m5plain.out):"); row('m5plain.out','softshield.out','price_m5 (home)')
