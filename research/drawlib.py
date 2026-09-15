#!/usr/bin/env python3
"""Randomness / shuffle / cube probes for Manzil. Writes /home/claude/draw-results.json
progressively so partial results are readable while it runs."""
import random, json, statistics, itertools, sys, time
import manzil_sim_cur as m

OUT = "/home/claude/draw-results.json"
RES = {}
T0 = time.time()

def save():
    json.dump(RES, open(OUT, "w"), indent=1)

SIGS = {5:"blaze", 6:"storm", 10:"throne", 17:"crown", 18:"heart", 14:"jewel", 25:"hideaway"}
SIG_ORDER = [6, 10, 17, 18, 5, 14, 25]   # strongest-first per prior addenda

def owned_k(k, lvl=2):
    return {cid: (lvl, SIGS[cid]) for cid in SIG_ORDER[:k]}

# ------------------------------------------------------------------ draw engine
def play_board_draw(R, deck, tonight, you_lead, player, rng, hand_size,
                    sky_hand=None, flip_log=None, forced=None, seen_log=None):
    """Like m.play_board but the player holds `hand_size` drawn from a shuffled `deck`,
    refilling after each lodge. forced = (cid,i,rev) applied as the player's first move."""
    board = tuple([None]*9)
    d = list(deck); rng.shuffle(d)
    hand = tuple(d[:hand_size]); pile = d[hand_size:]
    sky = tuple(sky_hand if sky_hand is not None else m.SKY_HAND)
    you_turn = you_lead; first = True
    while any(s is None for s in board):
        if you_turn:
            if not hand: you_turn = False; continue
            if first and forced is not None and forced[0] in hand:
                cid, i, rev = forced
                if not m.legal_slot(board, i): cid, i, rev = player(R, board, hand, sky, tonight, rng)
            else:
                cid, i, rev = player(R, board, hand, sky, tonight, rng)
            first = False
            board, nf = m.resolve(R, board, cid, i, rev, None, tonight)
            hand = tuple(x for x in hand if x != cid)
            if pile:
                hand = hand + (pile.pop(0),)
        else:
            if not sky: you_turn = True; continue
            cid, i, rev = m.sky_move(R, board, sky, hand, tonight)
            board, nf = m.resolve(R, board, cid, i, rev, None, tonight)
            sky = tuple(x for x in sky if x != cid)
        if flip_log is not None: flip_log.append(nf)
        you_turn = not you_turn
    y, s = m.counts(R, board, tonight)
    if y != s: return y > s, y, s
    return (m.TIERULE == "you"), y, s

# ------------------------------------------------------------------ cell runner
def cell(R, deck, hand_size, player, seed, reps=8, fixed_hand=None, forced=None):
    rng = random.Random(seed)
    w = t = 0; flips = []; per_night = {}
    for tonight in range(1, 29):
        nw = nt = 0
        for lead in (True, False):
            for _ in range(reps):
                fl = []
                if fixed_hand is not None:
                    won, y, s = m.play_board(R, list(fixed_hand), tonight, lead, player, rng, flip_log=fl)
                else:
                    won, y, s = play_board_draw(R, deck, tonight, lead, player, rng,
                                                hand_size, flip_log=fl, forced=forced)
                t += 1; nt += 1
                if won: w += 1; nw += 1
                flips.append(sum(fl))
        per_night[tonight] = nw/nt
    return dict(win=w/t, n=t, flips=statistics.mean(flips),
                night_sd=statistics.pstdev(list(per_night.values())),
                night_min=min(per_night.values()), night_max=max(per_night.values()))

ALL28 = list(range(1, 29))

def run(label, **kw):
    row = {}
    for ag, nm in ((m.player_2ply, "careful"), (m.player_1ply, "casual")):
        a = cell(player=ag, seed=11, **kw); b = cell(player=ag, seed=97, **kw)
        row[nm] = dict(win=round(100*(a["win"]+b["win"])/2, 1),
                       win_s1=round(100*a["win"],1), win_s2=round(100*b["win"],1),
                       flips=round((a["flips"]+b["flips"])/2, 2),
                       night_sd=round(100*(a["night_sd"]+b["night_sd"])/2, 1),
                       night_min=round(100*min(a["night_min"],b["night_min"]),1),
                       night_max=round(100*max(a["night_max"],b["night_max"]),1),
                       n=a["n"]+b["n"])
    row["skill_gap"] = round(row["careful"]["win"] - row["casual"]["win"], 1)
    RES[label] = row; save()
    print(f"{label:<44} careful {row['careful']['win']:5.1f}  casual {row['casual']['win']:5.1f} "
          f" gap {row['skill_gap']:5.1f}  flips {row['careful']['flips']:4.2f} "
          f" night-sd {row['careful']['night_sd']:4.1f}   [{time.time()-T0:6.0f}s]", flush=True)
    return row

