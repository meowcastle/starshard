"""Case generator for the v6 differential harness. Deterministic."""
import json, random, sys
seed = int(sys.argv[1]) if len(sys.argv) > 1 else 77
n    = int(sys.argv[2]) if len(sys.argv) > 2 else 2000
random.seed(seed); cases = []
for _ in range(n):
    pool = list(range(1, 29)); random.shuffle(pool)
    k = random.choice([2, 3, 4, 5, 6])
    cases.append(dict(tonight=random.randint(1, 28), you=pool[:k], sky=pool[k:2*k],
                      leader=random.choice(["you", "sky"]),
                      depth=random.choice([0, 4, 8, 12, 16]),
                      youDepth=random.choice([0, 4, 8, 12, 16])))
json.dump(cases, open("cases.json", "w")); print("cases:", len(cases))
