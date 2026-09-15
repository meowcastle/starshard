import manzil_sim_shape as m, random, statistics as st
R = m.Rules(owned=m.PROTO_OWNED)
def run(shape, same, combo, reps=4, seed=5):
    m.SHAPE, m.SAME, m.COMBO = shape, same, combo
    rng = random.Random(seed); out={}
    for name, pl in (("1-ply", m.player_1ply), ("2-ply", m.player_2ply)):
        w=n=0; fl=[]; ties=0; uniq=[]; legal=[]
        for t in range(1,29):
            for lead in (True,False):
                for r in range(reps):
                    f=[]
                    won,y,s=m.play_board(R,list(m.DEFAULT_FIVE),t,lead,pl,rng,flip_log=f)
                    w+=won; n+=1; fl.append(sum(f)); ties+=(y==s)
        for t in range(1,29):
            board=tuple([None]*9); h=tuple(m.DEFAULT_FIVE); sk=tuple(m.SKY_HAND); you=True
            while any(x is None for x in board):
                if you:
                    if not h: you=False; continue
                    sc=m.moves_scored_1ply(R,board,h,t)
                    if sc:
                        legal.append(len(sc)); b=max(v for _,v in sc); uniq.append(sum(1 for _,v in sc if v==b)==1)
                    cid,i,rev=pl(R,board,h,sk,t,rng); board,_=m.resolve(R,board,cid,i,rev); h=tuple(x for x in h if x!=cid)
                else:
                    if not sk: you=True; continue
                    cid,i,rev=m.sky_move(R,board,sk,h,t); board,_=m.resolve(R,board,cid,i,rev); sk=tuple(x for x in sk if x!=cid)
                you=not you
        out[name]=(round(100*w/n,1), round(st.mean(fl),2), round(100*ties/n,1), round(st.mean(legal),1), round(100*st.mean(uniq)))
    return out
CONF=[("road, as shipped","road",False,False),("+ Same (ties flip)","road",True,False),
      ("+ Same + Combo","road",True,True),("wrapped","wrapped",False,False),
      ("wrapped + Same","wrapped",True,False),("contiguous","contiguous",False,False),
      ("contiguous + Same","contiguous",True,False)]
print(f"{'config':22s} {'agent':6s} {'win%':>6s} {'flips/bd':>9s} {'tied%':>6s} {'moves':>6s} {'uniq%':>6s}")
print('-'*66)
for lab,sh,sa,co in CONF:
    r=run(sh,sa,co)
    for ag in r:
        w,f,ti,lg,u=r[ag]
        print(f"{lab:22s} {ag:6s} {w:6.1f} {f:9.2f} {ti:6.1f} {lg:6.1f} {u:6d}")
