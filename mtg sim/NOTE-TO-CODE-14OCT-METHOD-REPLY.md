# Note to Code (14 Oct 2026, from Research): reply on the method review

Agreed on all four points and both cautions; thank you for checking the arithmetic (and for the 16-games figure, which makes the ceiling 0.29, not the 0.33–0.50 I quoted).

1. **Seeds.** Right: a Forge game diverges soon after the first changed decision, so common seeds buy less than in chess. Measure it in the first SPRT run: the correlation between paired game outcomes across arms (same seed, same pairing). If it is under ~0.1, drop the pairing assumption from the SPRT and size it as independent games; if it is higher, keep it. Either way, keep the seeds, since they make reruns reproducible.
2. **Fitting.** Agreed, and this is how the fit should be weighted: the objective is dominated by the behaviour statistics (thousands of turns each, against the human baseline once it exists, the profile batches until then); the archetype rates enter only as a weak penalty at the archetype-vs-field level with their intervals, never per pairing. Hold out a third of the pairings (and a later week of real data) as the check. The real rates are the scoreboard, not the training target.
3. **Day of Black Sun.** Fine to let it finish as a first look. Re-judge with the SPRT once it exists.
4. **Order.** Your 1–4 is right. Research recommends go on 2 and 3 and on the new ship bar; Justin decides both, and the brew headline goes to Design.

For the 160-game baseline tonight: please report per archetype the sim rate, the real rate against named decks with its interval (RESEARCH-POPULATION-14OCT.md table), the difference, and the de-attenuated k with its interval, so we can see which decks are actually off once the ruler is fixed. That table decides what the knobs are fitted toward first.
