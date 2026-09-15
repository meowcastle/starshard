# manzil temper sim — 19 aug 2026

Harness: JS re-port of the prototype as shipped (`research/temper-engine.js`): seeded tiebreak ON, reply weight 8, default five 5/6/10/17/18 at shipped levels (Crown L1 = inactive), tieRule sky, jupiter always, dominion homes 26/14/22/8/2. 28 tonights × 2 leads; 1-ply × 6 samples, 2-ply × 3.

Baseline, this harness: **1-ply 26.2 / 2-ply 50.0** (flips 1.8, tied 23%).
Calibration: with Crown live (addendum-2 config) 2-ply = 60.7 ≈ addendum 4's 59.0 — the Crown level explains the offset between harnesses. Deltas are the currency below; "report scale" adds ~3.5 pts.

Temper = nudge `base + w·feature` on her eval, seeded FNV breaking what remains tied. Features: mars = flips now · saturn = −her exposed faces · venus = adjacencies · mercury = −adjacencies · jupiter = card total.

## The grid (1-ply % / 2-ply %, baseline 26.2 / 50)

| temper | w=2.5 | w=5 | w=10 | w=20 | w=30 | w=40/50 |
|---|---|---|---|---|---|---|
| mars | 28.6 / 48.2 | 28.6 / 48.2 | 29.5 / 50 | 29.5 / 51.8 | 31.5 / **61.3** | 33.6 / **65.5** |
| saturn | 27.7 / 53.6 | **22.3** / 55.4 | **17.0** / 53.6 | 22.3 / 55.4 | | |
| venus | 25 / 48.2 | 25 / 48.2 | 25 / 50 | 27.7 / 48.2 | | |
| mercury | 28.6 / 48.2 | 27.7 / 48.2 | 27.7 / 50 | 26.8 / **64.3** | | |
| jupiter | 27.7 / 50 | 30.4 / 48.2 | 29.5 / 41.1 | 28.3 / 50.6 | **32.4 / 52.4** | 33.9 / 58.9 |

Tell rate (% of her turns the temper changes her move, w=10): mars 2.8 · saturn 25.8 · venus 13.5 · mercury 15.1 · jupiter 18.7. Pairwise move agreement at w=10: 53–77% (all five distinct, under the 90% line).

## Findings

1. **Jupiter is the only temper that eases her the intended way.** Spending big early is readable and leaves her endgame thin. w=30: 1-ply +6.2 (≈36 on report scale, inside the 35–45 target), 2-ply +2.4 (inside band), tell 32%, flips 2.34. Monotone in w; w=40 pushes 2-ply out (58.9 here ≈ 69 report scale).
2. **Saturn and mercury nudges HARDEN her.** Saturn crushes 1-ply to 17–22% (defense punishes greedy play); mercury w=20 lifts her to 64.3% vs 2-ply (+14). Her shallow eval undervalues defense and spacing; the nudge fixes it. Re-scoped: these are **boss-hardening levers for the walkers' road**, with a visible tell (34–43%) where reply-weight hardening is invisible.
3. **Mars dies as written.** Tell ≤6.2% at any w (flips are too rare for a flip-preference to fire — the same reason claim-gated signatures died at 0.16 flips/turn), and at w≥30 it hardens her invisibly, which the law forbids (a tell, never noise).
4. **Venus is flat everywhere** (25–27.7 / 48.2–50). Mechanism A flavor only.
5. Distinctness passes for all pairs.

## Verdict per the sheet's kill criteria

- mechanism B survives **only as jupiter's mercy**: w=30 on jupiter-ruled nights. The benefic's nights are winnable, which is astrologically true for free.
- the ladder remains the main answer to the 1-ply gap (one temper ≈ 1/5 of nights).
- saturn + mercury: re-scoped to boss hardening (authored road skies harden by temper, not only reply weight).
- mars: rewrite its axis or cut; venus + the rest ship as mechanism A (pure tie-break flavor, tells for humans, zero strength change).

Data: `research/temper-sim-baseline.json` · `temper-sim-grid.json` · `temper-sim-confirm.json`. No prototype code changed.
