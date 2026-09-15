#!/usr/bin/env python3
"""Manzil v6 — a port of the deployed prototype as pushed 22 Aug 2026 (manzil/index.html,
commit b515c3c "all 28 signatures live, pack-of-twelve deal").

Ported method for method from _cards / _on / _faceOf / _noSoften / _safeNow / _lodge /
_tryFlip / _resolve / _ctx / _slotW / _counts / _boardWinner / _skyMove / _deal / _replyW.

Conformance: 33/33 on the vectors in research/manzil-engine-v6.js (run them with
research/v6vectors.py), and cell-exact against that engine on every measured configuration.

Still not modelled: the Hand ("may move once") and the Guide ("may trade grounds") are
player-activated and the agents never fire them, so those two play as vanilla. The Gate,
the Return and the Glance are automatic in the engine and are implemented here.
"""
import random, itertools

POOL = [("The Gate",6,5),("The Bearer",6,4),("The Gathered Stars",7,6),("The Follower",7,7),
        ("The Blaze",5,6),("The Storm",8,5),("The Return",7,6),("The Ghost",6,6),
        ("The Glance",4,6),("The Throne",6,9),("The Mane",6,5),("The Turning",7,5),
        ("The Hand",7,4),("The Jewel",7,7),("The Veil",8,2),("The Claws",6,6),
        ("The Crown",6,6),("The Heart",7,7),("The Root",7,6),("The Flock",6,6),
        ("The Empty District",2,8),("The Listener",7,4),("The Drum",4,7),("The Void",9,2),
        ("The Hideaway",5,6),("The Chamber",7,5),("The Guide",6,5),("The Thread",5,6)]
ABS = {1:"gate",2:"bearer",3:"gathered",4:"follower",5:"blaze",6:"storm",7:"return",
       8:"ghost",9:"glance",10:"throne",11:"mane",12:"turning",13:"hand",14:"jewel",
       15:"veil",16:"claws",17:"crown",18:"heart",19:"root",20:"flock",21:"district",
       22:"listener",23:"drum",24:"void",25:"hideaway",26:"chamber",27:"guide",28:"thread"}
CHART_FIVE = [5, 6, 10, 17, 18]
PLANET_HOME = {101:26, 102:14, 103:22, 104:8, 105:2}
PLANETS = {101:("Saturn",9,5,"saturn"),102:("Mars",8,6,"mars"),103:("Venus",4,7,"venus"),
           104:("Mercury",6,5,"mercury"),105:("Jupiter",7,8,"jupiter")}
SKY_HAND = (101,102,103,104,105)
REPLY_W = 8
TIERULE = "you"


def rebase(l, r):
    """the 22 aug re-baseline: every card carries what used to be its L3 numbers."""
    if l <= r: return min(9, l + 1), r
    return l, min(9, r + 1)


class Cards:
    def __init__(self, own_all=True, level=0, owned_ids=None):
        self.c = {}
        owned = {cid: 2 for cid in (owned_ids if owned_ids is not None else CHART_FIVE)}
        if own_all:
            for i in range(1, 29): owned.setdefault(i, 2)
        for idx, (nm, l0, r0) in enumerate(POOL):
            cid = idx + 1
            l, r = rebase(l0, r0)
            lvl = owned.get(cid, 1)
            if level: lvl = level if cid in owned else 1
            self.c[cid] = dict(name=nm, l=l, r=r, who="you", lvl=lvl, loan=cid not in owned,
                               ab=ABS[cid] if cid in owned else None,
                               two=(cid == 10 and cid in owned), home=cid)
        for pid, (nm, l, r, ab) in PLANETS.items():
            self.c[pid] = dict(name=nm, l=l, r=r, who="sky", lvl=3, loan=False, ab=ab,
                               two=False, home=PLANET_HOME[pid])
        for idx, (nm, l0, r0) in enumerate(POOL):        # walkers carry the re-baselined numbers
            l, r = rebase(l0, r0)
            self.c[200 + idx + 1] = dict(name=nm, l=l, r=r, who="sky", lvl=1, loan=False,
                                         ab=None, two=False, home=idx + 1)

    def __getitem__(self, k): return self.c[k]

    def on(self, c):
        return bool(c["ab"]) and (c["who"] == "sky" or (c["lvl"] >= 2 and not c["loan"]))

    def faces(self, cid):
        c = self.c[cid]
        return (False, True) if (c["two"] or c["ab"] == "mercury") else (False,)


def nb(i, d, L=9):
    k = i + d
    return k if 0 <= k < L else -1


def board_m(i, tonight): return ((tonight - 1 + i) % 28) + 1
def is_home(C, cid, i, tonight): return C[cid]["home"] == board_m(i, tonight)


def has_awake(C, slots, ab, own):
    return any(s and s["owner"] == own and C[s["id"]]["ab"] == ab and C.on(C[s["id"]])
               for s in slots)


def no_soften(C, slots, i):
    s = slots[i]
    if not s: return False
    c = C[s["id"]]
    if c["ab"] == "jewel" and C.on(c): return True
    return has_awake(C, slots, "heart", s["owner"])


def face_of(C, slots, i, d):
    s = slots[i]
    if not s: return 0
    c = C[s["id"]]
    v = s["r"] if d == 1 else s["l"]
    if c["ab"] == "follower" and C.on(c) and d == -1:
        k = nb(i, -1)
        if k >= 0 and slots[k]: v = max(v, slots[k]["r"])
    dd = 0; own = s["owner"]
    if c["ab"] == "mane" and C.on(c):
        a, b = nb(i, -1), nb(i, 1)
        if a >= 0 and b >= 0 and slots[a] and slots[b]: dd += 1
    if c["ab"] == "root" and C.on(c) and s.get("first"): dd += 1
    if s.get("clawed"): dd -= 1
    if s.get("flocked"): dd += 1
    if s.get("glanced"): dd -= 1
    filled = sum(1 for x in slots if x)
    for e in (-1, 1):
        k = nb(i, e)
        if k < 0 or not slots[k]: continue
        n = C[slots[k]["id"]]
        if not C.on(n): continue
        if n["ab"] == "bearer" and slots[k]["owner"] == own: dd += 1
        if n["ab"] == "ghost" and slots[k]["owner"] != own and filled < 5: dd -= 1
    if dd < 0 and no_soften(C, slots, i): dd = 0
    return max(1, v + dd)


def safe_now(C, slots, ti, ai):
    t = slots[ti]
    if not t: return False
    c = C[t["id"]]; age = t.get("age", 0)
    if c["ab"] == "veil" and C.on(c) and age <= 1: return True
    if c["ab"] == "void" and C.on(c):
        n = sum(1 for d in (-1, 1) if nb(ti, d) >= 0 and slots[nb(ti, d)])
        if n <= 1: return True
    if age <= 1:
        for d in (-1, 1):
            k = nb(ti, d)
            if k < 0 or not slots[k] or slots[k]["owner"] != t["owner"]: continue
            n = C[slots[k]["id"]]
            if n["ab"] == "chamber" and C.on(n): return True
    return False


def try_flip(C, slots, ai, ti, d, tonight):
    a, t = slots[ai], slots[ti]
    if not t or t["owner"] == a["owner"]: return False
    aC, tC = C[a["id"]], C[t["id"]]
    av = face_of(C, slots, ai, d); tv = face_of(C, slots, ti, -d)
    storm_face = tC["ab"] == "storm" and C.on(tC) and is_home(C, t["id"], ti, tonight)
    tie = (av == tv) and not storm_face
    if not (av > tv or tie): return False
    if tC["ab"] == "saturn": return False
    if safe_now(C, slots, ti, ai): return False
    if tC["ab"] == "return" and C.on(tC) and t.get("came") is False: return "return"
    t["owner"] = a["owner"]
    if tC["ab"] == "claws" and C.on(tC): slots[ai] = dict(slots[ai], clawed=True)
    if aC["ab"] == "flock" and C.on(aC):
        for e in (-1, 1):
            k = nb(ai, e)
            if k >= 0 and slots[k] and slots[k]["owner"] == a["owner"]:
                slots[k] = dict(slots[k], flocked=True)
    return "tie" if tie else True


def lodge(C, slots_in, cid, i, rev, side, ret_used=False, glance_on=False):
    c = C[cid]; own = side or c["who"]
    slots = [dict(x, age=x.get("age", 0) + 1) if x else None for x in slots_in]
    first = not any(x and x["owner"] == own for x in slots_in)
    slots[i] = dict(id=cid, l=(c["r"] if rev else c["l"]), r=(c["l"] if rev else c["r"]),
                    owner=own, age=0, first=first)
    if glance_on and glance_on != own: slots[i]["glanced"] = True
    if c["ab"] == "blaze" and C.on(c): slots[i]["ground"] = own
    if c["ab"] == "return" and C.on(c):
        slots[i]["came"] = bool(ret_used)
    if c["ab"] == "turning" and C.on(c):
        best, bv = -1, 0
        for d in (-1, 1):
            k = nb(i, d)
            if k < 0 or not slots[k] or slots[k]["owner"] == own: continue
            f = slots[k]["l"] if d == 1 else slots[k]["r"]
            b = slots[k]["r"] if d == 1 else slots[k]["l"]
            if f > b and f - b > bv: bv, best = f - b, k
        if best >= 0:
            slots[best] = dict(slots[best], l=slots[best]["r"], r=slots[best]["l"], turned=True)
    if c["ab"] == "venus":
        for d in (-1, 1):
            t = nb(i, d)
            if t < 0 or not slots[t]: continue
            if no_soften(C, slots, t): continue
            key = "l" if d == 1 else "r"
            if slots[t][key] > 1: slots[t] = dict(slots[t], **{key: slots[t][key] - 1})
    return slots


def mk_turn(C, you, sky, leader):
    """mkGame's opening rule: the gate lodges before her lead."""
    has_gate = lambda ids: any(C.on(C[i]) and C[i]["ab"] == "gate" for i in ids)
    if leader == "sky" and has_gate(you): return "you"
    if leader == "you" and has_gate(sky): return "sky"
    return leader


def resolve_ret(C, board, cid, i, rev, side, tonight, ret_used=False, glance_on=False):
    slots = lodge(C, board, cid, i, rev, side, ret_used, glance_on)
    ret = []
    queue = []
    _own = side or C[cid]["who"]                          # the listener strikes what lands
    if True:
        for d in (-1, 1):
            k = nb(i, d)
            if k >= 0 and slots[k] and slots[k]["owner"] != _own:
                n = C[slots[k]["id"]]
                if n["ab"] == "listener" and C.on(n): queue.append((k, i, -d))
    queue.append((i, nb(i, -1), -1)); queue.append((i, nb(i, 1), 1))
    flips = 0; guard = 0
    while queue and guard < 60:
        guard += 1
        fr, to, d = queue.pop(0)
        if to < 0 or not slots[fr] or not slots[to]: continue
        res = try_flip(C, slots, fr, to, d, tonight)
        if not res: continue
        if res == "return":
            flips += 1; ret.append(slots[to]["id"]); slots[to] = None; continue
        flips += 1
        if res == "tie":
            for d2 in (-1, 1):
                far = nb(to, d2)
                if far >= 0 and far != fr: queue.append((to, far, d2))
        fab = C[slots[fr]["id"]]["ab"]
        if fab == "mars" or (fab == "drum" and C.on(C[slots[fr]["id"]])):
            far = nb(to, d)
            if far >= 0: queue.append((to, far, d))
    return slots, flips, ret


def resolve(C, board, cid, i, rev, side, tonight, ret_used=False, glance_on=False):
    s, f, _r = resolve_ret(C, board, cid, i, rev, side, tonight, ret_used, glance_on)
    return s, f


def ctx(C, slots, tonight):
    thread = None
    for s in slots:
        if s and C[s["id"]]["ab"] == "thread" and C.on(C[s["id"]]):
            thread = s.get("ground") or s["owner"]
    sil = {}
    for i, s in enumerate(slots):
        if not s: continue
        c = C[s["id"]]
        if c["ab"] != "hideaway" or not C.on(c): continue
        own = s.get("ground") or s["owner"]
        best, bw = -1, -1
        for d in (-1, 1):
            k = nb(i, d)
            if k < 0 or not slots[k]: continue
            w, who = slot_w(C, slots, k, None, tonight)
            if who and who != own and w > bw: bw, best = w, k
        if best >= 0: sil[best] = True
    return thread, sil


def slot_w(C, slots, i, cx, tonight):
    s = slots[i]
    if not s: return 0, None
    thread, sil = cx if cx else (None, {})
    if sil.get(i): return 0, None
    c = C[s["id"]]
    home = is_home(C, s["id"], i, tonight)
    w = 1 + (1 if c["ab"] == "jupiter" else 0) + (1 if home else 0)
    own = s.get("ground") or s["owner"]
    if C.on(c):
        if c["ab"] == "gathered": w += 1
        if c["ab"] == "crown" and i in (0, 8): w += 1
        if c["ab"] == "district":
            touch = any(nb(i, d) >= 0 and slots[nb(i, d)] and
                        (slots[nb(i, d)].get("ground") or slots[nb(i, d)]["owner"]) == own
                        for d in (-1, 1))
            if not touch: w += 1
    who = own
    if thread and i in (0, 8): who = thread
    return w, who


def counts(C, slots, tonight):
    cx = ctx(C, slots, tonight)
    you = sky = 0
    for i in range(9):
        w, who = slot_w(C, slots, i, cx, tonight)
        if not who: continue
        if who == "you": you += w
        else: sky += w
    return you, sky


def board_winner(C, slots, tonight):
    y, s = counts(C, slots, tonight)
    if y != s: return y > s
    return TIERULE == "you"


# ------------------------------------------------------------------ agents
# ported from manzil-engine-v6.js youMove / skyMove / playBoard / deal.
# both sides are deterministic: strict > on the score, so the FIRST best in
# (hand order, rev false-then-true, slot ascending) wins. No positional nudge,
# no random tiebreak -- the reference engine has neither.
def legal(slots): return [i for i in range(9) if slots[i] is None]


def best_you_reply(C, slots, hand, tonight, ret_used=False, glance_on=False):
    best = None
    for cid in hand:
        for rev in ((False, True) if C[cid]["two"] else (False,)):
            for i in legal(slots):
                b2, _f = resolve(C, slots, cid, i, rev, "you", tonight, ret_used, glance_on)
                y, s = counts(C, b2, tonight)
                if best is None or y - s > best: best = y - s
    return best


def sky_move(C, slots, sky, you, tonight, depth, ret_used=False, glance_on=False):
    best = None
    for cid in sky:
        for rev in ((False, True) if C[cid]["ab"] == "mercury" else (False,)):
            for i in legal(slots):
                b2, f, ret = resolve_ret(C, slots, cid, i, rev, "sky", tonight,
                                         ret_used, glance_on)
                y, s = counts(C, b2, tonight)
                score = (s - y) * 10
                if depth > 0:
                    rep = best_you_reply(C, b2, you, tonight, ret_used, glance_on)
                    if rep is not None: score -= rep * depth
                if best is None or score > best[3]:
                    best = (cid, i, rev, score, b2, f, ret)
    return best


def you_move(C, slots, you, sky, tonight, you_depth, ret_used=False, glance_on=False):
    best = None
    for cid in you:
        for rev in ((False, True) if C[cid]["two"] else (False,)):
            for i in legal(slots):
                b2, f, ret = resolve_ret(C, slots, cid, i, rev, "you", tonight,
                                         ret_used, glance_on)
                y, s = counts(C, b2, tonight)
                score = (y - s) * 10
                if you_depth > 0:
                    worst = None
                    for sid in sky:
                        for si in legal(b2):
                            b3, _f = resolve(C, b2, sid, si, False, "sky", tonight,
                                             ret_used, glance_on)
                            y2, s2 = counts(C, b3, tonight)
                            if worst is None or s2 - y2 > worst: worst = s2 - y2
                    if worst is not None: score -= worst * you_depth
                if best is None or score > best[3]:
                    best = (cid, i, rev, score, b2, f, ret)
    return best


# ------------------------------------------------------------------ the deal
def deal(pack, seed, tonight, guarantee=True):
    """exact port of the engine's xorshift deal, so hands match cell for cell."""
    if not pack or len(pack) <= 5: return list(pack or [])
    h = (seed ^ 2166136261) & 0xFFFFFFFF
    def rnd():
        nonlocal h
        h ^= (h << 13) & 0xFFFFFFFF; h &= 0xFFFFFFFF
        h ^= (h >> 17)
        h ^= (h << 5) & 0xFFFFFFFF; h &= 0xFFFFFFFF
        return h / 4294967296.0
    bag = list(pack); out = []
    if guarantee is not False and tonight in bag:
        out.append(bag.pop(bag.index(tonight)))
    while len(out) < 5 and bag:
        out.append(bag.pop(int(rnd() * len(bag))))
    return out


def play_board(C, you, sky, tonight, leader="you", you_depth=8, depth=8):
    """exact port of playBoard, including the gate's lead and the return to hand."""
    slots = [None] * 9
    you = list(you); sky = list(sky)
    turn = mk_turn(C, you, sky, leader)
    ret_used = False; glance_on = False
    flips = 0; guard = 0
    while any(s is None for s in slots) and (you or sky) and guard < 40:
        guard += 1
        side = turn
        if side == "you":
            mv = you_move(C, slots, you, sky, tonight, you_depth, ret_used, glance_on) if you else None
        else:
            mv = sky_move(C, slots, sky, you, tonight, depth, ret_used, glance_on) if sky else None
        if mv is None:
            turn = "sky" if side == "you" else "you"; continue
        cid, i, rev, score, b2, f, ret = mv
        slots = b2; flips += f
        if side == "you": you.remove(cid)
        else: sky.remove(cid)
        if ret: you += list(ret); ret_used = True
        glance_on = side if (C[cid]["ab"] == "glance" and C.on(C[cid])) else False
        turn = "sky" if side == "you" else "you"
    y, s = counts(C, slots, tonight)
    return dict(win=board_winner(C, slots, tonight), you=y, sky=s, flips=flips, slots=slots)
