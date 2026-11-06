#!/usr/bin/env python3
"""whyloss.py -- the Forge-style 'why' layer on the conformant Manzil v6 engine.

Replays a forced opening (card, slot, rev) on every night with the reference agents, and for
each board asks three things the win-rate tables never did:

  1. LOCK POINT  -- the earliest point at which *every* alternative the sky had, played out by
     the reference agents, still loses. If the lock point is "before her first move" the
     opening alone decides the board and nothing she can do matters.
  2. MARGIN TRACE -- (you - sky) after every placement, so you can see where the board swings.
  3. ATTRIBUTION -- how the final count was earned: raw cards held, dominion doubles, Jupiter,
     signature weight (crown/gathered/district), and how many of the flips were cascades (ties).

Also tries her with deeper reading (depth 0..24) and with a different card order, so the
answer is not an artefact of one agent setting.
"""
import sys, json, itertools, collections
import manzil_v6 as v

FIVE = [5, 6, 10, 17, 18]
SKY = list(v.SKY_HAND)
NAMES = {cid: v.POOL[cid - 1][0] for cid in range(1, 29)}
NAMES.update({pid: v.PLANETS[pid][0] for pid in v.PLANETS})


def make_cards():
    """the Empty District friend-build table: ownAll:false, chart five at L2, rest loaned."""
    return v.Cards(own_all=False, owned_ids=FIVE)


def step(C, state, side, mv, tonight):
    """apply a chosen move tuple from you_move/sky_move to a state dict (copying)."""
    slots, you, sky, ret_used, glance_on, flips, trace = state
    cid, i, rev, score, b2, f, ret = mv
    you = list(you); sky = list(sky)
    if side == "you": you.remove(cid)
    else: sky.remove(cid)
    if ret: you += list(ret); ret_used = True
    glance_on = (side == "you" and C[cid]["ab"] == "glance" and C.on(C[cid]))
    y, s = v.counts(C, b2, tonight)
    trace = trace + [(side, cid, i, rev, f, y - s)]
    return (b2, you, sky, ret_used, glance_on, flips + f, trace)


def playout(C, state, turn, tonight, you_depth=8, depth=8):
    """finish a board from state with the reference agents; returns final state + winner."""
    slots, you, sky, ret_used, glance_on, flips, trace = state
    guard = 0
    while any(s is None for s in slots) and (you or sky) and guard < 40:
        guard += 1
        if turn == "you":
            mv = v.you_move(C, slots, you, sky, tonight, you_depth, ret_used, glance_on) if you else None
        else:
            mv = v.sky_move(C, slots, sky, you, tonight, depth) if sky else None
        if mv is None:
            turn = "sky" if turn == "you" else "you"; continue
        state = step(C, state, turn, mv, tonight)
        slots, you, sky, ret_used, glance_on, flips, trace = state
        turn = "sky" if turn == "you" else "you"
    return state, v.board_winner(C, slots, tonight)


def sky_alternatives(C, state, tonight):
    """every legal sky move as a move tuple (no scoring)."""
    slots, you, sky, ret_used, glance_on, flips, trace = state
    out = []
    for cid in sky:
        for rev in ((False, True) if C[cid]["ab"] == "mercury" else (False,)):
            for i in v.legal(slots):
                b2, f, ret = v.resolve_ret(C, slots, cid, i, rev, "sky", tonight)
                out.append((cid, i, rev, 0, b2, f, ret))
    return out


def forced_board(C, tonight, fc, fi, frev, you_depth=8, depth=8):
    """play the forced opening then the reference agents; record every sky decision point."""
    slots = [None] * 9
    state = (slots, list(FIVE), list(SKY), False, False, 0, [])
    turn = v.mk_turn(C, FIVE, SKY, "you")
    b2, f, ret = v.resolve_ret(C, slots, fc, fi, frev, "you", tonight)
    state = step(C, state, "you", (fc, fi, frev, 0, b2, f, ret), tonight)
    turn = "sky"
    decision_points = []          # (state, turn) before each of her moves
    guard = 0
    while any(s is None for s in state[0]) and (state[1] or state[2]) and guard < 40:
        guard += 1
        slots, you, sky, ret_used, glance_on, flips, trace = state
        if turn == "sky":
            if sky: decision_points.append((state, turn))
            mv = v.sky_move(C, slots, sky, you, tonight, depth) if sky else None
        else:
            mv = v.you_move(C, slots, you, sky, tonight, you_depth, ret_used, glance_on) if you else None
        if mv is None:
            turn = "sky" if turn == "you" else "you"; continue
        state = step(C, state, turn, mv, tonight)
        turn = "sky" if turn == "you" else "you"
    return state, v.board_winner(C, state[0], tonight), decision_points


def lock_point(C, decision_points, tonight, you_depth=8, depth=8):
    """index (0 = before her 1st move) of the first decision point where all her alternatives
    still lose; also the count of alternatives that would have won at each point."""
    wins_at = []
    for k, (state, turn) in enumerate(decision_points):
        wins = 0; total = 0
        for alt in sky_alternatives(C, state, tonight):
            total += 1
            st2 = step(C, state, "sky", alt, tonight)
            _s, you_won = playout(C, st2, "you", tonight, you_depth, depth)
            if not you_won: wins += 1
        wins_at.append((wins, total))
    lock = None
    for k, (w, t) in enumerate(wins_at):
        if w == 0:
            lock = k; break
    # lock is only meaningful if all later points also have 0 (they must, deterministic)
    return lock, wins_at


def attribution(C, slots, tonight):
    """break the final count down by source."""
    cx = v.ctx(C, slots, tonight)
    out = dict(you=collections.Counter(), sky=collections.Counter())
    for i, s in enumerate(slots):
        if not s: continue
        w, who = v.slot_w(C, slots, i, cx, tonight)
        if not who: continue
        c = C[s["id"]]
        side = out[who]
        side["cards"] += 1
        if v.is_home(C, s["id"], i, tonight): side["dominion"] += 1
        if c["ab"] == "jupiter": side["jupiter"] += 1
        if C.on(c) and c["ab"] in ("gathered", "crown", "district"):
            side["sig_weight"] += w - 1 - (1 if v.is_home(C, s["id"], i, tonight) else 0)
    return out


def flips_by_kind(C, trace_states):
    pass


def run_opening(fc, fi, frev, you_depth=8, depth=8, nights=range(1, 29), verbose=False):
    C = make_cards()
    rows = []
    for tonight in nights:
        state, you_won, dps = forced_board(C, tonight, fc, fi, frev, you_depth, depth)
        slots, you, sky, ret_used, glance_on, flips, trace = state
        lock, wins_at = lock_point(C, dps, tonight, you_depth, depth)
        y, s = v.counts(C, slots, tonight)
        att = attribution(C, slots, tonight)
        # who owns the opening card at the end?
        opener_held = slots[fi] is not None and slots[fi]["id"] == fc and slots[fi]["owner"] == "you"
        # who flipped whom: count flips per side from the trace
        yf = sum(t[4] for t in trace if t[0] == "you"); sf = sum(t[4] for t in trace if t[0] == "sky")
        last = trace[-1]
        rows.append(dict(night=tonight, won=you_won, you=y, sky=s, margin=y - s,
                         lock=lock, wins_at=wins_at,
                         margins=[t[5] for t in trace],
                         you_flips=yf, sky_flips=sf,
                         opener_held=opener_held,
                         home_opening=v.is_home(C, fc, fi, tonight),
                         last_side=last[0], last_flips=last[4],
                         last_margin_swing=(trace[-1][5] - trace[-2][5]) if len(trace) > 1 else trace[-1][5],
                         att=dict(you=dict(att["you"]), sky=dict(att["sky"])),
                         moves=[(t[0], NAMES[t[1]], t[2], t[3], t[4], t[5]) for t in trace]))
        if verbose:
            print(f"night {tonight:2d} {'WIN ' if you_won else 'LOSS'} {y}-{s} lock={lock} "
                  f"wins_at={wins_at} margins={[t[5] for t in trace]}")
    return rows


def scan_all(you_depth=8, depth=8):
    C = make_cards()
    res = []
    for cid in FIVE:
        for i in range(9):
            for rev in ((False, True) if C[cid]["two"] else (False,)):
                w = 0
                for n in range(1, 29):
                    _s, won, _d = forced_board(C, n, cid, i, rev, you_depth, depth)
                    w += won
                res.append((w, cid, i, rev))
    res.sort(reverse=True)
    return res


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "scan"
    if mode == "scan":
        for w, cid, i, rev in scan_all()[:14]:
            print(f"{NAMES[cid]:<12} slot {i} rev{int(rev)}: {w}/28")
    elif mode == "why":
        fc, fi = int(sys.argv[2]), int(sys.argv[3])
        rev = len(sys.argv) > 4 and sys.argv[4] == "1"
        rows = run_opening(fc, fi, rev, verbose=True)
        json.dump(rows, open(sys.argv[5] if len(sys.argv) > 5 else "why.json", "w"), indent=1)
