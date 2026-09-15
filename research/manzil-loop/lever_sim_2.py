import manzil_sim_shape as m, random, statistics as st
R=m.Rules(owned=m.PROTO_OWNED)
def run(shape,same,combo,tie,reps=4,seed=5):
    m.SHAPE,m.SAME,m.COMBO,m.TIERULE=shape,same,combo,tie
    rng=random.Random(seed); out={}
    for name,pl in (("1-ply",m.player_1ply),("2-ply",m.player_2ply)):
        w=n=0; fl=[]
        for t in range(1,29):
            for lead in (True,False):
                for r in range(reps):
                    f=[]; won,y,s=m.play_board(R,list(m.DEFAULT_FIVE),t,lead,pl,rng,flip_log=f)
                    w+=won; n+=1; fl.append(sum(f))
        out[name]=(round(100*w/n,1),round(st.mean(fl),2))
    return out
CONF=[("as shipped","road",0,0,"sky"),
      ("tie-count to you","road",0,0,"you"),
      ("tie-count to anchor","road",0,0,"anchor"),
      ("Same","road",1,0,"sky"),
      ("Same + tie to you","road",1,0,"you"),
      ("Same + tie to anchor","road",1,0,"anchor"),
      ("Same+Combo + tie to you","road",1,1,"you"),
      ("wrapped + Same + tie you","wrapped",1,0,"you"),
      ("wrapped+Same+tie anchor","wrapped",1,0,"anchor"),
      ("contig + Same + tie sky","contiguous",1,0,"sky")]
print(f"{'config':26s} {'1-ply win%':>10s} {'1-ply flips':>12s} {'2-ply win%':>11s} {'2-ply flips':>12s}")
print('-'*74)
for lab,sh,sa,co,ti in CONF:
    r=run(sh,sa,co,ti)
    print(f"{lab:26s} {r['1-ply'][0]:10.1f} {r['1-ply'][1]:12.2f} {r['2-ply'][0]:11.1f} {r['2-ply'][1]:12.2f}")
print("\ntarget band: 1-ply 35-45 · 2-ply 55-65 · flips 4+")
