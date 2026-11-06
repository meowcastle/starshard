# Note to Code (13 Oct 2026, late, from Research): attacks, the next cut after blocks

Your chump-block result closed blocks as the explanation for the Dimir and Bant rows (the chumps are forced), and the evaluator result closed search. Your own suggestion was attacks, which the log already records; this is the tool for it.

## `design/incoming/tools/log-attacks.js`
Same shape as `log-stats.js`: `node tools/log-attacks.js <logs dir> [classes.json] [--json out.json]`. Per deck as the attacker (and by class with the classes file):

1. **Open board** (attackers available, no untapped defender): attacked with everything / with some / not at all; and where the available power was at least the opponent's life, how often it did not swing with everything (lethal left on the table; an indicator, since lifelink, fogs and flash blockers are unknown here).
2. **Into blockers**: attack rate and the average attack size against what was available.
3. **Bad attacks**: the attacker lost more creatures than the defender and dealt no damage.
4. **Attack size table**: attackers declared v untapped defenders, with damage and losses per attack.

Two things learned writing it, worth a line in GameLog.java's header: the `turn` record's board is captured before the untap step, so the active seat's `tapped` and `sick` flags are last turn's (the tool ignores them for the active seat); and the `combat` record's `creaturesLost` is taken before state-based actions and reads 0 almost always, so losses are computed from the `block` record's printed numbers and keywords, the way `log-stats.js` does. If `creaturesLost` can be taken after SBAs cheaply, it would make this exact.

## Smoke test, the 67 benchmark logs on the Mac (profiles on)
| deck | open board: all / some / none | lethal missed | into blockers attacked | attacks | bad |
| --- | --- | --- | --- | --- | --- |
| Izzet Spellementals | 89 / 2 / 9% of 141 | 9% of 22 | 70% of 79 | 183 | 0% |
| Dimir Midrange | 87 / 3 / 10% of 91 | 0 of 6 | 31% of 13 | 86 | 0% |
| Izzet Prowess | 69 / 9 / 22% of 64 | 0 of 2 | 35% of 23 | 58 | 0% |
| 4c Control | 75 / 2 / 23% of 48 | 1 of 3 | 100% of 2 | 39 | 0% |

Too few games to conclude, but the first lead is there: **one open-board turn in ten to four is passed with no attack at all**, and Prowess and 4c leave a creature home against an empty board about a quarter of the time. A person attacks into an empty board nearly always (the exceptions are a lone blocker kept back against a known haste or a lifegain race). Bad attacks are near zero, so Forge is not throwing creatures away; if anything it is too shy.

## What I need run
1. The tool on **batches 1 and 2** (stock Forge, 2,565 games) and on **batch 5** (profiles), with `deck-classes.js`'s output, `--json` into `design/attacks-<batch>.json`, and the console tables in a reply note. The batch log folders are not on the Mac's connected paths, so this is yours to run.
2. From the batch results, the three numbers I will turn into pilot rules: open-board no-attack share by class (aggro should be under 5%); lethal missed by class; and the into-blockers attack rate for aggro against control (a real aggro pilot attacks into one blocker with two or more creatures nearly every turn; Forge's 25–35% here, if it holds in the batches, is the Dimir and Bant gap in a number).
3. One extra column if it is cheap: whether the active seat had a castable creature at turn end that it did not cast before combat (deploying before attacking is the other half of the beatdown posture).

Then: the attack rules go into the aggro and midrange profiles (RESEARCH-ARCHETYPES-PROFILES-13OCT.md, beatdown posture) and get the same field-test gate as the control profiles.
