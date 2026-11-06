# Sim principles (13 Oct 2026)

What Brewer v4 settled by example, written down so the next screen inherits it. Star Shard's UI-PRINCIPLES.md and WRITING.md still apply; these are the rules that are the sim's own, because the sim's subject is numbers that are uncertain, slow to produce, and only meaningful next to another number.

## Uncertainty

1. **Every rate carries its range.** A win rate is shown with its 95% range (as "48–56%" or a bar with the dot and the span), never alone. The range is part of the number, not a footnote.
2. **Under 30 games is hatched.** Fewer than 30 games (the `hatchUnder` in `method`) shows hatched and reads "few games, unsure"; the figure is still shown, because hiding it would be a claim too. The threshold lives in `method`, not in markup.
3. **Say whose result it is.** Until k clears 0.7 against real tournaments, every headline carries "under Forge's AI" and the fidelity line says what k is and on how many real games. The qualifier comes off by measurement, never by wording.
4. **Not counted is a state, not a deletion.** A matchup Forge pilots badly, a pairing with a card the AI can't cast, a draw-heavy pairing: the row stays, dimmed, with its reason in the open row, and is left out of the headline. "Everything else" is a row like the others, hatched, counted as even, and says so.
5. **Amber means a caveat about the data.** Few games, a card Forge won't cast, Forge stopped early. It never colours a thing or a verdict: a bad matchup is `--loss`, a good one `--win`.
6. **Round to what the games support.** Tens ("about 4 in 10") for a matchup; whole percentages for a field of 800 games; "1 in 13" for odds under half. Never a decimal on a number from fewer than 100 games.

## Waiting

7. **A run shows its progress, not a verdict.** While games play, Results shows the pulse strip (one square per game, yours green) and the sentence "Results show here when the run finishes"; no matchup number appears until the run is done, because the first games read as a verdict and are noise.
8. **The status line is where time lives.** Done · date · games · the method link; or running · N of M opponents · cancel. One line, mono, grey; it never becomes a card.
9. **Say what is being waited on.** "Reading the field", "writing sideboard plans", "fetching every opponent's decklist" instead of a spinner. The coach writing up a run says "The coach is writing this up."
10. **Queued behind nothing / behind N.** The run panel says what the queue holds before the button is pressed; the button says "Queue the run", never "Run" (it isn't instant) and never "Simulate" (we say the real word elsewhere; here the real word is queue).
11. **Estimates are ranges from measured cost.** "~1.7 h" comes from games × seconds per game on this machine, shown with ~, and recomputed from the last run, not a constant.

## Comparison

12. **One number per screen, everything else relative to it.** The headline sentence is the only Stat; the range, top-8 odds and the #1 deck sit on one line under it as qualifiers. A second Stat on the screen is a second screen.
13. **Compare like with like.** Two versions are compared on the same field, same week, same pilot, or the page says which of those differed ("some of the difference is the week"). A result on a newer field is a second result on the Versions row, not a replacement.
14. **Share of the field is a width, once.** Meta share is the first column of the matchup rows, as a bar whose width is the share. It is not also a strip, a legend, or a second chart.
15. **Sort by what it costs you.** Matchup rows order by losses in a field of 100 (share × loss rate), so the first row is the one worth fixing; "What would raise your odds" is the same ranking turned into actions, with the gain in top-8 points.
16. **Differences inside the noise are said to be.** Compare marks a swing under 6 games in 20 as "·" and says "inside the noise"; a tested option whose result is within 7 points says so next to the number. Never a green number for a difference the games can't support.
17. **The benchmark is the most-played deck, named.** "Izzet Spellementals, the most-played deck, wins 51 of 100" is the comparison a player makes in their head; the page makes it for them, with the same field and the same caveats.

## Disclosure

18. **One open row at a time.** A row's evidence (games, calibration shift, play/draw split, how the #1 deck did) opens under the row; opening another closes it. Nothing a reader needs to trust a number is more than one click from it, and nothing is a hover tooltip.
19. **The method is one object, one place.** Engine, games, field, calibration, display rule, card-stat caveat come from `run.method` and appear behind one link in the status line. No sentence about how numbers are made appears anywhere else on the page.
20. **An empty state says what will fill it.** "Compare needs two versions. Paste a new list from the Deck tab and run it." The section is otherwise absent, not a header over nothing.

## Words

21. **Say the real word.** Opponent, field, matchup, boarded, game 1, mulligan, on the play. Not "simulation target", "meta snapshot", "entity".
22. **No fourth wall.** The page never says "the sim thinks" or "our algorithm"; it says "Forge plays every game for both decks" and "under Forge's AI", because that is who played.
23. **Numbers are mono; words are not.** Dates, records, percentages, counts and eyebrows in `--mono`; titles, verdicts and sentences in Manrope.
