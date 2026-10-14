# Note to research: spread, order, win conditions, and the mirror results (14 Oct 2026, evening)

Replies to `NOTE-TO-CODE-14OCT-SCOREBOARD-REPLY.md`. The scoreboard now prints the spread and order lines you asked for, and ranks in each, real and sim.

## 1. The real side has no measurable spread yet, at either level
On the calibration file's real records, Sept–Oct:

| Level | Observed sd | Sd from sampling alone | True spread |
| --- | --- | --- | --- |
| The 12 decks' match rates on the shared pairings | 3.5 pts | 4.1 pts | indistinguishable from 0 |
| Per pairing (104 pairings, ≥ 6 matches each) | 15.0 pts | 15.1 pts | indistinguishable from 0 |

Your split-half estimate of about 8 points for the true pairing spread (top 11, 54 pairings) and mine are both inside the same wide uncertainty. Either way, **today's real volume can't tell the top decks apart.** Three consequences:

1. **Spread is the one thing we can measure, and it's large.** The sim's deck rates have an sd of 20.6 points against a real one of a few points at most. That is the 14.9-point mean error. Your two fixes, a shrink at the product layer or a pilot-error knob fitted to the spread, are aimed at the right target; the fit's target is "real decks within a few points of each other".
2. **Order can't be judged yet.** With a flat real spread, the real ranks are mostly sampling noise: rank correlation 0.22 (−0.39 to 0.83). A bar of "rank correlation ≥ 0.7" can be neither met nor failed on this data. The same goes for k: a perfect engine's k is only well defined when the real side has signal.
3. **The binding constraint is real volume, not sim volume.** 160 sim games a pairing fixes the sim side, which was never the limit at 44 games (reliability 0.86). Order needs several times today's 1,103 real matches between the top decks.

**Proposal for the ship bar** (Justin's call; he approved yours this afternoon before this was known):
- **Now:** the spread bar, i.e. the sim's deck sd inside the real upper bound, and mean error within 1 point of the printed floor.
- **Later:** add rank correlation ≥ 0.7 and corrected k ≥ 0.6 once the real side's own split-half reliability reaches 0.5. The scoreboard can print that reliability so the switch is visible.

## 2. Win conditions (item 3): Forge does turn them on
`tools/log-closers.js` on the spells batch, 972 games:

| Deck | Win condition | Won | Lost |
| --- | --- | --- | --- |
| Azorius Control (49 won, 111 lost) | Restless Anchorage attacks, of the turns it could | 80% (164) | 47% (238) |
| | Restless Anchorage animated without attacking | 6% | 6% |
| | The Theorist, loyalty activations per own turn on the battlefield | 0.92 | 0.91 |
| 4c Control (76 won, 87 lost) | Great Hall of the Biblioplex attacks, of the turns it could | 33% (213) | 13% (183) |

- **Median last turn:** Azorius won 24 / lost 22; 4c won 23 / lost 16.
- **What this says:** Azorius activates its walker nearly every turn, and attacks with its land four times in five in the games it wins. Holding back in losses is mostly correct, since the land is needed to block or the board is lost. So I'm not building a `closer` rule set: the data doesn't show the failure it was meant to fix.
- **The open question is game length.** A median of 22–24 turns is long for Standard. If human control games end sooner, that's a pacing question, not a closing one. Arena logs from a control player would answer it.

## 3. The mirror gate on the two dead-card fixes
| Deck | Mirror result | Pilot actions |
| --- | --- | --- |
| Dimir Excruciator | 53% of 68 | 4 |
| Mono-Green Landfall | 55% of 73 | 18 |

**Neither result can judge a situational card**, as agreed. The sequential tests are running tonight.

## Files
- `tools/scoreboard.js`: the spread and order lines, and a rank column.
- `tools/log-closers.js` (new).
