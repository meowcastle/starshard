# The population question, tested on the real matches (research, 14 Oct 2026)

Code's search note closed decision quality as the explanation for the control gap (Azorius Control 13–21% under every search, real 41%) and named two suspects left: the population (the real 41% is a field of people misplaying against control, or strong players choosing control) and deck selection. The first is testable with data we already hold, so I tested it.

## Data
Jiliac/MTGODecklistCache (the sim's own calibration source: melee.gg and topdeck.gg paper events), Standard, June–October 2026: 56 events with round-by-round results, 1,413 decklists, 2,808 matches with a winner. 97% of players in matches have a published list. Archetypes for September–October (the current meta) by clustering the lists on non-land cards and naming the clusters by their top cards (16 clusters → 13 named archetypes + "other", the rogue decks). June–August matches carry no archetype and serve only to estimate players.

## 1. Who pilots which deck, and does it matter
A logistic model of each match: P(player 1 wins) = σ(skill₁ − skill₂ + deck₁ − deck₂), player strengths with a prior (sd 0.5), deck effects with a looser one, fit by five-fold cross-validation on the September–October non-mirror matches.

| | held-out log loss | accuracy |
| --- | --- | --- |
| deck effects only | 0.697 | 53.7% |
| deck + player strength | 0.689 | 55.4% |
| (a coin flip) | 0.693 | 50% |

Player strength is real but small: it buys 1.7 points of accuracy, and the fitted strengths have a spread (sd 0.23) under the deck effects (0.27). More to the point, **the pilots of each archetype are equally strong**: the mean fitted strength of Azorius Control's pilots is +0.06, the same as Landfall's (+0.04), Dimir's (+0.04) and everyone else's (+0.04 to +0.07); the share of regulars (3+ events) among Azorius pilots is 5%, against 20% for Landfall and Dimir. Adjusting every archetype's win rate for who piloted it moves nothing by more than two points:

| archetype (Sept–Oct) | matches | raw | skill-adjusted | pilot strength |
| --- | --- | --- | --- | --- |
| Mono-Green Landfall | 330 | 54% | 54% | +0.04 |
| Dimir Midrange | 297 | 51% | 50% | +0.04 |
| Izzet Spellementals | 227 | 50% | 50% | +0.05 |
| 4c Control | 206 | 54% | 53% | +0.06 |
| Azorius Control | 148 | 51% | 52% | +0.06 |
| Boros Aggro | 136 | 60% | 62% | +0.06 |
| Jund Sacrifice | 100 | 44% | 42% | +0.06 |
| Dimir Excruciator | 78 | 63% | 63% | +0.07 |
| Lifegain | 73 | 41% | 41% | +0.07 |
| Izzet Prowess | 67 | 52% | 52% | +0.07 |
| Airbending | 59 | 42% | 41% | +0.07 |

**The population hypothesis is not supported.** Azorius's real results are not better pilots, and the people it beats are not weaker than the people other decks beat. Drop it as a line of work.

## 2. The real side is thinner than the comparison treats it
Azorius Control against the named meta decks: **44% (34–54%) from 98 matches**; against rogue decks 66% from 50, which is why its whole-field number is 51. Forge's 13–21% is outside that interval, so the gap is real, but the per-pairing "real" numbers the k fit uses are 10–18 matches each (Azorius v Dimir 6–7, v 4c 3–11, v Landfall 7–11): ±25 points apiece. Two consequences:
- **Fit and report k at the archetype-against-the-field level** (n ≈ 100–300) and by class pairing, beside the per-pairing fit; the per-pairing residuals are mostly noise and the control rows should not be read one pairing at a time.
- The real numbers for Dimir Excruciator (62% v named decks, n=50) and Airbending (40%, n=43) differ from the sim's table (50 and 22): different window and classification. Worth reconciling: the sim's "nearest meta deck by overlap" against my clusters, on the same window.

Real rates for every archetype against the named decks, for the calibration table: Landfall 55 (49–62), Dimir Midrange 48 (41–55), Spellementals 48 (40–56), 4c Control 55 (47–63), Azorius 44 (34–54), Boros Aggro 55 (45–64), Jund Sacrifice 40 (30–52), Excruciator 62 (48–74), Lifegain 38 (26–52), Prowess 56 (42–68), Airbending 40 (26–54). Spellementals now has a real rate for the profile gate.

## 3. What is left for the control gap
With decision quality, blocks, attacks, search and population all tested, the honest list is short:
1. **The win condition.** The real Azorius lists win with Restless Anchorage (a creature-land), Wan Shi Tong and Seam Rip; Forge's AI is known to under-use man-lands and other activated win conditions. This is the "win condition never deployed" cut from the 13 Oct order (item 4) that was never run: in the Azorius logs, how often does it activate Restless Anchorage or attack with it, and in what share of its losses did it hold a castable or activatable win condition for 3+ turns? Ten lines on `log-leaks.js`'s pattern. If Forge never turns the land on, the gap is a dead-card problem of the Airbender Ascension kind, and the fix is a rule, not a search.
2. **The list itself.** Forge plays one Azorius list (the Goldfish aggregate); the real 44% is many lists. Check that the aggregate carries the win conditions the clusters show (Restless Anchorage ×2–4, Wan Shi Tong, Aven Interrupter in some) and the current removal suite (Erode, Get Lost, Seam Rip, No More Lies).
3. **Noise.** Part of "41 vs 13" is the interval above and the per-pairing thinness; at the field level the gap is 44 (34–54) against 13–31 (profiles), i.e. the profiles closed somewhere between a third and all of it already.

## Decisions asked of research (Code's small-items note)
- **Spells-matter profile:** behaviour targets met, +4 inside noise, and it now has a real rate (48%, Spellementals is at 46–50 under both). Run the full 66-pairing gate (30 min on the Mac); promote if no other deck moves away beyond noise and the mirror is ≥ 50%. The instant-timing rule's A/B stays worth running as a behaviour fix, as Code says.
- **Bant Airbending:** Forge plays it as a flash-flier deck (51%) and the real deck is 40% here, 22% in the sim's window: overrated either way, and the combo is never assembled. Exclude it from the counted field until a pilot can play the combo; add Airbender Ascension to the dead-card list as research-only; the re-curated entry stands with its note.

## Files
`design/incoming/tools/realdata-model/` (load, cluster, model2, table): a sparse clone of the cache's 2026 folders plus `python3 -I load.py && python3 -I cluster.py && python3 -I model2.py && python3 -I table.py`. The server's own classification (nearest meta deck by overlap) is the better archetype label; the model is indifferent to which is used.
