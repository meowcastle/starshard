import manzil_sim_v4 as m, random, statistics as st
from collections import Counter
rng = random.Random(9)
R = m.Rules(owned=m.ALL_L2)
NAMES = [p[0] for p in m.POOL]

# --- realistic walker hand distribution: players pick good-but-imperfect hands.
# model: each walker picks 5 cards weighted by (l+r) total plus a bonus for the 6 signature cards; softmax temp varies (some casuals, some sharks)
SIG = {5,6,10,14,17,18}
def walker_hand(temp):
    ids = list(range(1,29))
    def wgt(c):
        card = R.cards[c]
        return (card["l"]+card["r"]) + (2.5 if c in SIG else 0)
    hand=[]
    pool=ids[:]
    for _ in range(5):
        ws=[pow(2.71828, wgt(c)/temp) for c in pool]
        tot=sum(ws); r=rng.random()*tot; acc=0
        for c,w in zip(pool,ws):
            acc+=w
            if acc>=r: hand.append(c); pool.remove(c); break
    return hand

# ladder: 5 single boards vs walkers, casual->sharp temps; you = default five
TEMPS = [8.0, 6.0, 4.0, 2.5, 1.5]   # rung 1 casual .. rung 5 shark
def ladder_run(you_agent, you_hand, nrun=400):
    rungw = [0]*5; total_boards=[]
    clears=0
    for k in range(nrun):
        boards=0; ok=True
        for rung,temp in enumerate(TEMPS):
            hs = walker_hand(temp)
            lead = (rung % 2 == 0)
            r = m.play_symmetric(R, list(you_hand), hs, lead, you_agent, rng)
            won = r[0] if isinstance(r, tuple) else r
            boards+=1
            rungw[rung]+=won
        total_boards.append(boards)
    return [round(100*w/nrun) for w in rungw]

for agent,lab in ((m.player_1ply,"casual (1-ply)"),(m.player_2ply,"careful (2-ply)")):
    print(lab, "rung win % vs walkers 1..5:", ladder_run(agent, m.DEFAULT_FIVE))

# --- the sky as boss: harder = 3-ply-ish (sky_move but with deeper reply) + house rule per night
# emulate "decently harder": sky uses its normal heuristic but we let it also consider your best 2-ply reply chain (approx: weight reply *12 instead of *8)
def sky_hard(R_, board, sky, hand, tonight, rng_):
    best=None; bestsc=None
    full_after = sum(1 for s in board if s is None)==1
    for cid in sky:
        c=R_.cards[cid]
        revs=(False,True) if c["ab"]=="mercury" else (False,)
        for i in range(9):
            if board[i] is not None: continue
            for rev in revs:
                b2,_=m.resolve(R_,board,cid,i,rev)
                y,s=m.counts(R_,b2,tonight)
                if len(hand)>0 and not full_after:
                    rep=m.best_you_reply(R_,b2,hand,tonight)
                    sc=(s-y)*10-(0 if rep is None else rep)*12
                else: sc=(s-y)*10
                sc+=(c["l"]+c["r"])*0.1+(8-i)*0.01
                if best is None or sc>bestsc: best=(cid,i,rev); bestsc=sc
    return best

# house rule example: storm night = ties go to sky is already default; try "first-to-5 points with cube" match vs hard sky
def match_first_to_pts(target, you_agent, hand, tonight, cube=True, crawford=True, nrun=200):
    w=0; blist=[]
    for k in range(nrun):
        you=sky=0; lead=True; b=0
        while you<target and sky<target:
            b+=1
            called=False
            if cube and not (crawford and (you==target-1 or sky==target-1)):
                called = lead  # leader calls (simple policy both sides)
            pts=2 if called else 1
            won,_,_=m.play_board(R,list(hand),tonight,lead,you_agent,rng,sky_agent=sky_hard)
            if won: you+=pts
            else: sky+=pts
            lead=not lead
        w+= you>=target; blist.append(b)
    return round(100*w/nrun), round(st.mean(blist),1)

res2=[]; res1=[]
for t in range(1,29,4):
    res2.append(match_first_to_pts(5,m.player_2ply,m.DEFAULT_FIVE,t,nrun=60))
    res1.append(match_first_to_pts(5,m.player_1ply,m.DEFAULT_FIVE,t,nrun=60))
print("hard sky, first-to-5 w/ cube, 2-ply:", res2, "mean win", round(st.mean(x[0] for x in res2)), "mean boards", round(st.mean(x[1] for x in res2),1))
print("hard sky, first-to-5 w/ cube, 1-ply:", res1, "mean win", round(st.mean(x[0] for x in res1)))
# board-level vs hard sky for reference
for ag,lab in ((m.player_2ply,"2-ply"),(m.player_1ply,"1-ply")):
    w=n=0
    for t in range(1,29):
        for lead in (True,False):
            for r in range(3):
                won,_,_=m.play_board(R,list(m.DEFAULT_FIVE),t,lead,ag,rng,sky_agent=sky_hard); w+=won;n+=1
    print(f"hard sky board level {lab}:", round(100*w/n))
