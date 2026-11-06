"""full-game solve (win/loss) from a position, both sides perfect. boolean minimax w/ memo."""
import sys, time, functools
import manzil_v6 as v, whyloss as W
C = W.make_cards()
def key(slots, you, sky, ru, go, turn):
    return (tuple(tuple(sorted(s.items())) if s else None for s in slots), tuple(sorted(you)), tuple(sorted(sky)), ru, go, turn)
memo = {}
nodes = 0
def solve(slots, you, sky, ru, go, turn, tonight):
    """True if YOU win with perfect play by both."""
    global nodes
    nodes += 1
    if not any(s is None for s in slots) or not (you or sky):
        return v.board_winner(C, slots, tonight)
    k = key(slots, you, sky, ru, go, turn)
    if k in memo: return memo[k]
    if turn == "you":
        if not you: r = solve(slots, you, sky, ru, go, "sky", tonight); memo[k]=r; return r
        # order: reference move first
        ref = v.you_move(C, slots, you, sky, tonight, 8, ru, go)
        cands = [(ref[0], ref[1], ref[2])]
        for cid in you:
            for rev in ((False, True) if C[cid]["two"] else (False,)):
                for i in v.legal(slots):
                    if (cid, i, rev) != cands[0]: cands.append((cid, i, rev))
        for cid, i, rev in cands:
            b2, f, ret = v.resolve_ret(C, slots, cid, i, rev, "you", tonight, ru, go)
            y2 = [x for x in you if x != cid] + list(ret)
            if solve(b2, y2, sky, ru or bool(ret), (C[cid]["ab"]=="glance" and C.on(C[cid])), "sky", tonight):
                memo[k] = True; return True
        memo[k] = False; return False
    else:
        if not sky: r = solve(slots, you, sky, ru, go, "you", tonight); memo[k]=r; return r
        ref = v.sky_move(C, slots, sky, you, tonight, 8)
        cands = [(ref[0], ref[1], ref[2])]
        for cid in sky:
            for rev in ((False, True) if C[cid]["ab"]=="mercury" else (False,)):
                for i in v.legal(slots):
                    if (cid, i, rev) != cands[0]: cands.append((cid, i, rev))
        for cid, i, rev in cands:
            b2, f, ret = v.resolve_ret(C, slots, cid, i, rev, "sky", tonight)
            y2 = list(you) + list(ret)
            if not solve(b2, y2, [x for x in sky if x != cid], ru or bool(ret), False, "you", tonight):
                memo[k] = False; return False
        memo[k] = True; return True

def solve_opening(fc, fi, frev, tonight):
    global memo, nodes
    memo = {}; nodes = 0
    slots = [None]*9
    b2, f, ret = v.resolve_ret(C, slots, fc, fi, frev, "you", tonight)
    return solve(b2, [x for x in W.FIVE if x != fc] + list(ret), list(v.SKY_HAND), bool(ret), False, "sky", tonight)

if __name__ == "__main__":
    fc, fi = int(sys.argv[1]), int(sys.argv[2])
    nights = range(int(sys.argv[3]), int(sys.argv[4])+1) if len(sys.argv) > 4 else range(1, 29)
    wins = 0
    for n in nights:
        t=time.time(); r = solve_opening(fc, fi, False, n); wins += r
        print(f"  night {n:2d}: {'YOU win' if r else 'SKY wins'} with perfect play  ({nodes} nodes, {time.time()-t:.0f}s)", flush=True)
    print(f"{W.NAMES[fc]}@{fi}: forced win for you on {wins}/{len(list(nights))} nights under perfect play")

def solve_empty(tonight, leader="you"):
    global memo, nodes
    memo = {}; nodes = 0
    return solve([None]*9, list(W.FIVE), list(v.SKY_HAND), False, False, leader, tonight)
