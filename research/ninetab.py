import re; exec(open('shape.py').read().split('P=parse')[0])
def door(fn):
    d={}
    for s in (l.strip() for l in open(fn)):
        m=re.match(r'(fresh|deep)\s+([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%',s)
        if m: d[m.group(1)]=[float(m.group(k)) for k in range(2,8)]
    return d
def plainrow(name,pf):
    P=parse(pf); D=door(pf); sp=max(P[q] for q in Q)-min(P[q] for q in Q)
    print(f"  {name:36s} seat {P['fresh_seat']:+5.1f}/{P['deep_seat']:+5.1f}  skill {P['fresh_skill']:+5.1f}/{P['deep_skill']:+5.1f}  "+"  ".join(f"{q[:3]} {P[q]:.1f}" for q in Q)+f"  spread {sp:.1f}")
    for k in ('fresh','deep'):
        v=D.get(k)
        if v: print(f"       door {k:5s} leader {v[0]:.0f}%   bya {v[2]:.0f} suz {v[3]:.0f} sei {v[4]:.0f} gen {v[5]:.0f}")
def lawrow(name,pf,lf):
    P=parse(pf); L=parse(lf); po,lo,psp,lsp,topd,botd,rot,v=shape(P,L)
    print(f"  {name:36s} seat {L['fresh_seat']-P['fresh_seat']:+5.1f}/{L['deep_seat']-P['deep_seat']:+5.1f}  skill {L['fresh_skill']-P['fresh_skill']:+5.1f}/{L['deep_skill']-P['deep_skill']:+5.1f}  spread {psp:.1f}->{lsp:.1f} ({lsp-psp:+.1f})  "+"  ".join(f"{q[:3]}{L[q]-P[q]:+.1f}" for q in Q)+f"  {v}")
N=[(7,'t7','t3','slid'),(8,'t8','t4','door-first'),(11,'t11','t7','door-first'),(13,'t13','m9plain','standard'),(14,'t14','t10','door-first'),(16,'t16','t12','door-first'),(17,'t17','t13','door-first'),(20,'t20','t16','slid'),(22,'m22plain','m22plain_slid','slid')]
LAWS={7:('7a the second strike','again_t3'),8:('8a the haunted station','haunt_t8'),11:('11b the two ribs','ribs_t11'),13:('13a the steady hand','hand_t13'),14:('14a the unarmed','unarmed_t14'),16:('16b the scales','scales_t16'),17:('17a the crown holds','hold_t17'),22:('22b the release','release_t18')}
for m,d,s,win in N:
    df=(d if d.startswith('m') else 'p_'+d)+'.out'; sf=(s if s.startswith('m') else 'p_'+s)+'.out'
    print(f"\n== m{m}   (Design's window: {win})"); plainrow("door-first plain",df); plainrow("slid plain",sf)
    pf = df if win!='slid' else sf
    if m in LAWS: lawrow(LAWS[m][0],pf,LAWS[m][1]+'.out')
    if m==14: lawrow('14b the bright face',pf,'bright_t14.out')

print("\n== SECOND CARDS AND DIAGNOSTICS")
lawrow("8b the vapour (m8 door-first)","p_t8.out","vapour_t8.out")
lawrow("8c the goat's gap (m8 door-first)","p_t8.out","gap_t8.out")
lawrow("13b the crossbar (m13 standard)","p_t13.out","still_t13.out")
lawrow("14c the horn (m14 door-first)","p_t14.out","horn_t14.out")
lawrow("16a the pinch (m16 door-first)","p_t16.out","pinch_t16.out")
lawrow("22a the ear (m22 slid)","m22plain_slid.out","ear_t18.out")
lawrow("22 diag: void lines, debit right","m22plain_slid.out","release_right_t18.out")
lawrow("22 diag: the eye, defender","m22plain_slid.out","eye_t18.out")
lawrow("22 diag: the release + the eye","m22plain_slid.out","release_eye_t18.out")
