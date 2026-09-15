import manzil_sim_h2h as m, random, statistics as st, json
R = m.Rules(owned=m.PROTO_OWNED)
# mansion 6 (the Storm) is on the 9-slot road when tonight in {26,27,28,1..6}
HOME_NIGHTS = {26,27,28,1,2,3,4,5,6}
def run(mode, strike, reps=8, seed=11):
    m.SHAPE, m.SAME, m.COMBO, m.TIERULE = 'road', 1, 1, 'you'
    m.STORM_MODE, m.STORM_STRIKE = mode, strike
    rng = random.Random(seed); out = {}
    for nm, pl in (('casual', m.player_1ply), ('careful', m.player_2ply)):
        agg = {}
        for grp in ('all','home','away'):
            agg[grp] = {'w':0,'n':0,'fl':[]}
        for t in range(1, 29):
            grp = 'home' if t in HOME_NIGHTS else 'away'
            for lead in (True, False):
                for r in range(reps):
                    f = []
                    won, y, s = m.play_board(R, list(m.DEFAULT_FIVE), t, lead, pl, rng, flip_log=f)
                    for g in ('all', grp):
                        agg[g]['w'] += won; agg[g]['n'] += 1; agg[g]['fl'].append(sum(f))
        out[nm] = {g: dict(win=round(100*a['w']/a['n'],1), flips=round(st.mean(a['fl']),2), n=a['n'])
                   for g,a in agg.items()}
    return out
CONF = [("baseline: no Storm signature","off",0),
        ("A. immune at home (defensive)","home_def",0),
        ("A'. immune at home (both ways)","home_sym",0),
        ("B. strikes at +1 (always)","off",1),
        ("as shipped: immune everywhere","both",0)]
res = {}
print(f"{'config':32s} | {'careful all':>11s} {'flips':>6s} | {'casual all':>10s} {'flips':>6s} | {'careful home':>12s} {'away':>6s}")
print('-'*104)
for lab, mo, sk in CONF:
    r = run(mo, sk); res[lab] = r
    c, k = r['careful'], r['casual']
    print(f"{lab:32s} | {c['all']['win']:11.1f} {c['all']['flips']:6.2f} | {k['all']['win']:10.1f} {k['all']['flips']:6.2f} | {c['home']['win']:12.1f} {c['away']['win']:6.1f}")
json.dump(res, open('/home/claude/h2h_results.json','w'), indent=1)
print("\nbands: careful 55-65 · casual 35-45 · flips 4+")
print(f"home nights n={sum(1 for t in range(1,29) if t in HOME_NIGHTS)}/28, away n={28-sum(1 for t in range(1,29) if t in HOME_NIGHTS)}/28")
