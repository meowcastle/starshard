#!/usr/bin/env python3
"""The 33 conformance vectors, run against engine_v1.py from this folder.

base/v6vectors.py is the untouched August suite and imports the engine as `manzil_v6`.
This runner points that name at engine_v1.py so the baseline proves itself from its new
home without a line of the suite changing. Run it from anywhere:

    python3 research/v2-sim/vectors_v1.py            # the baseline
    python3 research/v2-sim/vectors_v1.py engine_v2  # a later engine, same 33 (P0.3 onward)

Exit code 0 only on 33/33.
"""
import importlib, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.join(HERE, "base")


def load_suite(engine_name="engine_v1"):
    sys.path.insert(0, HERE); sys.path.insert(0, BASE)
    engine = importlib.import_module(engine_name)
    sys.modules["manzil_v6"] = engine          # the suite's own name for the engine
    suite = importlib.import_module("v6vectors")
    return engine, suite


def main(argv):
    engine_name = argv[1] if len(argv) > 1 else "engine_v1"
    engine, suite = load_suite(engine_name)
    r = suite.run()
    n = sum(1 for x in r if x["ok"])
    print("%s.py: %d/%d pass" % (engine_name, n, len(r)))
    for x in r:
        if not x["ok"]:
            print("  FAIL  %-42s want %-8s got %s" % (x["name"], x["want"], x["got"]))
    return 0 if n == len(r) else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
