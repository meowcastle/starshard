# Work order: accuracy pass (Code, 12 Oct 2026)

**From:** the research session · **To:** the Code session working in `mtg sim/` · **Owner:** Justin
**Why:** `calib.fidelity()` on 12 Oct measured **k = 0.00 (95% −0.22 to 0.22)** on 32 pairings / 584 real games. Forge's raw matchup rates currently carry no measurable information about real Standard results. The research behind this order is in the project doc *Forge Sim Accuracy Research* (and `claude/sim-accuracy-research.md` in the magic sim project).

**The one success metric:** k moves away from zero on the same real data. Report it (with its range and real-game count) in the commit message of every item below. Nothing else counts as "more accurate."

**Scope rule:** this order touches `forge.js`, `server.js`, `cardstats.js`, `sideboard.js`, `realdata.js`, `Dockerfile`, `docker-compose.yml`, `worker.js` and the README. It does not touch `public/index.html` beyond binding new fields that already have a `{{ }}` home; anything that needs new markup goes in `NOTE-TO-DESIGN-*.md`, as before.

Items are in order. 1–5 are this week's. Each has: what to change, where, and the acceptance check.

---

## 1. Flag cards the AI can't play

**What.** Before a run, mark every card in every deck as *ok*, *AI-limited* or *AI-unplayable*, and surface the count. Two sources, both from Forge itself:

- **Card scripts.** Forge ships them in the installed tree at `<FORGE_DIR>/res/cardsfolder/<first letter>/<slug>.txt` (slug = lowercase name, every run of non-alphanumerics → `_`; a split/adventure/MDFC card has one file for the whole card, named after the front face). A line `AI:RemoveDeck:All` means the AI treats the card as unplayable (`AiController.getSpellAbilityToPlay()` strips those abilities entirely). `AI:RemoveDeck:Random` means "situational, left out of random AI decks" → *AI-limited*. `AI:RemoveDeck:NonCommander` is Commander-only → *AI-limited* outside Commander.
- **Forge's own warning.** At game 1 start the non-quiet log prints the "AI can't play these cards well" list (`complainCardsCantPlayWell` in `PlayerControllerAi`). Parse it out of the log in `forge.js` (it's one line per card before the first `Turn:` line) and union it with the script check; this catches cards whose effect has no AI logic without a script flag.

**Where.**
- New `aihints.js`: `scan(deck) → { ok: n, limited: [names], unplayable: [names] }`, reading the cardsfolder once and caching by slug (the folder is ~34k files; read on demand, not at start).
- `forge.js`: capture the warning lines into `results.aiWarnings`.
- `server.js`: run `scan` when a brew version or a field deck is created; store on the deck as `deck.ai = { playable, limited, unplayable }`. A pairing where either deck has `unplayable.length > 0` is marked `pr.tainted = 'unplayable'`. Tainted pairings are **excluded from `forgePairs()` (calibration input) and from the headline**, and shown with an amber "not counted · N cards the AI can't play" line, the same treatment the 7 Oct "control/combo" flag got (`col2Label` note in `NOTE-TO-DESIGN-06OCT.md`).
- `cardstats.js` rows for limited/unplayable cards get `row.ai = 'limited' | 'unplayable'` so the coach and the Results table can mute them.

**Acceptance.** Scan the current Standard top-16 field: print each deck as "N/60 playable". Any deck with an unplayable card shows the amber line on the page. `forgePairs()` output for the format shrinks by exactly the tainted pairings and nothing else.

## 2. Draws are not half-wins

**What.** Today a game that runs past the clock (180 s) is a draw, and draws lower both sides' win counts without being shown. Report them, and stop long games from being draws in the first place.

**Where.**
- `server.js` line ~335 / ~385 / ~466: `clock: 180` → `clock: +process.env.SIM_CLOCK || 600`. Add `SIM_CLOCK` to `docker-compose.yml`. The Mac worker reads `clock` from the claim, so nothing to change there.
- `forge.js` already counts `results.draws`. Carry `draws` through `history` and the brew run summary (`played(p)` must count draws as played, not as losses). Headline win rate = wins / (wins + losses), with "N draws" beside it.
- A pairing with draws > 10% of games gets `pr.tainted = 'draws'` and the same not-counted treatment as item 1.

**Acceptance.** Run the field's slowest pairing (a control mirror) 20 games at 180 s and at 600 s; draw count must fall. Draw rate appears per opponent row.

## 3. Who plays first

**What.** Forge's AI always chooses to play, and the loser of each game plays first in the next (`PlayerControllerAi.chooseStartingPlayer`, `GameAction.determineFirstTurnPlayer`). Over 20 independent games that means the *loser is always on the play*, which drags every matchup toward 50%. Real best-of-three: game 1 is a coin flip, then the loser chooses (and nearly always plays).

**Where.**
- `forge.js`: add `seed` to `runSim` → `-s <seed>`. Add `swap: true` → write the decks in reverse order (deck2 as `deck1.dck`) and un-swap the result indices.
- `server.js`: a game-1 phase of N games becomes two Forge runs of N/2 with the deck order swapped and seeds `base` and `base+1`. Forge's first game in a run has a random first player; with the order swapped half the time, each deck is on the play for game 1 of each half-run. Post-board phases stay as one run (loser-plays is the real rule there).
- `forge.js` already records `g.first`. Add to the pairing summary: `onPlay: [wins, games]`, `onDraw: [wins, games]` for deck A, and show both on the opponent row's grey line.
- `calib.js` / `forgePairs()`: the comment at `server.js` ~421 ("the loser of each game plays first in the next, so the raw count leans toward 50%") already knows this; once item 3 is in, remove whatever correction that block applies so it isn't applied twice.

**Acceptance.** On a top-8 gauntlet, deck A's on-play rate exceeds its on-draw rate on average by a few points (the real-world figure is roughly 52–55% on the play in constructed). Seeds make a run reproducible: same seed + same lists → same game log.

## 4. More games, where they count

**What.** ±22 points at 20 games. Raise the first pass and let the extra-games loop do the rest.

**Where.**
- `server.js` ~251 `const GAMES = 20` → `40`, and make it `SIM_GAMES` in env. Keep `MAX_GAMES` at 200 as the per-pairing cap.
- The extra-games loop at ~192–212 already adds games where the 95% range is widest. Change its priority to: pairings whose range **crosses 50%** first, weighted by the opponent's meta share; stop a pairing at 200 or when the range no longer crosses 50%.
- Time estimate at ~265 uses `GAMES`; it updates itself.
- Calibration round robins (`low: true`, ~466) stay at 20 so they keep yielding to members' runs.

**Acceptance.** A top-8 gauntlet's headline range narrows from roughly ±8 to ±5 at the same wall-clock budget as two of today's runs. Note the measured games/minute on the NAS and the Mac in the commit.

## 5. Pilot control decks as control

**What.** Forge plays defensively only when the deck name contains "Control" or the average mana value is over 3 (`PlayerControllerAi.setupAutoProfile`). `forge.js` already appends " Control" when `d.ai === 'control'`; nothing sets `d.ai` for field decks today.

**Where.**
- Archetype posture: one call per field snapshot (the coach's model is already wired) or a static table keyed by MTGGoldfish archetype slug: `aggro | midrange | control | combo`. Store on the field deck as `d.posture`; the brew's own posture comes from the deck check step (ask the user once, default from average mana value and instant/counterspell count).
- `forge.js`: `d.ai === 'control'` → derive from `d.posture`. Also pass `-a` per seat: `control → Cautious`, `aggro → Default`, `midrange/combo → Default` (profiles are in `<FORGE_DIR>/res/ai/`). `forge.js` already supports `d.profile`.
- Mark combo-posture opponents `pr.tainted = 'combo'` for calibration (Forge's own wiki says it is "pretty bad for most combo decks"); the 7 Oct "not counted" flag already does this by reading the list, so unify the two.

**Acceptance.** A/B on fixed seeds: the same control archetype vs the field, named with and without "Control" and with `Cautious` vs `Default`. Report its win rate and draw rate both ways. After one calibration refit, the control archetypes' `beta` values should sit closer to zero than before.

## 6. Hybrid simulation AI (needs a Forge build)

**What.** The `sim` command creates AI players with `options = null`, so Forge's simulation AI is never on; `-a` only picks heuristic profiles. Hybrid mode (July 2026, PR #11436) keeps the heuristic choice but vetoes plays a depth-0 lookahead scores badly.

**Where.**
- `Dockerfile`: a second stage that clones `Card-Forge/forge` at a pinned commit, applies a one-line patch to `forge-gui-desktop/src/main/java/forge/view/SimulateMatch.java` (pass `Set.of(AIOption.USE_HYBRID_SIMULATION)` into `createAiPlayer` for each seat), builds with Maven, and copies the jar in. Gate it behind a build arg `FORGE_HYBRID=1` so the stock build stays the default until measured.
- `worker.js`: refuses to join unless its Forge version string matches the server's; the patched build must report a distinct version (e.g. `2.0.15-hybrid`) so a stock Mac worker can't mix in.

**Acceptance.** Same seeds, same lists, stock vs hybrid: games/minute, draw rate, and after a refit, k. Keep whichever has the better k at acceptable speed. Do not ship hybrid on speed alone.

## 7. Audit the sideboard plans against real pilots

**What.** `realdata.js` already fetches every real deck's main; the Jiliac files also carry `Sideboard`. Keep it, and for each meta pairing compare Claude's plan (`data/plans.json`) with what real pilots boarded: cards appearing in the real 60 for that matchup more often than their game-1 rate is a proxy for "brought in".

**Where.** `realdata.js` `event()`: keep `Sideboard`. New admin endpoint `/api/plans/audit?format=standard` → per pairing, the share of Claude's "in" cards that real pilots also carry in the 75, and the real sideboard's top cards vs that opponent. Feed the top-3 disagreement list into the sideboard prompt as a hint ("real pilots in this matchup most often bring in: …").

**Acceptance.** The audit page lists every current pairing with its agreement share. After the hint is in the prompt, the share rises.

## 8. Widen the real-data net

**What.** 584 games is the reason k can't be measured. The same Jiliac archive has MTGO Challenges and Leagues (`Tournaments/mtgo.com/`), which are larger and closer to "competitive".

**Where.** `realdata.js` `SOURCES`: add `'mtgo.com'`. Weight events in `calib.fit` by level: Pro Tour / RC × 2, MTGO Challenge × 1.5, RCQ × 1, store championship × 0.75 (a `weight` on each row's `w`). Keep the per-event cache.

**Acceptance.** Real games per pairing at least triples; k's range narrows. Report both.

## 9. Show k and the calibration on the page

**What.** Users read 57% as a prediction. Put the truth next to it.

**Where.** `/api/me` or the run payload already carries `fidelity` from `refit()`. Bind: "Forge agrees with real results k = 0.00 (±0.22) on 584 real games" under the headline, and each opponent row's `beta` ("Forge overrates this deck by N points"). Markup home: the `rateHead` / grey-line area from the 7 Oct note. If a new line is needed, write it up for Design.

**Acceptance.** The number on the page equals `calib.fidelity()` for the current format.

## 10. Per-posture AI profiles (later)

Fork `Default.ai` into `Aggro.ai` / `Midrange.ai` / `Control.ai` in `<FORGE_DIR>/res/ai/`, tune counter chances, attack-into-trade, mulligan threshold and combat-trick holding per class, and pit them with `-a` on fixed seeds. Only after items 1–6, and only measured by self-play strength first, then k.

---

## Don'ts

- Don't loosen the calibration pull (`lambdaMin`/`lambdaMax` in `calib.fit`) to make the page look calibrated. The 12 Oct fit found the spread of betas no bigger than their noise; the pull at its maximum is correct. The old fixed pull of 2 moved Lifegain 14% → 46% on 8 units of evidence; that was the bug.
- Don't tune AI settings by whether the numbers match real results. Tune by whether it plays better on fixed seeds, then check k.
- Don't show card-performance rows for AI-limited cards without the flag from item 1.
- Don't change `GAMES` for the calibration round robins; they must stay cheap enough to run every week.

## Order of commits

1 → 2 → 3 (these three change what a "game" means; refit after all three, not between) → 4 → 5 → refit and record k → 9 → 8 → 6 → 7 → 10.

---

## Reply to Code's assessment (12 Oct, later)

Agreed, with two corrections to this order that Code caught:

- **Item 3:** the play/draw fix shipped 10 Oct. The "remove the correction in `forgePairs()`" line above is wrong and is withdrawn; that correction *is* the fix. Only the seeds (`-s`, for reproducible runs) remain from item 3.
- **Item 5:** `Cautious` is the wrong profile for control: it counters less than `Default`. Withdrawn.

Items 2, 4, 6 and 8 are dropped for the reasons Code gave.

**Go ahead with:** 7 (sideboard plans checked against real pilots, gaps fed to the coach), 1's warning parser (flag brew cards Forge's AI can't play), and seeds.

**One correction to the order's premise.** k's 95% range is ±0.22 on 584 games, so the +0.04 and +0.05 measured for items 5 and 6 are not "no gain"; they are unmeasurable either way. k is the right long-run metric and the wrong short-run one. Two additions, in priority:

- **An interim metric that needs no real data.** Self-play strength on fixed seeds: a changed AI (profile, patch, posture rule) against the stock AI, same lists, same seeds, both seat orders. Report wins and games/minute. This is how Forge's own developers judge AI changes (the `-a` flag was added for exactly this). It would have given item 6 a verdict; keep the patched build around for that test rather than deleting it.
- **A bigger current-Standard real-data source.** Nothing on this list moves k until real games grow past the hundreds. Worth checking, in order: Melee's own event pages (round-by-round results for RCQs and RCs), MTGTop8's archetype pages (per-matchup records from recorded events), and MTGGoldfish's tournament pages. If any can be read, it is worth more than every AI change above.
