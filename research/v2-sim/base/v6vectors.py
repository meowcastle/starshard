"""The 33 conformance vectors from research/manzil-engine-v6.js, run against manzil_v6.py.
Each returns a value compared as a string against the reference's expectation."""
import manzil_v6 as v

C = None
def cards(): return v.Cards(own_all=True)


class G:
    """the vector harness's game object: slots + tonight, matching mkGame's defaults."""
    def __init__(self, tonight=1, glance_on=False, ret_used=False):
        self.C = cards(); self.slots = [None] * 9
        self.tonight = tonight; self.glance_on = glance_on; self.ret_used = ret_used


def S(cid, owner, l, r, age=0, **kw):
    d = dict(id=cid, owner=owner, l=l, r=r, age=age, first=False)
    d.update(kw); return d


def V(fn, want): return (fn, want)

VECTORS = []
def vec(name, want):
    def deco(f):
        VECTORS.append((name, f, want)); return f
    return deco


@vec("ties flip", "sky")
def _(g):
    g.slots[0] = S(17, "you", 6, 6, 3)
    s, _f = v.resolve(g.C, g.slots, 1, 1, False, "sky", g.tonight)
    return s[0]["owner"]

@vec("a tie-flip strikes on, past her reach", "sky/sky")
def _(g):
    g.slots[1] = S(17, "you", 6, 6, 3); g.slots[2] = S(16, "you", 6, 6, 3)
    s, _f = v.resolve(g.C, g.slots, 1, 0, False, "sky", g.tonight)
    return s[1]["owner"] + "/" + s[2]["owner"]

@vec("tied counts are yours", "you")
def _(g):
    g.slots[0] = S(1, "you", 6, 5, 1); g.slots[1] = S(2, "sky", 6, 4, 1)
    sub = g.slots[:2] + [None] * 7
    return "you" if v.board_winner(g.C, sub, g.tonight) else "sky"

@vec("saturn's ground is never claimed", "sky")
def _(g):
    g.slots[1] = S(101, "sky", 9, 5, 3)
    s, _f = v.resolve(g.C, g.slots, 24, 0, False, "you", g.tonight)
    return s[1]["owner"]

@vec("dominion counts two", 2)
def _(g):
    g.tonight = 1; g.slots[0] = S(1, "you", 6, 5, 0)
    return v.counts(g.C, g.slots, g.tonight)[0]

@vec("jupiter counts two", 2)
def _(g):
    g.slots[3] = S(105, "sky", 7, 8, 0)
    return v.counts(g.C, g.slots, g.tonight)[1]

@vec("the gate takes the lead", "you")
def _(g):
    return v.mk_turn(g.C, you=[1], sky=[101], leader="sky")

@vec("the bearer lifts yours", 7)
def _(g):
    g.slots[1] = S(2, "you", 6, 4, 2); g.slots[2] = S(17, "you", 6, 6, 2)
    return v.face_of(g.C, g.slots, 2, 1)

@vec("the gathered stars count two", 2)
def _(g):
    g.tonight = 9; g.slots[0] = S(3, "you", 7, 6, 0)
    return v.counts(g.C, g.slots, g.tonight)[0]

@vec("the follower copies the left", 9)
def _(g):
    g.slots[0] = S(24, "sky", 3, 9, 2); g.slots[1] = S(4, "you", 7, 7, 0)
    return v.face_of(g.C, g.slots, 1, -1)

@vec("the blaze keeps its ground", "you")
def _(g):
    s = v.lodge(g.C, g.slots, 5, 4, False, "you")
    s[4]["owner"] = "sky"
    cx = v.ctx(g.C, s, g.tonight)
    return v.slot_w(g.C, s, 4, cx, g.tonight)[1]

@vec("the storm cannot be tied at home", "you")
def _(g):
    g.tonight = 6; g.slots[0] = S(6, "you", 8, 6, 3)
    s, _f = v.resolve(g.C, g.slots, 1, 1, False, "sky", g.tonight)
    return s[0]["owner"]

@vec("the storm ties away from home", "sky")
def _(g):
    g.tonight = 1; g.slots[0] = S(6, "you", 8, 6, 3)
    s, _f = v.resolve(g.C, g.slots, 1, 1, False, "sky", g.tonight)
    return s[0]["owner"]

@vec("the return comes home once", "gone/7")
def _(g):
    s = v.lodge(g.C, g.slots, 7, 0, False, "you")
    s2, _f, ret = v.resolve_ret(g.C, s, 101, 1, False, "sky", g.tonight)
    return ("gone" if s2[0] is None else str(s2[0])) + "/" + str(ret[0])

@vec("the ghost dims hers early", 8)
def _(g):
    g.slots[1] = S(8, "you", 6, 6, 2); g.slots[2] = S(101, "sky", 9, 5, 2)
    return v.face_of(g.C, g.slots, 2, -1)

@vec("the ghost fades on a full road", 9)
def _(g):
    for i in range(5): g.slots[i] = S(20, "you", 6, 6, 2)
    g.slots[1] = S(8, "you", 6, 6, 2); g.slots[2] = S(101, "sky", 9, 5, 2)
    return v.face_of(g.C, g.slots, 2, -1)

@vec("the glance dims her next", 4)
def _(g):
    s = v.lodge(g.C, g.slots, 101, 4, False, "sky", glance_on=True)
    return v.face_of(g.C, s, 4, 1)

@vec("the mane stands between two", 6)
def _(g):
    g.slots[0] = S(20, "sky", 6, 6, 2); g.slots[2] = S(20, "sky", 6, 6, 2)
    g.slots[1] = S(11, "you", 6, 5, 0)
    return v.face_of(g.C, g.slots, 1, 1)

@vec("the turning turns her", 5)
def _(g):
    g.slots[1] = S(101, "sky", 9, 5, 2)
    s = v.lodge(g.C, g.slots, 12, 0, False, "you")
    return s[1]["l"]

@vec("the jewel cannot be softened", 7)
def _(g):
    g.slots[0] = S(14, "you", 7, 7, 2)
    s = v.lodge(g.C, g.slots, 103, 1, False, "sky")
    return s[0]["r"]

@vec("the veil lands safe", "you")
def _(g):
    s = v.lodge(g.C, g.slots, 15, 0, False, "you")
    s2, _f = v.resolve(g.C, s, 101, 1, False, "sky", g.tonight)
    return s2[0]["owner"]

@vec("the claws bleed their claimer", 4)
def _(g):
    g.slots[0] = S(16, "you", 6, 6, 3)
    s, _f = v.resolve(g.C, g.slots, 101, 1, False, "sky", g.tonight)
    return v.face_of(g.C, s, 1, 1)

@vec("the crown counts two on an edge", 2)
def _(g):
    g.tonight = 20; g.slots[0] = S(17, "you", 6, 6, 0)
    return v.counts(g.C, g.slots, g.tonight)[0]

@vec("the heart keeps yours from dimming", 6)
def _(g):
    g.slots[0] = S(18, "you", 7, 7, 2); g.slots[1] = S(20, "you", 6, 6, 2)
    s = v.lodge(g.C, g.slots, 103, 2, False, "sky")
    return s[1]["r"]

@vec("the root opens higher", 8)
def _(g):
    s = v.lodge(g.C, g.slots, 19, 3, False, "you")
    return v.face_of(g.C, s, 3, 1)

@vec("the flock lifts yours on a claim", 7)
def _(g):
    g.slots[0] = S(17, "you", 6, 6, 2); g.slots[2] = S(21, "sky", 2, 8, 2)
    s, _f = v.resolve(g.C, g.slots, 20, 1, False, "you", g.tonight)
    return v.face_of(g.C, s, 0, 1)

@vec("the empty district counts two untouched", 2)
def _(g):
    g.tonight = 5; g.slots[4] = S(21, "you", 2, 8, 0); g.slots[3] = S(101, "sky", 9, 5, 0)
    return v.counts(g.C, g.slots, g.tonight)[0]

@vec("the listener strikes what lands", "you")
def _(g):
    g.slots[0] = S(22, "you", 7, 4, 3)
    s, _f = v.resolve(g.C, g.slots, 21, 1, False, "sky", g.tonight)
    return s[1]["owner"]

@vec("the drum strikes onward", "you/you")
def _(g):
    g.slots[1] = S(20, "sky", 6, 6, 3); g.slots[2] = S(20, "sky", 6, 6, 3)
    s, _f = v.resolve(g.C, g.slots, 23, 0, False, "you", g.tonight)
    return s[1]["owner"] + "/" + s[2]["owner"]

@vec("the void stands alone", "you")
def _(g):
    s = v.lodge(g.C, g.slots, 24, 4, False, "you")
    s2, _f = v.resolve(g.C, s, 105, 5, False, "sky", g.tonight)
    return s2[4]["owner"]

@vec("the hideaway closes the loudest beside it", 0)
def _(g):
    g.tonight = 26; g.slots[0] = S(25, "you", 5, 6, 0); g.slots[1] = S(101, "sky", 9, 5, 0)
    return v.counts(g.C, g.slots, g.tonight)[1]

@vec("the chamber shields a landing", "you")
def _(g):
    g.slots[0] = S(26, "you", 7, 5, 3)
    s = v.lodge(g.C, g.slots, 20, 1, False, "you")
    s2, _f = v.resolve(g.C, s, 101, 2, False, "sky", g.tonight)
    return s2[1]["owner"]

@vec("the thread holds both ends", 0)
def _(g):
    g.slots[0] = S(101, "sky", 9, 5, 0); g.slots[8] = S(102, "sky", 8, 6, 0)
    g.slots[4] = S(28, "you", 5, 6, 0)
    return v.counts(g.C, g.slots, g.tonight)[1]


def run():
    out = []
    for name, fn, want in VECTORS:
        g = G()
        try:
            got = fn(g)
        except Exception as e:
            got = "threw: %s: %s" % (type(e).__name__, e)
        out.append(dict(name=name, want=want, got=got, ok=str(got) == str(want)))
    return out


if __name__ == "__main__":
    r = run()
    n = sum(1 for x in r if x["ok"])
    print("manzil_v6.py: %d/%d pass\n" % (n, len(r)))
    for x in r:
        if not x["ok"]:
            print("  FAIL  %-42s want %-8s got %s" % (x["name"], x["want"], x["got"]))
