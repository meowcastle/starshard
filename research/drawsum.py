import sys
PAT=sys.argv[1] if len(sys.argv)>1 else 'draw_[ab]_*.out'
import re,glob,collections
rows=collections.defaultdict(list)
for f in glob.glob(PAT):
    for line in open(f):
        m=re.match(r'\s+m(\d+)\s+(\w+)\s+([\d.]+)\s+([\d.]+)\s+(-?[\d.]+)\s+([\d.]+)\s+(\d+)\s+(\d+)\s+(\d+)',line)
        if m: rows[(int(m[1]),m[2])].append([float(m[3]),float(m[4]),float(m[5]),float(m[6]),int(m[7]),int(m[8]),int(m[9])])
forms=["defender","leader","moon","house","nobody"]
print("per form, 28 nights, two seeds (1792 boards a seat a night):")
print("  form       mean you-lead  mean she-leads  mean seat   nights |seat|<=5   seat range      level boards -> you : sky : draw")
for f in forms:
    ys=[];ss=[];seats=[];ty=tk=td=0
    for m in range(1,29):
        r=rows[(m,f)]; y=sum(x[0] for x in r)/len(r); s=sum(x[1] for x in r)/len(r); ys.append(y); ss.append(s); seats.append(y-s)
        ty+=sum(x[4] for x in r); tk+=sum(x[5] for x in r); td+=sum(x[6] for x in r)
    print(f"  {f:9} {sum(ys)/28:12.1f} {sum(ss)/28:15.1f} {sum(seats)/28:10.1f} {sum(1 for s in seats if abs(s)<=5):14d}   {min(seats):5.1f}..{max(seats):5.1f}     {ty}:{tk}:{td}")
lv=[sum(x[3] for x in rows[(m,'defender')])/len(rows[(m,'defender')]) for m in range(1,29)]
print(f"\nlevel boards: mean {sum(lv)/28:.1f}% of boards; range {min(lv):.1f}..{max(lv):.1f}; nights over 12%: "+", ".join(f"m{m+1} {v:.1f}" for m,v in enumerate(lv) if v>12))
print("\nper night seat by form (defender / leader / moon / house / nobody), then level%:")
for m in range(1,29):
    print(f"  m{m:<3}"+"".join(f"{sum(x[2] for x in rows[(m,f)])/len(rows[(m,f)]):7.1f}" for f in forms)+f"   {lv[m-1]:5.1f}")
# moon form: how often moon decides (not falling to defender)? approximate from toYou/toSky vs defender
