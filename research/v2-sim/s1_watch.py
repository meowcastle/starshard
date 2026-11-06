#!/usr/bin/env python3
"""s1_watch.py: the watch length as a dial. The S1 bands on the pack of five and the pack of
twelve for watches of 3 to 10 sets, with the leader's share of careful boards (both agents
at depth 8): the question MANZIL-TCG.md section 7 asks ("what is the right watch length?").
The pack of five has no deal variance (deal returns the pack at five), so one seed is the
whole cell; the twelve is run on the seeds given.

    python3 research/v2-sim/s1_watch.py 3,4,5,6,8,10 2     # watches, seeds for the twelve
"""
import sys, statistics, time
import engine_v2 as v

SKY = [101, 102, 103, 104, 105]
FIVE = [6, 10, 17, 18, 5]
TWELVE = [6, 10, 17, 18, 5, 4, 3, 19, 7, 26, 12, 14]


def cell(C, pack, rounds, you_depth, seeds):
    W = T = L = 0; CH = []; CB = []; CL = []
    for tonight in range(1, 29):
        for seed in range(1, seeds + 1):
            hand = v.deal(pack, seed, tonight, True)
            for leader in ("you", "sky"):
                tr = []
                st = v.play_out(v.new_game(C, hand, SKY, tonight, leader, rounds), you_depth, 8, tr)
                win = v.winner(st); T += 1; W += win
                L += (win and leader == "you") or ((not win) and leader == "sky")
                nz = [(1 if d > 0 else -1) for d in tr if d != 0]
                CH.append(sum(1 for a, b in zip(nz, nz[1:]) if a != b))
                mid = tr[len(tr) // 2 - 1] if len(tr) > 1 else 0
                CB.append((win and mid < 0) or ((not win) and mid > 0))
                CL.append(abs(st["bank"]["you"] - st["bank"]["sky"]) <= 1)
    return dict(win=round(100 * W / T, 1), leader=round(100 * L / T, 1), n=T,
                lc=round(statistics.mean(CH), 2), cb=round(100 * statistics.mean(CB), 1),
                close=round(100 * statistics.mean(CL), 1))


def main(argv):
    watches = [int(x) for x in (argv[1] if len(argv) > 1 else "3,4,5,6,8,10").split(",")]
    seeds = int(argv[2]) if len(argv) > 2 else 2
    C = v.Cards(own_all=True)
    print("%-11s %5s  %7s %6s %5s   %6s %6s %6s   (careful proxies: lead changes, comebacks, close)" % (
        "pack", "watch", "careful", "casual", "gap", "leader", "lc", "cb"))
    for label, pack, s in (("pack of 5", FIVE, 1), ("pack of 12", TWELVE, seeds)):
        for r in watches:
            t = time.time()
            a = cell(C, pack, r, 8, s); b = cell(C, pack, r, 0, s)
            print("%-11s %5d  %7.1f %6.1f %5.1f   %5.1f%% %6.2f %5.1f%%  close %4.1f%%  (%d boards a cell, %ds)" % (
                label, r, a["win"], b["win"], a["win"] - b["win"], a["leader"], a["lc"], a["cb"], a["close"], a["n"], time.time() - t), flush=True)


if __name__ == "__main__":
    main(sys.argv)
