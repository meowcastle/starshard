import manzil_sim_shape as m, random, statistics as st, json
R = m.Rules(owned=m.PROTO_OWNED)
AG = (("random", m.player_random), ("1-ply", m.player_1ply), ("2-ply", m.player_2ply))
def run(shape, reps=4, seed=5):
    m.SHAPE = shape
    rng = random.Random(seed); out = {}
    for name, pl in AG:
        w=n=0; fl=[]; ties=0; legal=[]; uniq=[]; margins=[]
        for t in range(1, 29):
            for lead in (True, False):
                for r in range(reps):
                    f=[]
                    won,y,s = m.play_board(R, list(m.DEFAULT_FIVE), t, lead, pl, rng, flip_log=f)
                    w+=won; n+=1; fl.append(sum(f)); ties += (y==s); margins.append(abs(y-s))
        # decision density on a fresh 1-ply walkthrough
        for t in range(1,29):
            board=tuple([None]*9); h=tuple(m.DEFAULT_FIVE); sk=tuple(m.SKY_HAND); you=True
            while any(x is None for x in board):
                if you:
                    if not h: you=False; continue
                    sc=m.moves_scored_1ply(R,board,h,t)
                    if sc:
                        legal.append(len(sc)); best=max(v for _,v in sc)
                        uniq.append(sum(1 for _,v in sc if v==best)==1)
                    cid,i,rev=pl(R,board,h,sk,t,rng); board,_=m.resolve(R,board,cid,i,rev); h=tuple(x for x in h if x!=cid)
                else:
                    if not sk: you=True; continue
                    cid,i,rev=m.sky_move(R,board,sk,h,t); board,_=m.resolve(R,board,cid,i,rev); sk=tuple(x for x in sk if x!=cid)
                you=not you
        out[name]=dict(win=round(100*w/n,1), flips=round(st.mean(fl),2),
                       tied=round(100*ties/n,1), margin=round(st.mean(margins),2),
                       legal=round(st.mean(legal),1), uniq=round(100*st.mean(uniq)))
    return out
res={sh:run(sh) for sh in ("road","wrapped","contiguous")}
json.dump(res, open('/home/claude/shape_results.json','w'), indent=1)
hdr=f"{'shape':11s} {'agent':7s} {'win%':>6s} {'flips/bd':>9s} {'tied%':>6s} {'margin':>7s} {'moves/turn':>11s} {'unique-best%':>13s}"
print(hdr); print('-'*len(hdr))
for sh in res:
    for ag in res[sh]:
        d=res[sh][ag]
        print(f"{sh:11s} {ag:7s} {d['win']:6.1f} {d['flips']:9.2f} {d['tied']:6.1f} {d['margin']:7.2f} {d['legal']:11.1f} {d['uniq']:13d}")
