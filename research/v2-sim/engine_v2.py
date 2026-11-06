#!/usr/bin/env python3
"""engine_v2.py: the Manzil v2 engine. S1, the Moving Sky (MANZIL-TCG.md section 1.1,
docs/BACKLOG-V2.md S1), on top of the untouched v1 primitives.

What is kept from v1, imported and re-exported unchanged: the cards and their numbers,
the two faces and the facing-number capture, ties and cascades, every signature in
face_of / try_flip / lodge / resolve_ret, the count law in ctx / slot_w / counts, the
Gate's lead (mk_turn), the Return to hand, the Glance, the xorshift deal, and the
deterministic agents' shape (strict > on the score, first best in hand order, face false
then true, slot ascending; no nudge, no random tiebreak). The 33 conformance vectors pass
against this module because those functions are the v1 functions.

What the Moving Sky changes (all behind MOVING_SKY = True; the flag is the mechanic's
switch for the gate runner and later packets):

  the road     nine mansions visible, slot i showing mansion ((tonight - 1 + offset + i)
               mod 28) + 1. offset starts at 0 and rises by one at every set, so the v1
               functions are called with the mansion standing at slot 0 as "tonight" and
               need no change.
  a round      the leader places, then the follower; a side with no cards passes. At the
               end of the round the leftmost mansion SETS: slot_w at slot 0, with the
               Thread's and the Hideaway's say, is banked to the card's holder; the road
               moves one to the left; the next mansion in the real sequence RISES at slot
               8. If the rising mansion is a planet's home (PLANET_HOME) and that planet is
               still in her hand, it is already standing there: it lodges at slot 8 as her
               placement and its captures resolve. She does not choose it and it is not
               her turn.
  the watch    ROUNDS = 6 sets a night to start. After the sixth set it is dawn and every
               mansion still on the road sets at once (counts over the nine, banked). A
               night's score is the bank; the holder of the larger bank wins; a tied bank
               is yours (TIERULE).
  scoring      a card scores when its mansion sets (or at dawn), to whoever holds it then,
               never when it is placed. Recapturing a card the round before it sets is the
               counter the design asks for.
  the agents   the same evaluation shape as v1 with the total in place of the road count:
               margin = (your bank + your road count) - (her bank + her road count), the
               score of what dawn would give now. One move ahead, the reply includes the
               set and the rise it causes. Depth is the same dial.

Not modelled, as in v1: the Hand's move and the Guide's trade. No draw pile: S1 is the
Moving Sky alone, on the hands the deal gives, as MANZIL-TCG.md section 7 asks ("Moving
Sky alone, against the current 28 at their shipped numbers"). With five cards a side and
six sets, the sixth round is a bare set before dawn.

The public surface the gate runner uses: new_game, legal_moves, place, pass_turn,
margin, you_move, sky_move, play_board, finish, Solver; plus VECTORS, the name of the
module holding this engine's own vectors (vectors_s1).
"""
import engine_v1 as v1
from engine_v1 import (POOL, ABS, CHART_FIVE, PLANET_HOME, PLANETS, SKY_HAND, REPLY_W, TIERULE,
                       rebase, Cards, nb, board_m, is_home, has_awake, no_soften, face_of,
                       safe_now, try_flip, lodge, mk_turn, resolve_ret, resolve, ctx, slot_w,
                       counts, board_winner, legal, deal)

MOVING_SKY = True
ROUNDS = 6
VECTORS = "vectors_s1"
PLANET_AT = {home: pid for pid, home in PLANET_HOME.items()}


def tonight_at(tonight, offset):
    """the mansion standing at slot 0 after `offset` sets, 1 to 28."""
    return ((tonight - 1 + offset) % 28) + 1


def t_eff(st): return tonight_at(st["tonight"], st["offset"])


def road(st):
    """the nine mansions visible, left to right."""
    t = t_eff(st)
    return [board_m(i, t) for i in range(9)]


# ------------------------------------------------------------------ the night
def new_game(C, you, sky, tonight, leader="you", rounds=ROUNDS, log=False):
    you = list(you); sky = list(sky)
    lead = mk_turn(C, you, sky, leader)              # the gate lodges before her lead
    return dict(C=C, slots=[None] * 9, you=you, sky=sky, tonight=tonight, offset=0,
                round=1, rounds=rounds, leader=lead, turn=lead, acted=0,
                bank={"you": 0, "sky": 0}, ret_used=False, glance_on=False, flips=0,
                over=False, log=[] if log else None)


def hand(st, side=None):
    side = side or st["turn"]
    return st["you"] if side == "you" else st["sky"]


def legal_moves(st):
    """(cid, slot, reversed) for the side to move; empty when it must pass."""
    if st["over"]: return []
    C = st["C"]; out = []
    for cid in hand(st):
        for rev in C.faces(cid):
            for i in range(9):
                if st["slots"][i] is None: out.append((cid, i, rev))
    return out


def _note(n, ev):
    if n["log"] is not None: n["log"] = n["log"] + [ev]


def place(st, cid, i, rev):
    """one placement by the side to move, then the end of the turn (and of the round)."""
    C = st["C"]; side = st["turn"]; t = t_eff(st)
    slots, f, ret = resolve_ret(C, st["slots"], cid, i, rev, side, t, st["ret_used"], st["glance_on"])
    n = dict(st); n["slots"] = slots; n["flips"] = st["flips"] + f
    if side == "you": n["you"] = [x for x in st["you"] if x != cid]
    else: n["sky"] = [x for x in st["sky"] if x != cid]
    if ret: n["you"] = n["you"] + list(ret); n["ret_used"] = True
    n["glance_on"] = (side == "you" and C[cid]["ab"] == "glance" and C.on(C[cid]))
    _note(n, ("place", side, cid, i, rev, board_m(i, t), f))
    return _end_turn(n)


def pass_turn(st):
    """the side to move has no card: the turn passes, the round still ends."""
    n = dict(st)
    _note(n, ("pass", st["turn"]))
    return _end_turn(n)


def _end_turn(n):
    n["acted"] = n["acted"] + 1
    n["turn"] = "sky" if n["turn"] == "you" else "you"
    if n["acted"] >= 2: n = advance(n)
    return n


def advance(st):
    """the end of a round: the leftmost sets and is banked, the road moves, the next
    mansion rises with its planet if she still holds it; after the last round, dawn."""
    C = st["C"]; t = t_eff(st); slots = st["slots"]
    n = dict(st)
    cx = ctx(C, slots, t)
    w, who = slot_w(C, slots, 0, cx, t)
    bank = dict(st["bank"])
    if who: bank[who] += w
    n["bank"] = bank
    _note(n, ("set", board_m(0, t), slots[0]["id"] if slots[0] else None, who, w))
    n["slots"] = slots[1:] + [None]
    n["offset"] = st["offset"] + 1
    n["acted"] = 0; n["turn"] = st["leader"]; n["round"] = st["round"] + 1
    t2 = t_eff(n); m = board_m(8, t2)
    pid = PLANET_AT.get(m)
    if pid is not None and pid in n["sky"]:
        s2, f, ret = resolve_ret(C, n["slots"], pid, 8, False, "sky", t2, n["ret_used"], False)
        n["slots"] = s2; n["flips"] = n["flips"] + f
        n["sky"] = [x for x in n["sky"] if x != pid]
        if ret: n["you"] = n["you"] + list(ret); n["ret_used"] = True
        _note(n, ("rise", m, pid, f))
    else:
        _note(n, ("rise", m, None, 0))
    if n["round"] > n["rounds"]:
        y, s = counts(C, n["slots"], t2)
        bank = dict(n["bank"]); bank["you"] += y; bank["sky"] += s; n["bank"] = bank
        n["over"] = True
        _note(n, ("dawn", y, s))
    return n


def totals(st):
    """(yours, hers): the bank plus what the road would bank if dawn came now."""
    if st["over"]: return st["bank"]["you"], st["bank"]["sky"]
    y, s = counts(st["C"], st["slots"], t_eff(st))
    return st["bank"]["you"] + y, st["bank"]["sky"] + s


def margin(st):
    y, s = totals(st)
    return y - s


def winner(st):
    """True when you win the night: the larger bank, a tie yours (TIERULE)."""
    y, s = st["bank"]["you"], st["bank"]["sky"]
    if y != s: return y > s
    return TIERULE == "you"


def step(st, mv):
    """apply a move tuple, or None for a pass."""
    return pass_turn(st) if mv is None else place(st, *mv)


# ------------------------------------------------------------------ agents
def _reply_best(st, side, depth):
    """the best margin, from `side`'s view, after one reply (a forced pass counts as the
    reply, so the set it causes is seen)."""
    moves = legal_moves(st)
    if not moves:
        m = margin(pass_turn(st)); return m if side == "you" else -m
    best = None
    for cid, i, rev in moves:
        m = margin(place(st, cid, i, rev)); m = m if side == "you" else -m
        if best is None or m > best: best = m
    return best


def agent_move(st, depth):
    """the v1 reader on the moving road: score = margin now x 10 - the opponent's best
    reply margin x depth; strict >, first best in hand order, face false then true, slot
    ascending. Returns (cid, slot, rev, score, state after) or None when the side must pass."""
    side = st["turn"]; opp = "sky" if side == "you" else "you"
    moves = legal_moves(st)
    if not moves: return None
    best = None
    for cid, i, rev in moves:
        n = place(st, cid, i, rev)
        m = margin(n); m = m if side == "you" else -m
        score = m * 10
        if depth > 0 and not n["over"]:
            score -= _reply_best(n, opp, depth) * depth
        if best is None or score > best[3]:
            best = (cid, i, rev, score, n)
    return best


def you_move(st, you_depth=8):
    assert st["turn"] == "you"
    return agent_move(st, you_depth)


def sky_move(st, depth=8):
    assert st["turn"] == "sky"
    return agent_move(st, depth)


def play_out(st, you_depth=8, depth=8, trace=None):
    """play a night out from a position with the agents; returns the final state."""
    guard = 0
    while not st["over"] and guard < 60:
        guard += 1
        mv = agent_move(st, you_depth if st["turn"] == "you" else depth)
        if mv is None: st = pass_turn(st)
        else:
            st = mv[4]
            if trace is not None: trace.append(margin(st))
    return st


def play_board(C, you, sky, tonight, leader="you", you_depth=8, depth=8, log=False):
    """the v1 entry point, on the moving road: a whole night, both agents."""
    trace = []
    st = play_out(new_game(C, you, sky, tonight, leader, log=log), you_depth, depth, trace)
    return dict(win=winner(st), you=st["bank"]["you"], sky=st["bank"]["sky"], flips=st["flips"],
                slots=st["slots"], trace=trace, bank=st["bank"], log=st["log"], offset=st["offset"])


def finish(st, you_depth=8, depth=8):
    """True if you win the night from this position with the agents playing it out."""
    return winner(play_out(st, you_depth, depth))


# ------------------------------------------------------------------ perfect play
def state_key(st):
    """a position, as the memo sees it: ages above 1 are one age (only age <= 1 is read, by
    the Veil and the Chamber), and the bank enters as its margin."""
    sl = []
    for s in st["slots"]:
        if s is None: sl.append(None); continue
        sl.append((s["id"], s["owner"], s["l"], s["r"], min(s.get("age", 0), 2),
                   bool(s.get("first")), bool(s.get("clawed")), bool(s.get("flocked")),
                   bool(s.get("glanced")), s.get("came"), s.get("ground")))
    return (tuple(sl), tuple(sorted(st["you"])), tuple(sorted(st["sky"])), st["ret_used"],
            st["glance_on"], st["turn"], st["acted"], st["offset"],
            st["bank"]["you"] - st["bank"]["sky"])


class Solver:
    """boolean minimax with a memo, both sides perfect: True when you win the night. The
    children of a node are built once and tried greedy-first (the largest margin for the
    side to move, stable, so the reader's own first choice among equals stays first); a
    side with no card passes. `cap` stops the search after that many nodes (Budget)."""
    class Budget(Exception): pass

    def __init__(self, C, cap=None):
        self.C = C; self.memo = {}; self.nodes = 0; self.cap = cap

    def solve(self, st):
        self.nodes += 1
        if self.cap and self.nodes > self.cap: raise Solver.Budget()
        if st["over"]: return winner(st)
        k = state_key(st)
        if k in self.memo: return self.memo[k]
        side = st["turn"]
        moves = legal_moves(st)
        if not moves:
            r = self.solve(pass_turn(st)); self.memo[k] = r; return r
        kids = [place(st, cid, i, rev) for cid, i, rev in moves]
        if side == "you": kids.sort(key=lambda n: -margin(n))
        else: kids.sort(key=margin)
        if side == "you":
            for n in kids:
                if self.solve(n):
                    self.memo[k] = True; return True
            self.memo[k] = False; return False
        for n in kids:
            if not self.solve(n):
                self.memo[k] = False; return False
        self.memo[k] = True; return True


def solve_empty(C, you, sky, tonight, leader, rounds=ROUNDS, cap=None):
    """(you win under perfect play, nodes); raises Solver.Budget past `cap` nodes."""
    s = Solver(C, cap)
    r = s.solve(new_game(C, you, sky, tonight, leader, rounds))
    return r, s.nodes


# ------------------------------------------------------------------ a night, read aloud
def narrate(C, res):
    """the log of a played night as lines an engineer reads (the report's feel paragraph
    is written from these; nothing here is a traveler's surface)."""
    name = lambda cid: C[cid]["name"]
    out = []
    for ev in res["log"] or []:
        if ev[0] == "place":
            _, side, cid, i, rev, m, f = ev
            out.append("%-4s %-18s @%d%s on %s%s" % (side, name(cid), i, " rev" if rev else "",
                       name(m), ("  flips %d" % f) if f else ""))
        elif ev[0] == "pass": out.append("%-4s passes" % ev[1])
        elif ev[0] == "set":
            _, m, cid, who, w = ev
            out.append("     %s sets: %s" % (name(m), ("%s banks %d (%s)" % (who, w, name(cid))) if who else "nothing banked"))
        elif ev[0] == "rise":
            _, m, pid, f = ev
            out.append("     %s rises%s" % (name(m), (" with %s standing on it%s" % (name(pid), ("  flips %d" % f) if f else "")) if pid else ""))
        elif ev[0] == "dawn":
            out.append("     dawn: the road sets, %d to you and %d to her" % (ev[1], ev[2]))
    out.append("     bank %d to %d, %s" % (res["bank"]["you"], res["bank"]["sky"], "you win" if res["win"] else "she wins"))
    return out


if __name__ == "__main__":
    import sys
    C = Cards(own_all=True)
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    leader = sys.argv[2] if len(sys.argv) > 2 else "you"
    r = play_board(C, [6, 10, 17, 18, 5], list(SKY_HAND), n, leader, 8, 8, log=True)
    print("night %d, %s leads, road %s" % (n, leader, [board_m(i, n) for i in range(9)]))
    print("\n".join(narrate(C, r)))
