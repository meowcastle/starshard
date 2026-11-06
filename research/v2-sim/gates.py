#!/usr/bin/env python3
"""gates.py: one command that runs every gate a Manzil v2 engine must pass, and prints a
pass or fail table.

    python3 research/v2-sim/gates.py                      # engine_v1, every gate
    python3 research/v2-sim/gates.py engine_v2            # a later engine
    python3 research/v2-sim/gates.py --nights 1,15        # a shorter leader solve
    python3 research/v2-sim/gates.py --seeds 2            # fewer seeds for a quick look
    python3 research/v2-sim/gates.py --part bands5        # one part, saved under results/parts/
    python3 research/v2-sim/gates.py --assemble           # the table from the saved parts

The five gates, each in the configuration that produced the August and October numbers, so
the baseline reproduces before anything else is measured:

  vectors  the 33 conformance vectors (base/v6vectors.py) and the 3 agent vectors
           (vectors_agents.py, youMove, skyMove, playBoard) against the engine: 36.
  bands    careful (your agent at depth 8) and casual (depth 0) win rates against her
           table reading at depth 8: pack of five in the build's order [6,10,17,18,5] and
           the twelve [6,10,17,18,5,4,3,19,7,26,12,14], every card owned at level 2, the
           exact xorshift deal with seeds 1 to 8, both leaders, 28 nights; 448 boards a cell
           (research/manzil-v6-conformance.md section 2). Bands: careful 55 to 65, casual
           35 to 45, gap 20 or more.
  scan     the forced-opening scan (research/manzil-why-storm3.md section 1): the Empty
           District friend-build table (chart five [5,6,10,17,18] at level 2, the rest
           loaned and silent), no deal, you lead, reference agents at depth 8 both sides,
           every (card, slot, face) opening on all 28 nights. Passes when no opening wins
           all 28.
  drama    lead changes, comebacks, final margin, close finishes and flips over the bands'
           careful and casual cells (the proxies from base/drama.py on this engine). A v2
           engine passes when each careful proxy is at or above the v1 baseline in
           results/baseline_v1.json.
  solve    the perfect-play solve of the empty board, both sides perfect, on a sample of
           nights for each leader (research/manzil-loop/minimax.py, same table as the scan).
           v1 is a leader win on every night; a v2 engine passes when the leader no longer
           wins every sampled night.

A moving-sky engine (MOVING_SKY = True, engine_v2 from S1 on) is run through its own game
surface: play_board returns the trace, finish plays a night out from a position, solve_empty
is its own perfect-play solver with a node cap (the full six-set solve does not fit this
shell's 180 s; the part files from a longer run elsewhere are read as they are, with
`solved` false when the budget ran out), and its vectors are the module its VECTORS names
(the 33 plus its own) in place of the v1 agent vectors.

For engine_v1 the table also carries the reproduction rows (73.2 / 26.8 on the pack of
five, 71.2 / 47.1 on the twelve, six all-28 openings, the leader 7 of 7 for each side) and
writes results/baseline_v1.json. Every run writes results/gates-<engine>-<stamp>.json.
Standard library only. Exit code 0 only when every row passes.
"""
import importlib, json, os, statistics, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
RESULTS = os.path.join(HERE, "results")
T0 = time.time()

SKY = [101, 102, 103, 104, 105]
FIVE = [6, 10, 17, 18, 5]                        # the build's chart five, in its order
TWELVE = [6, 10, 17, 18, 5, 4, 3, 19, 7, 26, 12, 14]
SCAN_FIVE = [5, 6, 10, 17, 18]                   # the friend-build table's five, as coded
BANDS = dict(careful=(55.0, 65.0), casual=(35.0, 45.0), gap=20.0)
V1_KNOWN = {"pack of 5": (73.2, 26.8), "pack of 12": (71.2, 47.1), "all28": 6, "leader": 7}
SOLVE_NIGHTS = [1, 5, 10, 15, 20, 25, 28]
SOLVE_CAP = 1500000                              # nodes a moving-sky solve may spend in one shell call


def elapsed(): return "%5.0fs" % (time.time() - T0)


def load_engine(name):
    sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, "base"))
    return importlib.import_module(name)


# ------------------------------------------------------------------ 1. vectors
def gate_vectors(v, name):
    """the 33 conformance vectors plus the 3 agent vectors (vectors_agents.py), 36 in all."""
    sys.modules["manzil_v6"] = v
    mod = getattr(v, "VECTORS", "vectors_agents")
    r = importlib.import_module(mod).run(v.__name__)
    n = sum(1 for x in r if x["ok"])
    fails = [x for x in r if not x["ok"]]
    for x in fails:
        print("    FAIL  %-42s want %-8s got %s" % (x["name"], x["want"], x["got"]), flush=True)
    return dict(passed=n, total=len(r), fails=[x["name"] for x in fails])


# ------------------------------------------------------------------ 2. bands and 4. drama
def moving(v): return bool(getattr(v, "MOVING_SKY", False))


def board_trace(v, C, you, sky, tonight, leader, you_depth, depth):
    """play_board with the margin after every placement, for the drama proxies."""
    if moving(v):
        r = v.play_board(C, you, sky, tonight, leader, you_depth, depth)
        return dict(win=r["win"], you=r["you"], sky=r["sky"], flips=r["flips"], trace=r["trace"])
    slots = [None] * 9
    you = list(you); sky = list(sky)
    turn = v.mk_turn(C, you, sky, leader)
    ret_used = False; glance_on = False; flips = 0; guard = 0; trace = []
    while any(s is None for s in slots) and (you or sky) and guard < 40:
        guard += 1
        side = turn
        if side == "you":
            mv = v.you_move(C, slots, you, sky, tonight, you_depth, ret_used, glance_on) if you else None
        else:
            mv = v.sky_move(C, slots, sky, you, tonight, depth) if sky else None
        if mv is None:
            turn = "sky" if side == "you" else "you"; continue
        cid, i, rev, score, b2, f, ret = mv
        slots = b2; flips += f
        if side == "you": you.remove(cid)
        else: sky.remove(cid)
        if ret: you += list(ret); ret_used = True
        glance_on = (side == "you" and C[cid]["ab"] == "glance" and C.on(C[cid]))
        y, s = v.counts(C, slots, tonight); trace.append(y - s)
        turn = "sky" if side == "you" else "you"
    y, s = v.counts(C, slots, tonight)
    return dict(win=v.board_winner(C, slots, tonight), you=y, sky=s, flips=flips, trace=trace)


def cell(v, pack, you_depth, seeds, depth=8, guarantee=True):
    """one bands cell: win rate plus the drama proxies over the same boards."""
    C = v.Cards(own_all=True)
    W = T = 0; CH = []; CB = []; MG = []; CL = []; FL = []
    for tonight in range(1, 29):
        for seed in range(1, seeds + 1):
            hand = v.deal(pack, seed, tonight, guarantee)
            for leader in ("you", "sky"):
                r = board_trace(v, C, hand, SKY, tonight, leader, you_depth, depth)
                T += 1
                if r["win"]: W += 1
                tr = r["trace"]
                nz = [(1 if d > 0 else -1) for d in tr if d != 0]
                CH.append(sum(1 for a, b in zip(nz, nz[1:]) if a != b))
                at6 = tr[5] if len(tr) > 5 else 0
                CB.append((r["win"] and at6 < 0) or ((not r["win"]) and at6 > 0))
                MG.append(abs(r["you"] - r["sky"])); CL.append(abs(r["you"] - r["sky"]) <= 1)
                FL.append(r["flips"])
    return dict(win=round(100 * W / T, 1), n=T,
                lead_changes=round(statistics.mean(CH), 2),
                comeback_pct=round(100 * statistics.mean(CB), 1),
                margin=round(statistics.mean(MG), 2),
                close_pct=round(100 * statistics.mean(CL), 1),
                flips=round(statistics.mean(FL), 2))




# ------------------------------------------------------------------ 3. scan
def scan_table(v): return v.Cards(own_all=False, owned_ids=SCAN_FIVE)


def gate_scan(v):
    C = scan_table(v)
    names = {cid: v.POOL[cid - 1][0] for cid in range(1, 29)}
    openings = []
    for cid in SCAN_FIVE:
        for i in range(9):
            for rev in ((False, True) if C[cid]["two"] else (False,)):
                openings.append((cid, i, rev))
    rows = []
    for cid, i, rev in openings:
        won = 0
        for tonight in range(1, 29):
            if moving(v):
                st = v.new_game(C, SCAN_FIVE, SKY, tonight, "you")
                r = v.finish(v.place(st, cid, i, rev), 8, 8)
            else:
                slots = [None] * 9
                b2, f, ret = v.resolve_ret(C, slots, cid, i, rev, "you", tonight)
                you = [x for x in SCAN_FIVE if x != cid] + list(ret)
                r = finish(v, C, b2, you, list(SKY), "sky", tonight, bool(ret), False)
            if r: won += 1
        rows.append(dict(opening="%s@%d%s" % (names[cid], i, " rev" if rev else ""), nights_won=won))
    rows.sort(key=lambda r: -r["nights_won"])
    all28 = [r["opening"] for r in rows if r["nights_won"] == 28]
    print("    %d openings; best %s; winning all 28: %d  [%s]" % (
        len(rows), ", ".join("%s %d/28" % (r["opening"], r["nights_won"]) for r in rows[:3]), len(all28), elapsed()), flush=True)
    if all28: print("    all-28: " + ", ".join(all28), flush=True)
    return dict(openings=len(rows), all28=all28, top=rows[:12])


def finish(v, C, slots, you, sky, turn, tonight, ret_used, glance_on, you_depth=8, depth=8):
    """play a board out from a position with the reference agents; True if you win."""
    guard = 0
    while any(s is None for s in slots) and (you or sky) and guard < 40:
        guard += 1
        if turn == "you":
            mv = v.you_move(C, slots, you, sky, tonight, you_depth, ret_used, glance_on) if you else None
        else:
            mv = v.sky_move(C, slots, sky, you, tonight, depth) if sky else None
        if mv is None:
            turn = "sky" if turn == "you" else "you"; continue
        cid, i, rev, score, b2, f, ret = mv
        slots = b2
        if turn == "you": you = [x for x in you if x != cid]
        else: sky = [x for x in sky if x != cid]
        if ret: you = you + list(ret); ret_used = True
        glance_on = (turn == "you" and C[cid]["ab"] == "glance" and C.on(C[cid]))
        turn = "sky" if turn == "you" else "you"
    return v.board_winner(C, slots, tonight)


# ------------------------------------------------------------------ 5. solve
class Solver:
    """boolean minimax with a memo, both sides perfect: True when you win (minimax.py)."""
    def __init__(self, v, C):
        self.v = v; self.C = C; self.memo = {}; self.nodes = 0

    def key(self, slots, you, sky, ru, go, turn):
        return (tuple(tuple(sorted(s.items())) if s else None for s in slots),
                tuple(sorted(you)), tuple(sorted(sky)), ru, go, turn)

    def solve(self, slots, you, sky, ru, go, turn, tonight):
        v = self.v; C = self.C
        self.nodes += 1
        if not any(s is None for s in slots) or not (you or sky):
            return v.board_winner(C, slots, tonight)
        k = self.key(slots, you, sky, ru, go, turn)
        if k in self.memo: return self.memo[k]
        if turn == "you":
            if not you:
                r = self.solve(slots, you, sky, ru, go, "sky", tonight); self.memo[k] = r; return r
            ref = v.you_move(C, slots, you, sky, tonight, 8, ru, go)
            cands = [(ref[0], ref[1], ref[2])]
            for cid in you:
                for rev in ((False, True) if C[cid]["two"] else (False,)):
                    for i in v.legal(slots):
                        if (cid, i, rev) != cands[0]: cands.append((cid, i, rev))
            for cid, i, rev in cands:
                b2, f, ret = v.resolve_ret(C, slots, cid, i, rev, "you", tonight, ru, go)
                y2 = [x for x in you if x != cid] + list(ret)
                if self.solve(b2, y2, sky, ru or bool(ret),
                              (C[cid]["ab"] == "glance" and C.on(C[cid])), "sky", tonight):
                    self.memo[k] = True; return True
            self.memo[k] = False; return False
        if not sky:
            r = self.solve(slots, you, sky, ru, go, "you", tonight); self.memo[k] = r; return r
        ref = v.sky_move(C, slots, sky, you, tonight, 8)
        cands = [(ref[0], ref[1], ref[2])]
        for cid in sky:
            for rev in ((False, True) if C[cid]["ab"] == "mercury" else (False,)):
                for i in v.legal(slots):
                    if (cid, i, rev) != cands[0]: cands.append((cid, i, rev))
        for cid, i, rev in cands:
            b2, f, ret = v.resolve_ret(C, slots, cid, i, rev, "sky", tonight)
            y2 = list(you) + list(ret)
            if not self.solve(b2, y2, [x for x in sky if x != cid], ru or bool(ret), False, "you", tonight):
                self.memo[k] = False; return False
        self.memo[k] = True; return True




# ------------------------------------------------------------------ parts
# A run can be split into parts that fit a short shell window (the night shift's shell
# kills a process at 180 s): each --part writes results/parts/<engine>/<part>.json and
# --assemble builds the table from whatever parts exist. With no flag, every part runs
# inline and the table follows.
PARTS = ["vectors", "bands5", "bands12", "scan"] + ["solve-%s-%d" % (l, n) for l in ("you", "sky") for n in SOLVE_NIGHTS]


def part_names(nights):
    return ["vectors", "bands5", "bands12", "scan"] + ["solve-%s-%d" % (l, n) for l in ("you", "sky") for n in nights]


def run_part(v, name, seeds):
    if name == "vectors":
        r = gate_vectors(v, "")
        print("    %d/%d pass  [%s]" % (r["passed"], r["total"], elapsed()), flush=True)
        return r
    if name in ("bands5", "bands12"):
        label, pack = ("pack of 5", FIVE) if name == "bands5" else ("pack of 12", TWELVE)
        careful = cell(v, pack, 8, seeds); casual = cell(v, pack, 0, seeds)
        out = dict(label=label, careful=careful, casual=casual, gap=round(careful["win"] - casual["win"], 1))
        print("    %-11s careful %5.1f  casual %5.1f  gap %5.1f   (%d boards a cell)  [%s]" % (
            label, careful["win"], casual["win"], out["gap"], careful["n"], elapsed()), flush=True)
        c = careful
        print("    %-11s careful: lead-changes %.2f  comeback %.1f%%  margin %.2f  close(<=1) %.1f%%  flips %.2f" % (
            label, c["lead_changes"], c["comeback_pct"], c["margin"], c["close_pct"], c["flips"]), flush=True)
        return out
    if name == "scan":
        return gate_scan(v)
    if name.startswith("solve-"):
        _, leader, n = name.split("-"); n = int(n)
        C = scan_table(v); t = time.time()
        if moving(v):
            s = v.Solver(C, cap=SOLVE_CAP)
            try:
                you_win = s.solve(v.new_game(C, list(SCAN_FIVE), list(SKY), n, leader))
            except v.Solver.Budget:
                print("    %s leads, night %2d: unsolved within %d nodes (%ds)" % (leader, n, SOLVE_CAP, time.time() - t), flush=True)
                return dict(leader=leader, night=n, solved=False, leader_wins=None, nodes=s.nodes, seconds=round(time.time() - t))
            leader_won = you_win if leader == "you" else (not you_win)
            print("    %s leads, night %2d: %s under perfect play  (%d nodes, %ds)" % (
                leader, n, "YOU win" if you_win else "SKY wins", s.nodes, time.time() - t), flush=True)
            return dict(leader=leader, night=n, solved=True, leader_wins=bool(leader_won), nodes=s.nodes, seconds=round(time.time() - t))
        s = Solver(v, C)
        you_win = s.solve([None] * 9, list(SCAN_FIVE), list(SKY), False, False, leader, n)
        leader_won = you_win if leader == "you" else (not you_win)
        print("    %s leads, night %2d: %s under perfect play  (%d nodes, %ds)" % (
            leader, n, "YOU win" if you_win else "SKY wins", s.nodes, time.time() - t), flush=True)
        return dict(leader=leader, night=n, leader_wins=bool(leader_won), nodes=s.nodes, seconds=round(time.time() - t))
    raise SystemExit("unknown part " + name)


def parts_dir(engine): return os.path.join(RESULTS, "parts", engine)


def save_part(engine, name, data):
    os.makedirs(parts_dir(engine), exist_ok=True)
    json.dump(data, open(os.path.join(parts_dir(engine), name + ".json"), "w"), indent=1)


def load_parts(engine, nights):
    """fold the part files into one result; missing parts are reported, not invented."""
    res = dict(bands={}, solve={"you": [], "sky": []}); missing = []
    for name in part_names(nights):
        f = os.path.join(parts_dir(engine), name + ".json")
        if not os.path.exists(f): missing.append(name); continue
        d = json.load(open(f))
        if name == "vectors": res["vectors"] = d
        elif name.startswith("bands"): res["bands"][d["label"]] = d
        elif name == "scan": res["scan"] = d
        else: res["solve"][d["leader"]].append(d)
    return res, missing


# ------------------------------------------------------------------ the table
def row(table, gate, check, value, want, ok):
    """ok None is an INFO row: shown, never counted (the baseline's own band numbers)."""
    table.append(dict(gate=gate, check=check, value=value, want=want, ok=None if ok is None else bool(ok)))


def build_table(engine, res, baseline, full, nights):
    table = []; v1 = engine == "engine_v1"
    if "vectors" in res:
        r = res["vectors"]
        row(table, "vectors", "the 33 conformance and 3 agent vectors", "%d/%d" % (r["passed"], r["total"]),
            "%d/%d" % (r["total"], r["total"]), r["passed"] == r["total"])
    for label in ("pack of 5", "pack of 12"):
        if label not in res.get("bands", {}): continue
        r = res["bands"][label]
        c = r["careful"]["win"]; k = r["casual"]["win"]; g = r["gap"]
        inband = lambda ok: None if v1 else ok      # the baseline's bands are information, not a gate
        row(table, "bands", label + ", careful", c, "55 to 65", inband(BANDS["careful"][0] <= c <= BANDS["careful"][1]))
        row(table, "bands", label + ", casual", k, "35 to 45", inband(BANDS["casual"][0] <= k <= BANDS["casual"][1]))
        row(table, "bands", label + ", skill gap", g, "20 or more", inband(g >= BANDS["gap"]))
        if v1 and full:
            want = V1_KNOWN[label]
            row(table, "reproduce v1", label + ", careful / casual", "%.1f / %.1f" % (c, k), "%.1f / %.1f" % want, (c, k) == want)
        cf = r["careful"]
        if baseline and label in baseline.get("bands", {}):
            b = baseline["bands"][label]["careful"]
            for key in ("lead_changes", "comeback_pct", "close_pct"):
                row(table, "drama", "%s, careful %s" % (label, key), cf[key], "at or above v1 (%s)" % b[key], cf[key] >= b[key])
        else:
            row(table, "drama", label + ", careful proxies recorded",
                "lc %.2f cb %.1f close %.1f" % (cf["lead_changes"], cf["comeback_pct"], cf["close_pct"]),
                "baseline" if v1 else "no baseline_v1.json to compare", None if v1 else False)
    if "scan" in res:
        r = res["scan"]
        row(table, "scan", "openings that win all 28 nights", len(r["all28"]), "0", None if v1 else len(r["all28"]) == 0)
        if v1: row(table, "reproduce v1", "all-28 openings", len(r["all28"]), str(V1_KNOWN["all28"]), len(r["all28"]) == V1_KNOWN["all28"])
    for leader in ("you", "sky"):
        rows = res.get("solve", {}).get(leader, [])
        if not rows: continue
        solved = [x for x in rows if x.get("solved", True)]
        w = sum(1 for x in solved if x["leader_wins"]); n = len(solved); u = len(rows) - n
        if v1: row(table, "reproduce v1", "%s leads: leader wins" % leader, "%d/%d" % (w, n), "%d/%d" % (n, n), w == n)
        else:
            # a leader loss on any solved night is the counterexample the gate asks for;
            # unsolved nights (the budget ran out) are shown and never counted as wins
            val = "%d/%d solved" % (w, n) + (", %d unsolved" % u if u else "")
            row(table, "solve", "%s leads: leader wins" % leader, val, "fewer than all sampled", (n > 0 and w < n))
    return table


def main(argv):
    args = list(argv[1:])
    engine = "engine_v1"; parts = []; assemble = False; seeds = 8; nights = SOLVE_NIGHTS
    i = 0
    while i < len(args):
        a = args[i]
        if a == "--part": parts.append(args[i + 1]); i += 2
        elif a == "--assemble": assemble = True; i += 1
        elif a == "--seeds": seeds = int(args[i + 1]); i += 2
        elif a == "--nights": nights = [int(x) for x in args[i + 1].split(",")]; i += 2
        elif a.startswith("--"): print("unknown flag", a); return 2
        else: engine = a; i += 1
    full = seeds == 8 and nights == SOLVE_NIGHTS
    bpath = os.path.join(RESULTS, "baseline_v1.json")
    baseline = json.load(open(bpath)) if engine != "engine_v1" and os.path.exists(bpath) else None

    if parts:
        v = load_engine(engine)
        for name in parts:
            print("--- %s  (%s, seeds %d)" % (name, engine, seeds), flush=True)
            save_part(engine, name, run_part(v, name, seeds))
        return 0
    if not assemble:
        v = load_engine(engine)
        print("=== gates: %s  (seeds %d, solve nights %s) ===" % (engine, seeds, ",".join(map(str, nights))), flush=True)
        for name in part_names(nights):
            print("--- " + name, flush=True)
            save_part(engine, name, run_part(v, name, seeds))

    res, missing = load_parts(engine, nights)
    res.update(engine=engine, seeds=seeds, solve_nights=nights, assembled=time.strftime("%Y-%m-%dT%H:%M:%S"), missing=missing)
    table = build_table(engine, res, baseline, full, nights)
    res["table"] = table
    os.makedirs(RESULTS, exist_ok=True)
    out = os.path.join(RESULTS, "gates-%s-%s.json" % (engine, time.strftime("%Y%m%d-%H%M")))
    json.dump(res, open(out, "w"), indent=1)
    if engine == "engine_v1" and full and not missing:
        json.dump(res, open(bpath, "w"), indent=1)

    print("\n=== %s: pass/fail ===" % engine)
    print("  %-13s %-40s %-28s %-28s %s" % ("gate", "check", "value", "want", "result"))
    for t in table:
        mark = "INFO" if t["ok"] is None else ("PASS" if t["ok"] else "FAIL")
        print("  %-13s %-40s %-28s %-28s %s" % (t["gate"], t["check"], t["value"], t["want"], mark))
    counted = [t for t in table if t["ok"] is not None]
    ok = all(t["ok"] for t in counted) and not missing
    print("  %d/%d counted rows pass (%d info)%s; results in %s" % (
        sum(t["ok"] for t in counted), len(counted), len(table) - len(counted),
        "" if not missing else "; MISSING parts: " + ", ".join(missing), os.path.relpath(out, HERE)))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
