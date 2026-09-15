#!/usr/bin/env python3
"""
Manzil simulation — a faithful Python port of the rules in
`Manzil - Prototype.dc.html` (_resolve/_tryFlip/_counts/_skyMove/_bestYouReply),
plus a set of player agents and the measurement suite for the design review.

Run:  python3 manzil_sim.py [--quick]      (writes manzil-sim-results.json)

Conventions
  owner 0 = you (parchment), 1 = sky (amber)
  a slot is None or a tuple (card_id, l, r, owner, branded)
  board = tuple of 9 slots; slot i sits on mansion ((tonight-1+i) % 28)+1
"""
import sys, json, random, itertools, time, math
from functools import lru_cache

# ---------------------------------------------------------------- card data
# (name, l, r) — pool order == mansion id 1..28, straight from _cards()
POOL = [("The Gate", 6, 5), ("The Bearer", 6, 4), ("The Gathered Stars", 7, 6), ("The Follower", 7, 7),
        ("The Blaze", 5, 6), ("The Storm", 8, 5), ("The Return", 7, 6), ("The Ghost", 6, 6),
        ("The Glance", 4, 6), ("The Throne", 6, 9), ("The Mane", 6, 5), ("The Turning", 7, 5),
        ("The Hand", 7, 4), ("The Jewel", 7, 7), ("The Veil", 8, 2), ("The Claws", 6, 6),
        ("The Crown", 6, 6), ("The Heart", 7, 7), ("The Root", 7, 6), ("The Flock", 6, 6),
        ("The Empty District", 2, 8), ("The Listener", 7, 4), ("The Drum", 4, 7), ("The Void", 9, 2),
        ("The Hideaway", 5, 6), ("The Chamber", 7, 5), ("The Guide", 6, 5), ("The Thread", 5, 6)]
PLANETS = {101: ("Saturn", 9, 5, "saturn", 26), 102: ("Mars", 8, 6, "mars", 14), 103: ("Venus", 4, 7, "venus", 22),
           104: ("Mercury", 6, 5, "mercury", 8), 105: ("Jupiter", 7, 8, "jupiter", 2)}
SKY_HAND = (101, 102, 103, 104, 105)
TIERULE = "sky"  # who takes a tied count: "sky" | "you" | "anchor" (holder of slot 0)
STORM_STRIKE = False  # candidate: Storm attacks with +1 on its facing number
STORM_MODE = "off"  # "off" | "both" (shipped 20 Aug) | "defensive" (Storm cannot BE tied) | "offensive"
SAME = False     # ties flip (Triple Triad's Same rule), both sides
COMBO = False    # a card flipped by a tie then attacks its own neighbours
SHAPE = "road"   # "road" | "wrapped" | "contiguous"


def nb(i, d):
    if SHAPE == "wrapped": return (i + d + 9) % 9
    k = i + d
    return k if 0 <= k <= 8 else -1


def legal_slot(board, i):
    if board[i] is not None: return False
    if SHAPE != "contiguous": return True
    if all(x is None for x in board): return True
    return any(k >= 0 and board[k] is not None for k in (nb(i, -1), nb(i, 1)))
# the prototype's owned five: id -> (lvl, ability)
PROTO_OWNED = {5: (2, "blaze"), 6: (3, "storm"), 10: (2, "throne"), 17: (2, "crown"), 18: (2, "heart")}
ALL_L2 = {5: (2, "blaze"), 6: (2, "storm"), 10: (2, "throne"), 17: (2, "crown"), 18: (2, "heart"), 14: (2, "jewel")}
DEFAULT_FIVE = (6, 10, 17, 18, 5)
MINIMAX_TONIGHTS = (1, 5, 9, 13, 17, 21, 25) if "--quick" not in sys.argv else (1,)  # adversarial search is ~90 s/tonight; sampled
ALL_SIGS = ("storm", "heart", "blaze", "throne", "crown", "jewel", "saturn", "mars", "venus", "mercury", "jupiter", "dominion")


class Rules:
    """A card table + ability switches.  owned: {id: (lvl, ab)} for the player's cards;
    everything else is an L1 loaner. off: set of signature names disabled (ablation)."""

    def __init__(self, owned=None, off=(), all_vanilla=False):
        self.off = set(off)
        self.cards = {}
        for idx, (name, l, r) in enumerate(POOL):
            cid = idx + 1
            lvl, ab = (1, None)
            if owned and cid in owned and not all_vanilla:
                lvl, ab = owned[cid]
            if lvl >= 3:
                if l <= r: l = min(9, l + 1)
                else: r = min(9, r + 1)
            if lvl >= 4:
                l = min(9, l + 1); r = min(9, r + 1)
            if ab in self.off or lvl < 2: ab_eff = None
            else: ab_eff = ab
            self.cards[cid] = dict(name=name, l=l, r=r, who=0, ab=ab_eff, lvl=lvl,
                                   two=(ab_eff == "throne"), home=cid)
        for pid, (name, l, r, ab, home) in PLANETS.items():
            self.cards[pid] = dict(name=name, l=l, r=r, who=1, ab=(None if ab in self.off else ab),
                                   lvl=3, two=False, home=home)
        self.dominion = "dominion" not in self.off

    def faces(self, cid):
        c = self.cards[cid]
        return (False, True) if (c["two"] or c["ab"] == "mercury") else (False,)


# ---------------------------------------------------------------- engine
def heart_on(R, slots):
    """Heart burns (+1 both faces) while the sky holds more lodged mansions than you."""
    you = sum(1 for x in slots if x is not None and x[3] == 0)
    sky = sum(1 for x in slots if x is not None and x[3] == 1)
    return sky > you


def face(R, slots, idx, side):
    s = slots[idx]; v = s[1] if side == "l" else s[2]
    c = R.cards[s[0]]
    if s[3] == 0 and c["ab"] == "heart" and heart_on(R, slots): v += 1
    return v


def is_home(R, cid, idx, tonight):
    return R.cards[cid]["home"] == ((tonight - 1 + idx) % 28) + 1


def try_flip(R, slots, ai, ti, duel_log=None, d=None, tonight=None):
    a = slots[ai]; t = slots[ti]
    if t is None or t[3] == a[3]: return False
    right = (d == 1) if d is not None else (ti > ai)
    av = face(R, slots, ai, "r" if right else "l")
    tv = face(R, slots, ti, "l" if right else "r")
    aC = R.cards[a[0]]
    tC0 = R.cards[t[0]]
    storm = a[3] == 0 and aC["ab"] == "storm"
    if duel_log is not None: duel_log.append((av, tv))
    a_storm = aC["ab"] == "storm" and aC["lvl"] >= 2
    t_storm = tC0["ab"] == "storm" and tC0["lvl"] >= 2
    if STORM_MODE in ("home_def", "home_sym") and tonight is not None:
        a_storm = a_storm and is_home(R, a[0], ai, tonight)
        t_storm = t_storm and is_home(R, t[0], ti, tonight)
    if STORM_STRIKE and aC["ab"] == "storm" and aC["lvl"] >= 2: av += 1
    if STORM_MODE in ("both", "home_sym"): stormface = a_storm or t_storm
    elif STORM_MODE in ("defensive", "home_def"): stormface = t_storm
    elif STORM_MODE == "offensive": stormface = a_storm
    else: stormface = False
    tie = (av == tv) and not stormface
    wins = av > tv or ((storm or SAME) and tie)
    if not wins: return False
    tC = R.cards[t[0]]
    if tC["ab"] == "saturn": return False
    slots[ti] = (t[0], t[1], t[2], a[3], t[4])          # t[4] = ground stays yours (blaze), survives the flip
    return "tie" if tie else True


def resolve(R, board, cid, i, rev, duel_log=None, tonight=None):
    """Place card cid at empty slot i (rev = swap faces). Returns new board tuple + flip count."""
    c = R.cards[cid]
    slots = list(board)
    l, r = (c["r"], c["l"]) if rev else (c["l"], c["r"])
    slots[i] = (cid, l, r, c["who"], c["ab"] == "blaze")
    if c["ab"] == "venus":
        for d in (-1, 1):
            t = nb(i, d)
            if t < 0 or slots[t] is None: continue
            s2 = slots[t]
            if R.cards[s2[0]]["ab"] == "jewel" and s2[3] == 0: continue
            if d == 1:
                if s2[1] > 1: slots[t] = (s2[0], s2[1] - 1, s2[2], s2[3], s2[4])
            else:
                if s2[2] > 1: slots[t] = (s2[0], s2[1], s2[2] - 1, s2[3], s2[4])
    queue = []
    for d in (-1, 1):
        t = nb(i, d)
        if t >= 0: queue.append((i, t, d))
    flips = 0
    seen = 0
    while queue and seen < 40:
        seen += 1
        fr, to, d = queue.pop(0)
        if to < 0 or slots[fr] is None: continue
        res = try_flip(R, slots, fr, to, duel_log, d, tonight)
        if not res: continue
        flips += 1
        if R.cards[slots[fr][0]]["ab"] == "mars":
            far = nb(to, d)
            if far >= 0 and far != fr: queue.append((to, far, d))
        if COMBO and res == "tie":
            for d2 in (-1, 1):
                nxt = nb(to, d2)
                if nxt >= 0 and nxt != fr: queue.append((to, nxt, d2))
    return tuple(slots), flips


def counts(R, board, tonight):
    you = sky = 0
    for i, s in enumerate(board):
        if s is None: continue
        c = R.cards[s[0]]
        w = 1 + (1 if c["ab"] == "jupiter" else 0)
        if R.dominion and c["home"] == ((tonight - 1 + i) % 28) + 1: w += 1
        if c["ab"] == "crown" and i in (0, 8): w += 1
        if s[3] == 0 or s[4]: you += w
        else: sky += w
    return you, sky


def legal_moves(R, board, hand):
    out = []
    for cid in hand:
        for rev in R.faces(cid):
            for i in range(9):
                if legal_slot(board, i): out.append((cid, i, rev))
    return out


# ---------------------------------------------------------------- the sky (port of _skyMove)
def best_you_reply(R, board, hand, tonight):
    best = None
    for cid in hand:
        for rev in R.faces(cid):
            for i in range(9):
                if not legal_slot(board, i): continue
                b2, _ = resolve(R, board, cid, i, rev, None, tonight)
                y, s = counts(R, b2, tonight)
                sc = y - s
                if best is None or sc > best: best = sc
    return best


def sky_move(R, board, sky, hand, tonight):
    """Exactly _skyMove(): iteration order sky ids asc, slots asc, rev false first; strict > keeps first."""
    best = None; bestsc = None
    full_after = sum(1 for s in board if s is None) == 1
    for cid in sky:                       # sky list order = remaining of (101..105) in order
        c = R.cards[cid]
        revs = (False, True) if c["ab"] == "mercury" else (False,)
        for i in range(9):
            if not legal_slot(board, i): continue
            for rev in revs:
                b2, _ = resolve(R, board, cid, i, rev, None, tonight)
                y, s = counts(R, b2, tonight)
                if len(hand) > 0 and not full_after:
                    reply = best_you_reply(R, b2, hand, tonight)
                    sc = (s - y) * 10 - (0 if reply is None else reply) * 8
                else:
                    sc = (s - y) * 10
                sc += (c["l"] + c["r"]) * 0.1 + (8 - i) * 0.01
                if best is None or sc > bestsc: best = (cid, i, rev); bestsc = sc
    return best


# ---------------------------------------------------------------- player agents
def moves_scored_1ply(R, board, hand, tonight):
    res = []
    for (cid, i, rev) in legal_moves(R, board, hand):
        b2, _ = resolve(R, board, cid, i, rev, None, tonight)
        y, s = counts(R, b2, tonight)
        res.append(((cid, i, rev), y - s))
    return res


def best_sky_reply(R, board, sky, tonight):
    best = None
    for cid in sky:
        for rev in R.faces(cid):
            for i in range(9):
                if not legal_slot(board, i): continue
                b2, _ = resolve(R, board, cid, i, rev, None, tonight)
                y, s = counts(R, b2, tonight)
                if best is None or s - y > best: best = s - y
    return best


def moves_scored_2ply(R, board, hand, sky, tonight):
    """Mirror of the sky's own heuristic from your side."""
    res = []
    empties = sum(1 for s in board if s is None)
    for (cid, i, rev) in legal_moves(R, board, hand):
        b2, _ = resolve(R, board, cid, i, rev, None, tonight)
        y, s = counts(R, b2, tonight)
        if len(sky) > 0 and empties > 1:
            rep = best_sky_reply(R, b2, sky, tonight)
            sc = (y - s) * 10 - (0 if rep is None else rep) * 8
        else:
            sc = (y - s) * 10
        res.append(((cid, i, rev), sc))
    return res


def pick_best(scored, rng):
    top = max(sc for _, sc in scored)
    ties = [m for m, sc in scored if sc == top]
    return (rng.choice(ties) if rng else ties[0]), len(ties)


def player_random(R, board, hand, sky, tonight, rng, stats=None):
    mv = legal_moves(R, board, hand)
    return rng.choice(mv)


def player_1ply(R, board, hand, sky, tonight, rng, stats=None):
    sc = moves_scored_1ply(R, board, hand, tonight)
    m, nt = pick_best(sc, rng)
    if stats is not None: stats.append(("1ply", 5 - len(hand), len(sc), nt))
    return m


def player_2ply(R, board, hand, sky, tonight, rng, stats=None):
    sc = moves_scored_2ply(R, board, hand, sky, tonight)
    m, nt = pick_best(sc, rng)
    if stats is not None: stats.append(("2ply", 5 - len(hand), len(sc), nt))
    return m


# --- full adversarial minimax (win/loss) with alpha-beta + transposition + move ordering
def make_minimax(R, tonight):
    memo = {}
    full = lambda b: all(s is not None for s in b)

    def ordered(board, cards, who):
        mv = []
        for cid in cards:
            for rev in R.faces(cid):
                for i in range(9):
                    if not legal_slot(board, i): continue
                    b2, _ = resolve(R, board, cid, i, rev, None, tonight)
                    y, s = counts(R, b2, tonight)
                    mv.append(((y - s) if who == 0 else (s - y), b2, cid))
        mv.sort(key=lambda x: -x[0])
        return mv

    def value(board, hand, sky, you_to_move):
        """True iff YOU can force a board win from here (you_to_move says whose turn)."""
        key = (board, you_to_move)
        if key in memo: return memo[key]
        if full(board):
            y, s = counts(R, board, tonight); v = y > s; memo[key] = v; return v
        if you_to_move:
            if not hand: v = value(board, hand, sky, False); memo[key] = v; return v
            v = False
            for _, b2, cid in ordered(board, hand, 0):
                h2 = tuple(x for x in hand if x != cid)
                if value(b2, h2, sky, False): v = True; break
        else:
            if not sky: v = value(board, hand, sky, True); memo[key] = v; return v
            v = True
            for _, b2, cid in ordered(board, sky, 1):
                s2 = tuple(x for x in sky if x != cid)
                if not value(b2, hand, s2, True): v = False; break
        memo[key] = v
        return v

    def player(R_, board, hand, sky, tonight_, rng, stats=None):
        winning = []
        mv = legal_moves(R, board, hand)
        for (cid, i, rev) in mv:
            b2, _ = resolve(R, board, cid, i, rev, None, tonight)
            h2 = tuple(x for x in hand if x != cid)
            if value(b2, h2, sky, False):
                winning.append((cid, i, rev))
                if rng is None and stats is None: break
        if stats is not None: stats.append(("minimax", 5 - len(hand), len(mv), len(winning)))
        if winning: return rng.choice(winning) if rng else winning[0]
        # no forced win: fall back to the 2-ply heuristic
        return player_2ply(R, board, hand, sky, tonight, rng)

    player.memo = memo
    return player


# --- exact exploiter: searches YOUR moves against the real (deterministic) sky
def make_oracle(R, tonight):
    memo = {}

    def solve(board, hand, sky):
        """you to move; returns True if some line beats the actual sky AI."""
        key = (board, hand, sky)
        if key in memo: return memo[key]
        v = False
        for cid in hand:
            for rev in R.faces(cid):
                for i in range(9):
                    if not legal_slot(board, i): continue
                    b2, _ = resolve(R, board, cid, i, rev, None, tonight)
                    h2 = tuple(x for x in hand if x != cid)
                    if all(s is not None for s in b2):
                        y, s = counts(R, b2, tonight); ok = y > s
                    else:
                        sm = sky_move(R, b2, sky, h2, tonight)
                        b3, _ = resolve(R, b2, sm[0], sm[1], sm[2], None, tonight)
                        s2 = tuple(x for x in sky if x != sm[0])
                        if all(s is not None for s in b3):
                            y, s = counts(R, b3, tonight); ok = y > s
                        else:
                            ok = solve(b3, h2, s2)
                    if ok: v = True; break
                if v: break
            if v: break
        memo[key] = v
        return v

    def player(R_, board, hand, sky, tonight_, rng, stats=None):
        winning = []
        mv = legal_moves(R, board, hand)
        for (cid, i, rev) in mv:
            b2, _ = resolve(R, board, cid, i, rev, None, tonight)
            h2 = tuple(x for x in hand if x != cid)
            if all(s is not None for s in b2):
                y, s = counts(R, b2, tonight); ok = y > s
            else:
                sm = sky_move(R, b2, sky, h2, tonight)
                b3, _ = resolve(R, b2, sm[0], sm[1], sm[2], None, tonight)
                s2 = tuple(x for x in sky if x != sm[0])
                if all(s is not None for s in b3):
                    y, s = counts(R, b3, tonight); ok = y > s
                else:
                    ok = solve(b3, h2, s2)
            if ok: winning.append((cid, i, rev))
        if stats is not None: stats.append(("oracle", 5 - len(hand), len(mv), len(winning)))
        if winning: return winning[0]
        return player_2ply(R, board, hand, sky, tonight, rng)

    player.memo = memo
    return player


# ---------------------------------------------------------------- a board, a match
def play_board(R, hand, tonight, you_lead, player, rng, sky_agent=None, stats=None, duel_log=None, flip_log=None):
    """Returns (you_won, you_count, sky_count)."""
    board = tuple([None] * 9)
    hand = tuple(hand); sky = tuple(SKY_HAND)
    you_turn = you_lead
    while any(s is None for s in board):
        if you_turn:
            if not hand: you_turn = False; continue
            cid, i, rev = player(R, board, hand, sky, tonight, rng, stats)
            board, nf = resolve(R, board, cid, i, rev, duel_log, tonight)
            hand = tuple(x for x in hand if x != cid)
        else:
            if not sky: you_turn = True; continue
            if sky_agent is None:
                cid, i, rev = sky_move(R, board, sky, hand, tonight)
            else:
                cid, i, rev = sky_agent(R, board, sky, hand, tonight, rng)
            board, nf = resolve(R, board, cid, i, rev, duel_log, tonight)
            sky = tuple(x for x in sky if x != cid)
        if flip_log is not None: flip_log.append(nf)
        you_turn = not you_turn
    y, s = counts(R, board, tonight)
    if y != s: return y > s, y, s
    if TIERULE == "you": return True, y, s
    if TIERULE == "anchor": return (board[0] is not None and board[0][3] == 0), y, s
    return False, y, s   # ties go to the sky (prototype: you > sky ? "you" : "sky")


def play_match(R, hand, tonight, player, rng, stats=None):
    wins = [0, 0]; lead = True; boards = 0
    while max(wins) < 3:
        w, _, _ = play_board(R, hand, tonight, lead, player, rng, stats=stats)
        wins[0 if w else 1] += 1
        lead = not lead; boards += 1
    return wins[0] == 3, boards


# ---------------------------------------------------------------- measurement suite
def pct(x): return round(100 * x, 1)


def q1(results, quick):
    """default five at prototype levels vs the sky, all 28 tonights, both leads."""
    R = Rules(owned=PROTO_OWNED)
    out = {}
    agents = {"random": player_random, "1ply": player_1ply, "2ply": player_2ply,
              "1ply_rt": player_1ply, "2ply_rt": player_2ply}
    nrand = 40 if quick else 200
    nrt = 10 if quick else 40
    tiestat = {}
    for name, ag in agents.items():
        per_t = []; tied = 0; nb = 0
        for t in range(1, 29):
            wl = []
            for lead in (True, False):
                if name == "random":
                    rng = random.Random(1000 + t); w = 0
                    for _ in range(nrand):
                        r_ = play_board(R, DEFAULT_FIVE, t, lead, ag, rng); w += r_[0]; tied += (r_[1] == r_[2]); nb += 1
                    wl.append(w / nrand)
                elif name.endswith("_rt"):
                    rng = random.Random(2000 + t); w = 0
                    for _ in range(nrt):
                        r_ = play_board(R, DEFAULT_FIVE, t, lead, ag, rng); w += r_[0]; tied += (r_[1] == r_[2]); nb += 1
                    wl.append(w / nrt)
                else:
                    r_ = play_board(R, DEFAULT_FIVE, t, lead, ag, None)
                    wl.append(1.0 if r_[0] else 0.0); tied += (r_[1] == r_[2]); nb += 1
            per_t.append(wl)
        out[name] = per_t; tiestat[name] = tied / nb
    out["tie_rate"] = tiestat
    # exact exploiter (oracle) and adversarial minimax
    tset = range(1, 29) if not quick else range(1, 29, 7)
    per_o = {}; per_m = {}
    for t in tset:
        t0 = time.time()
        orc = make_oracle(R, t)
        wl = []
        for lead in (True, False):
            wl.append(1.0 if play_board(R, DEFAULT_FIVE, t, lead, orc, None)[0] else 0.0)
        per_o[t] = wl
        wl2 = None
        if t in MINIMAX_TONIGHTS:
            mm = make_minimax(R, t)
            wl2 = []
            for lead in (True, False):
                wl2.append(1.0 if play_board(R, DEFAULT_FIVE, t, lead, mm, None)[0] else 0.0)
            per_m[t] = wl2
            pass
        print(f"  q1 t={t} oracle={wl} minimax={wl2} ({time.time()-t0:.1f}s, memo {len(orc.memo)})", file=sys.stderr)
    out["oracle"] = per_o; out["minimax"] = per_m
    # match-level (best of 5) for the heuristic agents
    matches = {}
    for name, ag in agents.items():
        mw = 0; nb = 0; n = 0
        for t in range(1, 29):
            reps = 1 if name in ("1ply", "2ply") else (10 if quick else 50)
            rng = random.Random(77 + t)
            for _ in range(reps):
                w, b = play_match(R, DEFAULT_FIVE, t, ag, None if name in ("1ply", "2ply") else rng)
                mw += w; nb += b; n += 1
        matches[name] = dict(match_win=mw / n, boards_per_match=nb / n)
    out["matches"] = matches
    results["q1"] = out


def q2(results, quick):
    """card choice: vanilla L1 hands, 2-ply player, all 28 tonights x 2 leads."""
    R = Rules(all_vanilla=True)
    rng = random.Random(42)
    allhands = list(itertools.combinations(range(1, 29), 5))
    nsample = 150 if quick else 1500
    sample = rng.sample(allhands, nsample)
    tset = list(range(1, 29)) if not quick else [1, 8, 15, 22]

    def hand_rate(h):
        w = 0; n = 0
        for t in tset:
            for lead in (True, False):
                w += play_board(R, h, t, lead, player_2ply, None)[0]; n += 1
        return w / n
    rates = {}
    t0 = time.time()
    for k, h in enumerate(sample):
        rates[h] = hand_rate(h)
        if k % 100 == 0: print(f"  q2 {k}/{nsample} {time.time()-t0:.0f}s", file=sys.stderr)
    # hill-climb from the best sampled hands to look for a dominant five
    best = max(rates, key=rates.get)
    improved = True; cur = best; cur_r = rates[cur]; steps = 0
    while improved and steps < 40:
        improved = False
        for idx in range(5):
            for c in range(1, 29):
                if c in cur: continue
                h = tuple(sorted(cur[:idx] + (c,) + cur[idx + 1:]))
                if h in rates: r = rates[h]
                else: r = hand_rate(h); rates[h] = r
                if r > cur_r: cur, cur_r, improved = h, r, True
        steps += 1
    # also the default five at L1 vanilla and the sky-like hand
    for h in [tuple(sorted(DEFAULT_FIVE))]:
        if h not in rates: rates[h] = hand_rate(h)
    vals = sorted(rates.values())
    card_use = {c: [] for c in range(1, 29)}
    for h, r in rates.items():
        for c in h: card_use[c].append(r)
    results["q2"] = dict(
        n=len(rates), best=cur, best_rate=cur_r, sampled_best=best, sampled_best_rate=rates[best],
        default_five_rate=rates[tuple(sorted(DEFAULT_FIVE))],
        mean=sum(vals) / len(vals), min=vals[0], max=vals[-1],
        pcts={p: vals[int(p / 100 * (len(vals) - 1))] for p in (5, 25, 50, 75, 95)},
        within5=sum(1 for v in vals if v >= cur_r - 0.05) / len(vals),
        within10=sum(1 for v in vals if v >= cur_r - 0.10) / len(vals),
        top10=sorted(rates.items(), key=lambda kv: -kv[1])[:10],
        bottom5=sorted(rates.items(), key=lambda kv: kv[1])[:5],
        card_mean={c: (sum(v) / len(v) if v else None) for c, v in card_use.items()},
    )



def q2b(results):
    """supplement to q2: exact-exploiter (oracle) board win rate for a few vanilla hands at 7 tonights x 2 leads,
    to separate 'the hand is weak' from 'the 2-ply agent is weak'."""
    R = Rules(all_vanilla=True)
    hands = {"best_found (Storm,Veil,Heart,EmptyDistrict,Void)": (6, 15, 18, 21, 24),
             "default_five_L1 (Blaze,Storm,Throne,Crown,Heart)": (5, 6, 10, 17, 18),
             "balanced_sixes (Ghost,Claws,Crown,Flock,Gate)": (8, 16, 17, 20, 1),
             "all_sevens (Follower,Jewel,Heart,GatheredStars,Return)": (4, 14, 18, 3, 7),
             "a_zero_hand (Glance,Mane,Hand,Void,Thread)": (9, 11, 13, 24, 28),
             "lowest_totals (Bearer,Glance,Drum,Hand,Listener)": (2, 9, 23, 13, 22)}
    out = {}
    for label, h in hands.items():
        w = 0; n = 0; w2 = 0
        for t in (1, 5, 9, 13, 17, 21, 25):
            orc = make_oracle(R, t)
            for lead in (True, False):
                w += play_board(R, h, t, lead, orc, None)[0]; n += 1
                w2 += play_board(R, h, t, lead, player_2ply, None)[0]
        out[label] = dict(oracle=w / n, p2=w2 / n)
        print("  q2b", label, out[label], file=sys.stderr)
    results["q2b"] = out


def q3(results):
    """number space."""
    R = Rules(all_vanilla=True)
    cards = [(i + 1, n, l, r) for i, (n, l, r) in enumerate(POOL)]
    # dominance (L1 vanilla, numbers only)
    dominated = {}
    for (a, an, al, ar) in cards:
        doms = [bn for (b, bn, bl, br) in cards if b != a and bl >= al and br >= ar and (bl > al or br > ar)]
        if doms: dominated[an] = doms
    # Saturn (9|5)
    beat_sat_from_left = [n for (_, n, l, r) in cards if r > 9]   # your r vs Saturn's l=9 (standing left of Saturn)
    beat_sat_from_right = [n for (_, n, l, r) in cards if l > 5]  # your l vs Saturn's r=5 (standing right of Saturn)
    safe_from_saturn_left = [n for (_, n, l, r) in cards if r >= 9]   # Saturn to your right attacks your r with 9
    safe_from_saturn_right = [n for (_, n, l, r) in cards if l >= 5]  # Saturn to your left attacks your l with 5
    # all pairwise duels: your card (face) vs each planet face
    ties = 0; tot = 0; you_win = 0
    for (_, n, l, r) in cards:
        for pid, (pn, pl, pr, ab, home) in PLANETS.items():
            # you stand left of planet: your r vs its l ; you stand right: your l vs its r
            for (mine, theirs) in ((r, pl), (l, pr)):
                tot += 1; ties += (mine == theirs); you_win += (mine > theirs)
    # empirical ties in simulated play (2-ply default five and random)
    Rp = Rules(owned=PROTO_OWNED)
    dl = []; fl = []
    for t in range(1, 29):
        for lead in (True, False):
            play_board(Rp, DEFAULT_FIVE, t, lead, player_2ply, None, duel_log=dl, flip_log=fl)
    dl2 = []
    rng = random.Random(3)
    for t in range(1, 29):
        for _ in range(20):
            play_board(Rp, DEFAULT_FIVE, t, True, player_random, rng, duel_log=dl2)
    dl3 = []
    for t in range(1, 29):
        for lead in (True, False):
            play_board(R, (4, 14, 18, 10, 24), t, lead, player_2ply, None, duel_log=dl3)
    results["q3"] = dict(
        dominated=dominated,
        n_dominated=len(dominated),
        beat_sat_from_left=beat_sat_from_left, beat_sat_from_right=beat_sat_from_right,
        safe_from_saturn_left=safe_from_saturn_left, safe_from_saturn_right=safe_from_saturn_right,
        static_tie_rate=ties / tot, static_you_win_rate=you_win / tot, static_n=tot,
        play_ties_2ply=sum(1 for a, b in dl if a == b) / len(dl), play_duels_2ply=len(dl),
        play_ties_random=sum(1 for a, b in dl2 if a == b) / len(dl2),
        play_ties_vanilla=sum(1 for a, b in dl3 if a == b) / len(dl3),
        flips_per_turn=sum(fl) / len(fl), turns_with_flip=sum(1 for x in fl if x) / len(fl),
        totals=sorted([(l + r, n) for (_, n, l, r) in cards], reverse=True),
    )


def q4(results, quick):
    """first-move advantage."""
    R = Rules(owned=PROTO_OWNED)
    out = {}
    # vs the sky AI, split by lead
    for name, ag in (("1ply", player_1ply), ("2ply", player_2ply)):
        wl = {True: 0, False: 0}
        for t in range(1, 29):
            for lead in (True, False):
                wl[lead] += play_board(R, DEFAULT_FIVE, t, lead, ag, None)[0]
        out[f"vs_sky_{name}"] = dict(lead=wl[True] / 28, follow=wl[False] / 28)
    rng = random.Random(9); wl = {True: 0, False: 0}; n = 60 if quick else 300
    for t in range(1, 29):
        for lead in (True, False):
            for _ in range(n): wl[lead] += play_board(R, DEFAULT_FIVE, t, lead, player_random, rng)[0]
    out["vs_sky_random"] = dict(lead=wl[True] / (28 * n), follow=wl[False] / (28 * n))
    # symmetric: both sides play vanilla mansion cards, no sigs, no dominion; mirror agents
    Rv = Rules(all_vanilla=True, off=ALL_SIGS)
    # make a "sky" that uses mansion cards too: we emulate by giving the sky player_X with the same hand
    rngh = random.Random(11)
    hands = [tuple(rngh.sample(range(1, 29), 10)) for _ in range(40 if quick else 200)]
    sym = {}; k = 0
    for name, ag in (("1ply", player_1ply), ("2ply", player_2ply), ("random", player_random)):
        lead_w = 0; n = 0; ties = 0
        for hs in hands:
            h1, h2 = hs[:5], hs[5:]
            # play twice swapping roles; 'you' = first agent; sky agent uses mirror heuristic on mansion cards.
            for (hy, hsky) in ((h1, h2), (h2, h1)):
                for lead in (True, False):
                    k += 1
                    w, y, s = play_symmetric(Rv, hy, hsky, lead, ag, random.Random(5 + k))
                    # leader wins if (you lead and y>s) or (sky leads and y<s); y==s is a tie (goes to sky in the real game)
                    if y == s: ties += 1
                    lead_w += (y > s) if lead else (y < s); n += 1
        sym[name] = dict(lead_win=lead_w / n, tie=ties / n, follow_win=1 - lead_w / n - ties / n)
    out["symmetric_lead_win"] = sym
    results["q4"] = out


def play_symmetric(R, hy, hs, you_lead, agent, rng):
    """both sides hold vanilla mansion cards (no signatures, no dominion). The sky's copies are ids 200+cid.
    R2: real perspective (your cards who=0, sky's who=1).  R3: mirrored (for the sky's agent call)."""
    R2 = Rules(all_vanilla=True, off=ALL_SIGS); R3 = Rules(all_vanilla=True, off=ALL_SIGS)
    for cid in hs:
        c = dict(R2.cards[cid]); c["who"] = 1; R2.cards[200 + cid] = c
        c3 = dict(R3.cards[cid]); c3["who"] = 0; R3.cards[200 + cid] = c3
    for cid in hy:
        R3.cards[cid]["who"] = 1
    skyhand = tuple(200 + c for c in hs)
    board = tuple([None] * 9); hand = tuple(hy); sky = skyhand; you_turn = you_lead
    while any(s is None for s in board):
        if you_turn:
            if hand:
                cid, i, rev = agent(R2, board, hand, sky, 1, rng)
                board, _ = resolve(R2, board, cid, i, rev); hand = tuple(x for x in hand if x != cid)
        else:
            if sky:
                fb = tuple(None if s is None else (s[0], s[1], s[2], 1 - s[3], s[4]) for s in board)
                cid, i, rev = agent(R3, fb, sky, hand, 1, rng)
                board, _ = resolve(R2, board, cid, i, rev); sky = tuple(x for x in sky if x != cid)
        you_turn = not you_turn
    y, s = counts(R2, board, 1)
    return y > s, y, s


def q5(results, quick):
    """ablation of each signature, default five at prototype levels, 2-ply + 1-ply + random players."""
    out = {}
    nrand = 30 if quick else 150

    nrt = 8 if quick else 25

    def rate(R, ag, rng_seed=None, reps=1):
        w = 0; n = 0
        for t in range(1, 29):
            for lead in (True, False):
                if rng_seed is not None:
                    rng = random.Random(rng_seed + t)
                    for _ in range(reps): w += play_board(R, DEFAULT_FIVE, t, lead, ag, rng)[0]; n += 1
                else:
                    w += play_board(R, DEFAULT_FIVE, t, lead, ag, None)[0]; n += 1
        return w / n
    for label, off in [("baseline", ())] + [(s, (s,)) for s in ALL_SIGS] + \
                      [("no_sky_sigs", ("saturn", "mars", "venus", "mercury", "jupiter")),
                       ("no_your_sigs", ("storm", "heart", "blaze", "throne")),
                       ("all_off", ALL_SIGS)]:
        R = Rules(owned=PROTO_OWNED, off=off)
        out[label] = dict(p2=rate(R, player_2ply), p1=rate(R, player_1ply), rnd=rate(R, player_random, 500, nrand),
                          p2r=rate(R, player_2ply, 900, nrt), p1r=rate(R, player_1ply, 950, nrt))
        print(f"  q5 {label} {out[label]}", file=sys.stderr)
    results["q5"] = out


def q6(results):
    """decision density."""
    R = Rules(owned=PROTO_OWNED)
    st = []
    for t in range(1, 29):
        for lead in (True, False):
            play_board(R, DEFAULT_FIVE, t, lead, player_2ply, None, stats=st)
            play_board(R, DEFAULT_FIVE, t, lead, player_1ply, None, stats=st)
    st_o = []
    for t in (1, 5, 9, 13, 17, 21, 25):
        orc = make_oracle(R, t)
        for lead in (True, False):
            play_board(R, DEFAULT_FIVE, t, lead, orc, None, stats=st_o)
    L2 = [x for x in st if x[0] == "2ply"]; L1 = [x for x in st if x[0] == "1ply"]
    def by_turn(L, f):
        return [f([x for x in L if x[1] == k]) for k in range(5)]
    mean = lambda xs: (sum(xs) / len(xs)) if xs else None
    results["q6"] = dict(
        avg_legal=mean([x[2] for x in L2]),
        legal_by_turn=by_turn(L2, lambda L: mean([x[2] for x in L])),
        unique_best_2ply=mean([x[3] == 1 for x in L2]), avg_ties_2ply=mean([x[3] for x in L2]),
        ties_by_turn_2ply=by_turn(L2, lambda L: mean([x[3] for x in L])),
        unique_best_1ply=mean([x[3] == 1 for x in L1]), avg_ties_1ply=mean([x[3] for x in L1]),
        ties_by_turn_1ply=by_turn(L1, lambda L: mean([x[3] for x in L])),
        oracle_turns=len(st_o),
        oracle_no_win=mean([x[3] == 0 for x in st_o]),
        oracle_unique=mean([x[3] == 1 for x in st_o]),
        oracle_avg_winning=mean([x[3] for x in st_o]),
        oracle_frac_winning=mean([x[3] / x[2] for x in st_o]),
        oracle_by_turn=by_turn(st_o, lambda L: dict(win_frac=mean([x[3] / x[2] for x in L]), none=mean([x[3] == 0 for x in L]), n_win=mean([x[3] for x in L]))),
    )


def q7(results):
    """length + wall clock."""
    R = Rules(owned=PROTO_OWNED)
    fl = []
    for t in range(1, 29):
        for lead in (True, False):
            play_board(R, DEFAULT_FIVE, t, lead, player_2ply, None, flip_log=fl)
    flips_per_turn = sum(fl) / len(fl)
    # expected boards in best-of-5 for per-board win prob p (alternating leads handled via p_lead/p_follow)
    def exp_boards(pl, pf):
        # enumerate sequences
        from functools import lru_cache
        @lru_cache(None)
        def f(w, l, lead):
            if w == 3 or l == 3: return 0, (w == 3) * 1.0
            p = pl if lead else pf
            b1, m1 = f(w + 1, l, not lead); b2, m2 = f(w, l + 1, not lead)
            return 1 + p * b1 + (1 - p) * b2, p * m1 + (1 - p) * m2
        return f(0, 0, True)
    q1r = results.get("q1", {})
    rows = {}
    for name in ("random", "1ply", "2ply"):
        if name in q1r:
            pl = sum(x[0] for x in q1r[name]) / 28; pf = sum(x[1] for x in q1r[name]) / 28
            eb, mw = exp_boards(pl, pf)
            rows[name] = dict(p_lead=pl, p_follow=pf, exp_boards=eb, match_win=mw)
    for p in (0.3, 0.5, 0.7):
        eb, mw = exp_boards(p, p); rows[f"p={p}"] = dict(p_lead=p, p_follow=p, exp_boards=eb, match_win=mw)
    # timing model from the prototype's timers (ms)
    T = dict(deal=1100, ai_first=1300, ai_after_you=800, drop=320, flip=400, finish=260, round_end=1300,
             round_screen=3800, round_exit=340)
    think = 4000  # assumption: human decision time per turn
    per_turn_anim = T["drop"] + T["finish"] + flips_per_turn * T["flip"]
    you_turn = think + per_turn_anim
    sky_turn = T["ai_after_you"] + per_turn_anim
    board_ms = T["deal"] + 5 * you_turn + 4 * sky_turn + T["round_end"]  # ~ you lead; sky lead adds 1300-800
    between = T["round_screen"] + T["round_exit"]
    results["q7"] = dict(turns_per_board=9, flips_per_turn=flips_per_turn, think_ms=think,
                         board_ms=board_ms, between_ms=between, rows=rows,
                         match_ms={k: v["exp_boards"] * board_ms + (v["exp_boards"] - 1) * between for k, v in rows.items()},
                         timers=T)


def main():
    quick = "--quick" in sys.argv
    part = "all"
    for a in sys.argv:
        if a.startswith("--part="): part = a.split("=", 1)[1]
    results = {}
    t0 = time.time()
    if part in ("all", "A"):
        q3(results); print("q3 done", file=sys.stderr)
        q1(results, quick); print(f"q1 done {time.time()-t0:.0f}s", file=sys.stderr)
        q4(results, quick); print(f"q4 done {time.time()-t0:.0f}s", file=sys.stderr)
        q6(results); print(f"q6 done {time.time()-t0:.0f}s", file=sys.stderr)
        q7(results); print(f"q7 done {time.time()-t0:.0f}s", file=sys.stderr)
        q5(results, quick); print(f"q5 done {time.time()-t0:.0f}s", file=sys.stderr)
    if part in ("all", "B"):
        q2(results, quick); print(f"q2 done {time.time()-t0:.0f}s", file=sys.stderr)
    if part in ("all", "C"):
        q2b(results); print(f"q2b done {time.time()-t0:.0f}s", file=sys.stderr)
    out = "/home/claude/manzil-sim-results%s.json" % ("" if part == "all" else "-" + part)
    with open(out, "w") as f:
        json.dump(results, f, indent=1, default=str)
    print("wrote", out, file=sys.stderr)


if __name__ == "__main__":
    main()
