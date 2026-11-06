#!/usr/bin/env python3
"""The three agent vectors (youMove, skyMove, playBoard) beside the 33, so the engine gate
covers the agents: 36 in all, every expectation taken from the v6 JS reference.

    node research/v2-sim/agents_ref.cjs       # refresh vectors_agents.json from the reference
    python3 research/v2-sim/vectors_agents.py            # engine_v1, prints 36/36 pass
    python3 research/v2-sim/vectors_agents.py engine_v2  # a later engine

Each agent vector is one string over all 28 nights, so a single wrong tiebreak on any
night fails it. The positions are scripted with resolve (covered by the 33), never with an
agent, so each vector tests one agent alone: every card owned at level 2, the twelve
dealt with seed = night, her hand Saturn to Jupiter, then hand[0] at slot 2n mod 9, Saturn
at (5n + 1) mod 9, hand[1] at (7n + 2) mod 9, each to the next free slot if taken.
youMove and skyMove are asked at depth 8 and at depth 0 (careful and casual); playBoard is
played from the empty board for both leaders at both depths. Exit code 0 only on 36/36.
"""
import importlib, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
TWELVE = [6, 10, 17, 18, 5, 4, 3, 19, 7, 26, 12, 14]
SKY = [101, 102, 103, 104, 105]


def mv(m):
    if m is None: return "none"
    cid, i, rev, score = m[0], m[1], m[2], m[3]
    return "%d@%d%s:%d" % (cid, i, "r" if rev else "", score)


def scripted(v, C, n):
    hand = v.deal(TWELVE, n, n, True)
    slots = [None] * 9; you = list(hand); sky = list(SKY); ret_used = False

    def place(cid, side, pref):
        nonlocal slots, you, sky, ret_used
        i = pref
        while slots[i] is not None: i = (i + 1) % 9
        slots, f, ret = v.resolve_ret(C, slots, cid, i, False, side, n, ret_used, False)
        if side == "you": you.remove(cid)
        else: sky.remove(cid)
        if ret: you += list(ret); ret_used = True

    place(hand[0], "you", (n * 2) % 9)
    place(101, "sky", (n * 5 + 1) % 9)
    place(hand[1], "you", (n * 7 + 2) % 9)
    return slots, you, sky, ret_used


def vec_you_move(v):
    C = v.Cards(own_all=True); out = []
    for n in range(1, 29):
        slots, you, sky, ru = scripted(v, C, n)
        a = v.you_move(C, slots, you, sky, n, 8, ru, False)
        b = v.you_move(C, slots, you, sky, n, 0, ru, False)
        out.append("n%d=%s/%s" % (n, mv(a), mv(b)))
    return ";".join(out)


def vec_sky_move(v):
    C = v.Cards(own_all=True); out = []
    for n in range(1, 29):
        slots, you, sky, ru = scripted(v, C, n)
        a = v.sky_move(C, slots, sky, you, n, 8)
        b = v.sky_move(C, slots, sky, you, n, 0)
        out.append("n%d=%s/%s" % (n, mv(a), mv(b)))
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


AGENT_VECTORS = [("youMove: the careful and casual player, 28 nights", vec_you_move, "youMove"),
                 ("skyMove: her table reading at 8 and at 0, 28 nights", vec_sky_move, "skyMove"),
                 ("playBoard: both leaders, both depths, 28 nights", vec_play_board, "playBoard")]


def first_diff(a, b):
    """the first night on which two vector strings differ, for the failure line."""
    for x, y in zip(a.split(";"), b.split(";")):
        if x != y: return "got %s, want %s" % (x, y)
    return "lengths differ"


def run(engine_name="engine_v1"):
    sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, "base"))
    v = importlib.import_module(engine_name)
    sys.modules["manzil_v6"] = v
    base = importlib.import_module("v6vectors").run()
    want = json.load(open(os.path.join(HERE, "vectors_agents.json")))
    out = list(base)
    for name, fn, key in AGENT_VECTORS:
        try: got = fn(v)
        except Exception as e: got = "threw: %s: %s" % (type(e).__name__, e)
        ok = got == want[key]
        out.append(dict(name=name, want=want[key], got=got, ok=ok,
                        note=None if ok else first_diff(got, want[key])))
    return out


def main(argv):
    engine_name = argv[1] if len(argv) > 1 else "engine_v1"
    r = run(engine_name)
    n = sum(1 for x in r if x["ok"])
    print("%s.py: %d/%d pass (33 conformance + 3 agent vectors, reference %s)" % (
        engine_name, n, len(r), json.load(open(os.path.join(HERE, "vectors_agents.json")))["source"]))
    for x in r:
        if not x["ok"]:
            print("  FAIL  %-52s %s" % (x["name"], x.get("note") or "want %s got %s" % (x["want"], x["got"])))
    return 0 if n == len(r) else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
