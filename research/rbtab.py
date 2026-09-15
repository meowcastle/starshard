import os; exec(open('shape.py').read().split('P=parse')[0])
L=[(1,'the gate','open',1,'m1plain.out'),(2,'the bearer','toll',26,'m2plain_slid.out'),(3,'the gathered stars','razor',3,'m3plain.out'),(4,'the follower','crow',4,'m4plain.out'),(5,'the blaze','price',5,'m5plain.out'),(10,'the throne','reach',10,None),(12,'the turning','turn',12,'m12plain.out'),(18,'the heart','beat',18,None),(19,'the root','plant',15,'m19plain_slid.out'),(21,'the district','hush',17,'m21plain_slid.out'),(23,'the drum','reson',19,'m23plain_slid.out'),(25,'the hideaway','shell',21,'m25plain_slid.out'),(26,'the chamber','guest',26,'m2plain_slid.out'),(27,'the guide','stranger',27,'m27plain.out'),(28,'the thread','rope',24,'m28plain_slid.out')]
print("night | law | window | plain seat f/d | plain skill f/d | plain quadrants | spread | law seat | law skill | law spread | shape | old-plain bird drift")
for m,name,law,t,old in L:
    P=parse(f'rb_plain_t{t}.out'); Q_=parse(f'rb_law_{law}.out'); po,lo,psp,lsp,topd,botd,rot,v=shape(P,Q_)
    drift=''
    if old and os.path.exists(old):
        O=parse(old); drift=f"suz {O['suzaku']:.1f} -> {P['suzaku']:.1f} ({P['suzaku']-O['suzaku']:+.1f})"
    print(f"m{m} {name} | {law} | t{t} | {P['fresh_seat']:+.1f}/{P['deep_seat']:+.1f} | {P['fresh_skill']:+.1f}/{P['deep_skill']:+.1f} | "+" · ".join(f"{P[q]:.1f}" for q in Q)+f" | {psp:.1f} | {Q_['fresh_seat']-P['fresh_seat']:+.1f}/{Q_['deep_seat']-P['deep_seat']:+.1f} | {Q_['fresh_skill']-P['fresh_skill']:+.1f}/{Q_['deep_skill']-P['deep_skill']:+.1f} | {psp:.1f}->{lsp:.1f} ({lsp-psp:+.1f}) "+" ".join(f"{q[:3]}{Q_[q]-P[q]:+.1f}" for q in Q)+f" | {v} | {drift}")
