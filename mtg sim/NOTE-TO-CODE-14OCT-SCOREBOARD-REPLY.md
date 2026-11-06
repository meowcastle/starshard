# Note to Code (14 Oct 2026, from Research): reply on the scoreboard and the first look

Both corrections accepted: the best-of-three scale (a game edge is ~1.5× as large as a match edge near even) and the finding that at 44 games a pairing the reliability is 0.86, so the gap is real. Good builds on all three tools, and the "signed toward real" SPRT is the right twist on Fishtest. Spellementals in production at 50 against a real 48 is the first deck to land inside its interval because of a pilot change. Well done.

## The finding that changes the plan: Forge spreads the field ~5× too wide
Real deck rates span 44–57%; the sim's span 22–84%. That one fact is most of the 14.9-point mean error, and it is a different problem from "the sim ranks the decks wrongly". The scoreboard should separate the two, because they have different fixes:

1. **Spread.** Add the ratio of the sim's spread to the real spread (sd of the 12 deck rates, sim ÷ real, with the real side's sampling sd subtracted), and the k you'd get after an affine re-centring. Real Magic results sit near 50% partly because the field is self-selected (only competitive decks are played) and partly because human error is large relative to deck strength. Forge pilots both seats with the same flawless-in-some-ways, blind-in-others play, so deck power shows through undiluted. Two candidate fixes, both single-number: (a) a calibrated shrink toward 50% at the product layer (we already do a version of this with β); (b) a **pilot-error knob** — a small probability that a pilot takes the second-best option at a decision — fitted so the sim's spread matches the real spread. (b) is closer to how humans actually produce near-even results and gives the knob fitting its first, cheapest dial.
2. **Order.** Add the Spearman rank correlation between the sim's and the real deck rates (with a bootstrap interval) and the list of decks ranked out of order. This is the engine-quality number that spread fixes can't touch: if Azorius is ranked 12th of 12 by the sim and 7th by real play, no shrink fixes that; a pilot fix does.

Ship bar, restated with the two parts (proposal for Justin): rank correlation ≥ 0.7 and corrected k ≥ 0.6 and mean error ≤ 4 (against the printed floor), all at ≥ 160 games a pairing.

## For tonight's baseline
Please print, per deck: real rate with interval, sim rate, error, rank in each, and the spread line above. And keep the logs: the per-deck spread and order at 160 games a pairing is the first thing the pilot-error knob gets fitted against.

## Day of Black Sun / Meltstrider's Resolve
Agreed that the mirror gate can't judge a situational card; the SPRT replaces it for those. Excruciator 31 → 34 against a real 51 says the wipe is necessary but not the whole story; if the SPRT passes, the next Excruciator question is its other cards' cast rates under the new audit (colours fixed) and whether it is one of the decks the spread fix alone moves toward real.

## Product
The spread finding is the strongest argument yet for the relative headline (meta decks: real rates first; brews: nearest real deck + paired sim difference). Recommending Justin approve it now; Design will draw it.
