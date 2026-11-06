"""Twenty-eight signatures, one per mansion, implemented against the 21 Aug port.

Patches manzil_sim_cur's face / try_flip / resolve / counts / sky_move. Import this
module and call install() to switch them on; uninstall() restores the shipped engine.

Six families:
  THE STRONG   conditional +1 to their own faces
  THE COVERED  cannot be taken under a condition
  THE REACH    act past their own neighbour
  THE COUNT    weigh more at the count
  THE TURN     change their faces, or what they are worth once taken
  THE MEDDLE   change the numbers or the ground around them
"""
import manzil_sim_cur as m

SIG28 = {
    1: "gate",      2: "bearer",   3: "stars",    4: "follower", 5: "blaze",
    6: "storm",     7: "twins",    8: "ghost",    9: "glance",  10: "throne",
    11: "mane",    12: "turning", 13: "hand",    14: "jewel",   15: "veil",
    16: "claws",   17: "crown",   18: "heart",   19: "root",    20: "flock",
    21: "district",22: "listener",23: "drum",    24: "emptiness",
    25: "hideaway",26: "chamber", 27: "guide",   28: "thread",
}
FAMILY = {
    "THE STRONG":  ["heart", "blaze", "follower", "mane", "drum"],
    "THE COVERED": ["storm", "jewel", "veil", "chamber", "bearer"],
    "THE REACH":   ["claws", "hand", "thread", "glance", "listener"],
    "THE COUNT":   ["crown", "stars", "flock", "district", "gate", "twins"],
    "THE TURN":    ["throne", "turning", "ghost"],
    "THE MEDDLE":  ["hideaway", "emptiness", "root", "guide"],
}
_o = {}   # originals


def owned28(lvl=3):
    """every mansion signed, at `lvl`."""
    return {cid: (lvl, SIG28[cid]) for cid in range(1, 29)}


def _lodged(slots):
    return [s for s in slots if s is not None]


# ------------------------------------------------------------------ faces
def face(R, slots, idx, side):
    s = slots[idx]
    v = s[1] if side == "l" else s[2]
    c = R.cards[s[0]]
    ab = c["ab"]
    if s[3] != 0:
        return v                              # signatures are the player's; her planets use their own
    if ab == "heart" and m.heart_on(R, slots):
        v += 1
    elif ab == "follower":
        for d in (-1, 1):
            k = m.nb(idx, d)
            if k >= 0 and slots[k] is not None and slots[k][3] == 0 and k != idx:
                v += 1; break
    elif ab == "mane":
        top = max((max(x[1], x[2]) for x in _lodged(slots)), default=0)
        if max(s[1], s[2]) >= top:
            v += 1
    elif ab == "drum":
        if len(_lodged(slots)) % 2 == 0:
            v += 1
    return v


# ------------------------------------------------------------------ flips
def try_flip(R, slots, ai, ti, duel_log=None, d=None, tonight=None):
    a = slots[ai]; t = slots[ti]
    if t is None or t[3] == a[3]:
        return False
    right = (d == 1) if d is not None else (ti > ai)
    av = face(R, slots, ai, "r" if right else "l")
    tv = face(R, slots, ti, "l" if right else "r")
    aC = R.cards[a[0]]; tC = R.cards[t[0]]
    if duel_log is not None:
        duel_log.append((av, tv))

    defending = t[3] == 0                     # the player's card is being attacked
    if defending:
        # THE VEIL: cannot be taken on the side that shows its lower face
        if tC["ab"] == "veil":
            shown = t[1] if not right else t[2]
            if shown == min(t[1], t[2]):
                return False
        # THE CHAMBER: cannot be taken while both its neighbours are yours
        if tC["ab"] == "chamber":
            ns = [m.nb(ti, dd) for dd in (-1, 1)]
            live = [slots[k] for k in ns if k >= 0 and slots[k] is not None]
            if len(live) == 2 and all(x[3] == 0 for x in live):
                return False
        # THE BEARER: bears the blow. Nothing takes her by a single point.
        if tC["ab"] == "bearer" and av == tv + 1:
            return False

    a_storm = aC["ab"] == "storm" and aC["lvl"] >= 2
    t_storm = tC["ab"] == "storm" and tC["lvl"] >= 2
    stormface = t_storm if m.STORM_MODE in ("defensive", "home_def") else (
        (a_storm or t_storm) if m.STORM_MODE in ("both", "home_sym") else (
            a_storm if m.STORM_MODE == "offensive" else False))
    tie = (av == tv) and not stormface
    if not (av > tv or ((aC["ab"] == "storm" and a[3] == 0) or m.SAME) and tie):
        return False
    if tC["ab"] == "saturn":
        return False
    slots[ti] = (t[0], t[1], t[2], a[3], t[4])
    return "tie" if tie else True


# ------------------------------------------------------------------ placement
def resolve(R, board, cid, i, rev, duel_log=None, tonight=None):
    c = R.cards[cid]
    slots = list(board)
    l, r = (c["r"], c["l"]) if rev else (c["l"], c["r"])
    slots[i] = (cid, l, r, c["who"], c["ab"] == "blaze")
    ab = c["ab"] if c["who"] == 0 else None

    # VENUS keeps its shipped behaviour
    if c["ab"] == "venus":
        for d in (-1, 1):
            t = m.nb(i, d)
            if t < 0 or slots[t] is None: continue
            s2 = slots[t]
            if R.cards[s2[0]]["ab"] == "jewel" and s2[3] == 0: continue
            if d == 1:
                if s2[1] > 1: slots[t] = (s2[0], s2[1] - 1, s2[2], s2[3], s2[4])
            else:
                if s2[2] > 1: slots[t] = (s2[0], s2[1], s2[2] - 1, s2[3], s2[4])

    # THE ROOT: the card it faces drops one on that side
    if ab == "root":
        for d in (-1, 1):
            t = m.nb(i, d)
            if t < 0 or slots[t] is None or slots[t][3] == 0: continue
            s2 = slots[t]
            if R.cards[s2[0]]["ab"] == "jewel": continue
            if d == 1 and s2[1] > 1: slots[t] = (s2[0], s2[1] - 1, s2[2], s2[3], s2[4])
            elif d == -1 and s2[2] > 1: slots[t] = (s2[0], s2[1], s2[2] - 1, s2[3], s2[4])

    # THE GLANCE: her strongest card on the road drops one on the face turned toward you
    if ab == "glance":
        best = None
        for k, s2 in enumerate(slots):
            if s2 is None or s2[3] == 0 or k == i: continue
            v = max(s2[1], s2[2])
            if best is None or v > best[0]: best = (v, k)
        if best:
            k = best[1]; s2 = slots[k]
            if k > i and s2[1] > 1: slots[k] = (s2[0], s2[1] - 1, s2[2], s2[3], s2[4])
            elif k < i and s2[2] > 1: slots[k] = (s2[0], s2[1], s2[2] - 1, s2[3], s2[4])

    queue = []
    for d in (-1, 1):
        t = m.nb(i, d)
        if t >= 0: queue.append((i, t, d))
    # THE HAND: reaches one slot further on the side that shows its higher face
    if ab == "hand":
        d = 1 if r >= l else -1
        far = m.nb(m.nb(i, d), d) if m.nb(i, d) >= 0 else -1
        if far >= 0: queue.append((i, far, d))
    # THE THREAD: while it stands at an end, the ends of the road are neighbours
    if ab == "thread" and i in (0, 8):
        other = 8 if i == 0 else 0
        queue.append((i, other, 1 if i == 0 else -1))

    flips = 0; seen = 0
    while queue and seen < 40:
        seen += 1
        fr, to, d = queue.pop(0)
        if to < 0 or slots[fr] is None: continue
        res = try_flip(R, slots, fr, to, duel_log, d, tonight)
        if not res: continue
        flips += 1
        fab = R.cards[slots[fr][0]]["ab"]
        # THE CLAWS reach past what they have taken; MARS keeps its shipped chain
        if fab in ("mars", "claws"):
            far = m.nb(to, d)
            if far >= 0 and far != fr: queue.append((to, far, d))
        if m.COMBO and res == "tie":
            for d2 in (-1, 1):
                nxt = m.nb(to, d2)
                if nxt >= 0 and nxt != fr: queue.append((to, nxt, d2))

    # THE TURNING: turns its faces when the road is half full
    if len(_lodged(slots)) == 5:
        for k, s2 in enumerate(slots):
            if s2 is not None and s2[3] == 0 and R.cards[s2[0]]["ab"] == "turning":
                slots[k] = (s2[0], s2[2], s2[1], s2[3], s2[4])
    return tuple(slots), flips


# ------------------------------------------------------------------ the count
def counts(R, board, tonight):
    you = sky = 0
    guide = any(s is not None and s[3] == 0 and R.cards[s[0]]["ab"] == "guide" for s in board)
    voids = [k for k, s in enumerate(board)
             if s is not None and s[3] == 0 and R.cards[s[0]]["ab"] == "emptiness"]
    for i, s in enumerate(board):
        if s is None: continue
        c = R.cards[s[0]]
        ab = c["ab"] if s[3] == 0 else None
        mine = (s[3] == 0 or s[4])

        # THE GHOST: taken, it counts for no one
        if c["ab"] == "ghost" and s[3] != c["who"]:
            continue

        w = 1 + (1 if c["ab"] == "jupiter" else 0)

        # dominion, unless THE VOID stands beside it
        beside_void = any(abs(i - k) == 1 for k in voids)
        if R.dominion and c["home"] == ((tonight - 1 + i) % 28) + 1 and not beside_void:
            w += 2 if (guide and mine) else 1     # THE GUIDE leads them home

        if c["ab"] == "crown" and i in (0, 8): w += 1

        if ab == "stars":                          # one more for each of yours beside it
            for d in (-1, 1):
                k = m.nb(i, d)
                if k >= 0 and board[k] is not None and board[k][3] == 0: w += 1
        elif ab == "flock":                        # two while three of yours stand in a row
            run = 1
            for d in (-1, 1):
                k = m.nb(i, d)
                while k >= 0 and board[k] is not None and board[k][3] == 0:
                    run += 1; k = m.nb(k, d)
            if run >= 3: w += 1
        elif ab == "district":                     # three while it stands alone
            alone = all(not (m.nb(i, d) >= 0 and board[m.nb(i, d)] is not None
                             and board[m.nb(i, d)][3] == 0) for d in (-1, 1))
            if alone: w += 2
        elif ab == "gate":                         # two while nothing stands before it
            if all(board[k] is None for k in range(0, i)): w += 1
        elif ab == "twins":                        # two beside its like
            if any(k != i and board[k] is not None and board[k][3] == 0
                   and {board[k][1], board[k][2]} == {s[1], s[2]} for k in range(9)):
                w += 1

        if mine: you += w
        else: sky += w
    return you, sky


# ------------------------------------------------------------------ her choice
def sky_move(R, board, sky, hand, tonight):
    """THE LISTENER draws her: she prefers a slot beside it, all else equal."""
    ears = [k for k, s in enumerate(board)
            if s is not None and s[3] == 0 and R.cards[s[0]]["ab"] == "listener"]
    best = None; bestsc = None
    full_after = sum(1 for s in board if s is None) == 1
    for cid in sky:
        c = R.cards[cid]
        revs = (False, True) if c["ab"] == "mercury" else (False,)
        for i in range(9):
            if not m.legal_slot(board, i): continue
            for rev in revs:
                b2, _ = resolve(R, board, cid, i, rev, None, tonight)
                y, s = counts(R, b2, tonight)
                if len(hand) > 0 and not full_after:
                    reply = m.best_you_reply(R, b2, hand, tonight)
                    sc = (s - y) * 10 - (0 if reply is None else reply) * m.REPLY_W
                else:
                    sc = (s - y) * 10
                sc += (c["l"] + c["r"]) * 0.1 + (8 - i) * 0.01
                if ears and any(abs(i - k) == 1 for k in ears): sc += 3.0
                if best is None or sc > bestsc: best = (cid, i, rev); bestsc = sc
    return best


def install():
    if _o: return
    for n in ("face", "try_flip", "resolve", "counts", "sky_move"):
        _o[n] = getattr(m, n)
    m.face, m.try_flip, m.resolve, m.counts, m.sky_move = face, try_flip, resolve, counts, sky_move


def uninstall():
    for n, f in _o.items():
        setattr(m, n, f)
    _o.clear()
