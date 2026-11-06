#!/usr/bin/env python3
"""s1_variants.py: two re-scopes of the Moving Sky pre-tested for the decisions queue, each a
monkeypatch over engine_v2 (the engine file is not changed): "alternate", the first
placement of each round alternates between the sides (the follower's last word is shared);
"no-arrival", the rising mansion comes empty (her planet never stands on it). Six sets,
the gate's two packs, seeds as given (the pack of five needs one).

    python3 research/v2-sim/s1_variants.py alternate 1
"""
import sys, time
import engine_v2 as v
import s1_watch as w

variant = sys.argv[1] if len(sys.argv) > 1 else "alternate"
seeds = int(sys.argv[2]) if len(sys.argv) > 2 else 1
_advance = v.advance
_PLANET_AT = dict(v.PLANET_AT)

if variant == "alternate":
    def advance(st):
        n = _advance(st)
        n["leader"] = "sky" if st["leader"] == "you" else "you"
        n["turn"] = n["leader"]
        return n
    v.advance = advance
elif variant == "no-arrival":
    v.PLANET_AT.clear()
else:
    raise SystemExit("variant: alternate | no-arrival")

C = v.Cards(own_all=True)
print("variant %s, six sets" % variant)
for label, pack, s in (("pack of 5", w.FIVE, 1), ("pack of 12", w.TWELVE, seeds)):
    t = time.time()
    a = w.cell(C, pack, 6, 8, s); b = w.cell(C, pack, 6, 0, s)
    print("%-11s careful %5.1f  casual %5.1f  gap %5.1f   leader %5.1f%%  lc %.2f  cb %.1f%%  close %.1f%%  (%d boards a cell, %ds)" % (
        label, a["win"], b["win"], a["win"] - b["win"], a["leader"], a["lc"], a["cb"], a["close"], a["n"], time.time() - t), flush=True)
