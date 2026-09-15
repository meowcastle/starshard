import json, sys, manzil_v6 as v
cases = json.load(open(sys.argv[1]))
out = []
for c in cases:
    C = v.Cards(own_all=True)
    r = v.play_board(C, list(c["you"]), list(c["sky"]), c["tonight"],
                     leader=c["leader"], you_depth=c["youDepth"], depth=c["depth"])
    out.append({"win": r["win"], "you": r["you"], "sky": r["sky"], "flips": r["flips"]})
print(json.dumps(out))
