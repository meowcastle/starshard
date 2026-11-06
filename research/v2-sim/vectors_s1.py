#!/usr/bin/env python3
"""vectors_s1.py: the Moving Sky's vectors (S1), run beside the 33 conformance vectors.

    python3 research/v2-sim/vectors_s1.py              # engine_v2: 33 + the S1 vectors
    python3 research/v2-sim/vectors_s1.py --snapshot   # rewrite the three agent snapshots

The rule vectors are authored by hand from MANZIL-TCG.md section 1.1 and the S1 packet,
each expectation worked out from the rule before the engine ran it, in the style of
base/v6vectors.py: a scripted position, one call, one value compared as a string. The three
agent vectors (youMove, skyMove, playBoard over 28 nights, both depths) are snapshots of
engine_v2 itself, kept in vectors_s1.json: a regression guard for this engine and the
expectation C2's JS port must meet, not conformance to an outside reference (there is none
for v2 yet). Exit code 0 only when every vector passes.
"""
import importlib, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
TWELVE = [6, 10, 17, 18, 5, 4, 3, 19, 7, 26, 12, 14]
SKY = [101, 102, 103, 104, 105]
VECTORS = []


def vec(name, want):
    def deco(f):
        VECTORS.append((name, f, want)); return f
    return deco


def S(cid, owner, l, r, age=0, **kw):
    d = dict(id=cid, owner=owner, l=l, r=r, age=age, first=False); d.update(kw); return d


def game(v, tonight=1, you=(), sky=(), leader="you"):
    return v.new_game(v.Cards(own_all=True), list(you), list(sky), tonight, leader, log=True)


def rounds(v, st, k):
    """k rounds of two passes (both hands empty), each ending in a set."""
    for _ in range(2 * k): st = v.pass_turn(st)
    return st


@vec("the road moves: after one set slot 0 shows the next mansion", "2,3,4,5,6,7,8,9,10")
def _(v):
    st = rounds(v, game(v, 1), 1)
    return ",".join(map(str, v.road(st)))


@vec("the leftmost sets and is banked by its holder", 1)
def _(v):
    st = game(v, 1); st["slots"][0] = S(13, "you", 7, 5, 2)   # the hand, not at home
    return rounds(v, st, 1)["bank"]["you"]


@vec("a card scores at set, not at placement", "0/0/1")
def _(v):
    st = game(v, 1, you=[13], sky=[])
    a = v.place(st, 13, 2, False)                 # your turn ends; her pass ends the round
    b = v.pass_turn(a)                            # set 1: slot 0 was empty
    c = rounds(v, b, 2)                           # set 2 is empty too; set 3 is the hand's
    return "%d/%d/%d" % (a["bank"]["you"], b["bank"]["you"], c["bank"]["you"])


@vec("dominion banks two at set", 2)
def _(v):
    st = game(v, 1); st["slots"][0] = S(1, "you", 6, 5, 2)    # the gate on its own mansion
    return rounds(v, st, 1)["bank"]["you"]


@vec("a card taken before its set banks for its taker", "sky:1")
def _(v):
    st = game(v, 1, you=[], sky=[101], leader="sky")
    st["slots"][0] = S(13, "you", 7, 5, 2)
    st = v.place(st, 101, 1, False)               # saturn's 9 against the hand's 5
    st = v.pass_turn(st)
    return "%s:%d" % ("sky" if st["bank"]["sky"] else "none", st["bank"]["sky"])


@vec("the rising mansion carries its planet", "105 sky, hand 4")
def _(v):
    st = rounds(v, game(v, 21, sky=SKY), 1)       # road 21..28,1; the bearer rises: jupiter
    s = st["slots"][8]
    return "%d %s, hand %d" % (s["id"], s["owner"], len(st["sky"]))


@vec("a planet already played does not rise again", "empty")
def _(v):
    st = rounds(v, game(v, 21, sky=[101, 102, 103, 104]), 1)
    return "empty" if st["slots"][8] is None else st["slots"][8]["id"]


@vec("the arriving planet fights what it stands beside", "sky")
def _(v):
    st = game(v, 21, sky=SKY); st["slots"][8] = S(9, "you", 5, 6, 3)   # the glance, aged
    st = rounds(v, st, 1)                          # it moves to 7; jupiter's 7 against its 6
    return st["slots"][7]["owner"]


@vec("a round is two turns: the set follows the follower", "0/1")
def _(v):
    st = game(v, 1, you=[13], sky=[101])
    a = v.place(st, 13, 4, False); b = v.place(a, 101, 5, False)
    return "%d/%d" % (a["offset"], b["offset"])


@vec("a side with no card passes and the round still ends", 1)
def _(v):
    st = game(v, 1, you=[], sky=[101])
    st = v.pass_turn(st); st = v.place(st, 101, 4, False)
    return st["offset"]


@vec("the leader places first in every round", "you,sky,you,sky")
def _(v):
    st = game(v, 1, you=[13, 14], sky=[101, 102])
    out = []
    for _ in range(4):
        out.append(st["turn"]); st = v.place(st, v.hand(st)[0], v.legal_moves(st)[0][1], False)
    return ",".join(out)


@vec("the gate lodges before her lead", "you")
def _(v):
    return game(v, 1, you=[1], sky=[101], leader="sky")["leader"]


@vec("six sets, then dawn sets the road", "6 sets, dawn 1/0, over")
def _(v):
    st = game(v, 1); st["slots"][7] = S(13, "you", 7, 5, 2)   # reaches slot 1 by dawn
    st = rounds(v, st, 6)
    sets = sum(1 for e in st["log"] if e[0] == "set")
    return "%d sets, dawn %d/%d, %s" % (sets, st["bank"]["you"], st["bank"]["sky"], "over" if st["over"] else "open")


@vec("the night is yours on a tied bank", "you")
def _(v):
    st = rounds(v, game(v, 1), 6); st["bank"] = {"you": 3, "sky": 3}
    return "you" if v.winner(st) else "sky"


@vec("the thread holds the setting edge", "you:1")
def _(v):
    st = game(v, 1); st["slots"][0] = S(101, "sky", 9, 5, 2); st["slots"][4] = S(28, "you", 6, 6, 2)
    st = rounds(v, st, 1)
    return "you:%d" % st["bank"]["you"] if st["bank"]["sky"] == 0 else "sky:%d" % st["bank"]["sky"]


@vec("the hideaway silences a set", "none")
def _(v):
    st = game(v, 1); st["slots"][0] = S(101, "sky", 9, 5, 2); st["slots"][1] = S(25, "you", 6, 6, 2)
    st = rounds(v, st, 1)
    return "none" if st["bank"]["sky"] == 0 else "sky:%d" % st["bank"]["sky"]


@vec("the margin is the bank plus the road", "3/1")
def _(v):
    st = game(v, 1); st["bank"] = {"you": 2, "sky": 0}; st["slots"][4] = S(13, "you", 7, 5, 2)
    st["slots"][6] = S(101, "sky", 9, 5, 2)
    y, s = v.totals(st); return "%d/%d" % (y, s)


# ------------------------------------------------------------------ agent snapshots
def mv(m):
    if m is None: return "none"
    return "%d@%d%s:%d" % (m[0], m[1], "r" if m[2] else "", m[3])


def scripted(v, C, n):
    """the P0.4 script on the moving road: hand[0] at 2n mod 9, saturn at (5n + 1) mod 9,
    hand[1] at (7n + 2) mod 9 (the first set falls between), you leading."""
    hand = v.deal(TWELVE, n, n, True)
    st = v.new_game(C, hand, SKY, n, "you")
    def place(cid, pref):
        nonlocal st
        i = pref
        while st["slots"][i] is not None: i = (i + 1) % 9
        st = v.place(st, cid, i, False)
    place(hand[0], (n * 2) % 9); place(101, (n * 5 + 1) % 9); place(hand[1], (n * 7 + 2) % 9)
    return st


def vec_you_move(v):
    C = v.Cards(own_all=True); out = []
    for n in range(1, 29):
        st = scripted(v, C, n); st = v.pass_turn(st) if st["turn"] == "sky" else st
        out.append("n%d=%s/%s" % (n, mv(v.you_move(st, 8)), mv(v.you_move(st, 0))))
    return ";".join(out)


def vec_sky_move(v):
    C = v.Cards(own_all=True); out = []
    for n in range(1, 29):
        st = scripted(v, C, n)                     # after your second card it is her turn
        out.append("n%d=%s/%s" % (n, mv(v.sky_move(st, 8)), mv(v.sky_move(st, 0))))
    return ";".join(out)


def vec_play_board(v):
    C = v.Cards(own_all=True); out = []
    for n in range(1, 29):
        hand = v.deal(TWELVE, n, n, True); cells = []
        for leader in ("you", "sky"):
            for you_depth in (8, 0):
                r = v.play_board(C, hand, SKY, n, leader=leader, you_depth=you_depth, depth=8)
                cells.append("%s %d-%d f%d" % ("you" if r["win"] else "sky", r["you"], r["sky"], r["flips"]))
        out.append("n%d=%s" % (n, ",".join(cells)))
    return ";".join(out)


SNAPSHOTS = [("youMove on the moving road, 28 nights (snapshot)", vec_you_move, "youMove"),
             ("skyMove on the moving road, 28 nights (snapshot)", vec_sky_move, "skyMove"),
             ("playBoard, six sets, both leaders, both depths (snapshot)", vec_play_board, "playBoard")]
SNAP = os.path.join(HERE, "vectors_s1.json")


def first_diff(a, b):
    for x, y in zip(a.split(";"), b.split(";")):
        if x != y: return "got %s, want %s" % (x, y)
    return "lengths differ"


def run(engine_name="engine_v2"):
    sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, "base"))
    v = importlib.import_module(engine_name)
    sys.modules["manzil_v6"] = v
    out = list(importlib.import_module("v6vectors").run())
    for name, fn, want in VECTORS:
        try: got = fn(v)
        except Exception as e: got = "threw: %s: %s" % (type(e).__name__, e)
        out.append(dict(name=name, want=want, got=got, ok=str(got) == str(want)))
    want = json.load(open(SNAP)) if os.path.exists(SNAP) else {}
    for name, fn, key in SNAPSHOTS:
        try: got = fn(v)
        except Exception as e: got = "threw: %s: %s" % (type(e).__name__, e)
        if key not in want:
            out.append(dict(name=name, want="(no snapshot)", got=got[:40], ok=False)); continue
        ok = got == want[key]
        out.append(dict(name=name, want=want[key], got=got, ok=ok, note=None if ok else first_diff(got, want[key])))
    return out


def snapshot(engine_name="engine_v2"):
    sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, "base"))
    v = importlib.import_module(engine_name)
    d = dict(source="%s.py, S1 the Moving Sky, snapshot taken by vectors_s1.py --snapshot" % engine_name)
    for name, fn, key in SNAPSHOTS: d[key] = fn(v)
    json.dump(d, open(SNAP, "w"), indent=1); print("wrote", os.path.relpath(SNAP))


def main(argv):
    if "--snapshot" in argv:
        snapshot([a for a in argv[1:] if not a.startswith("--")][0] if len(argv) > 2 else "engine_v2"); return 0
    engine_name = argv[1] if len(argv) > 1 else "engine_v2"
    r = run(engine_name)
    n = sum(1 for x in r if x["ok"])
    print("%s.py: %d/%d pass (33 conformance + %d moving-sky vectors + %d agent snapshots)" % (
        engine_name, n, len(r), len(VECTORS), len(SNAPSHOTS)))
    for x in r:
        if not x["ok"]:
            print("  FAIL  %-58s %s" % (x["name"], x.get("note") or "want %s got %s" % (x["want"], x["got"])))
    return 0 if n == len(r) else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
