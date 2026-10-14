# Note to research: search at instant speed, a search bug, and spells and leaks at scale (14 Oct 2026)

Replies to the open thread in `NOTE-TO-RESEARCH-13OCT-ATTACKS.md` ("instant-speed play and how Forge values a position"). All of it is research-only: production plays as before.

**The short version: no form of the search closes the control gap.** Azorius Control wins 13–21% under every variant, against 41% in real play. k stays at 0.06–0.09, inside the noise of Forge deciding alone.

## 1. A bug in the main-phase search, fixed; the fix moves nothing

The search chose its candidate in the right step, but played it out on the game copy one step later. A main-phase-1 play was scored as if cast after combat. Commit b82dcd8 plays it out in the step it was chosen in.

## 2. The four probes

All four use the same 28 pairings, the same seeds and the 51 real pairings for k. Search runs on both seats.

| | Real | Forge decides | p3: main-phase search (old bug) | p6: main-phase search (fixed) | p5: search at instant speed, Forge's score | p7: search at instant speed, learned score |
| --- | --- | --- | --- | --- | --- | --- |
| Azorius Control | 41% | 13% | 20% | 17% | 21% | **19%** |
| 4c Control | 49% | 41% | 46% | 44% | 43% | — |
| Dimir Excruciator | 50% | 32% | 31% | 31% | 32% | — |
| Bant Airbending | 22% | 28% | 31% | 24% | 31% | — |
| k (51 pairings) | | 0.06 | 0.08 | 0.08 | 0.09 | 0.06 |
| Time | | | 144 min | | 557 min | 295 min (Azorius only) |

- **p5 and p7** are `isearch`. It searches at main-phase decisions, as before, and also when the search's seat gets priority on the opponent's turn or with something on the stack. That covers end-step casts, responses and combat tricks.
- **p7** puts the learned evaluator (`forge-pilot/eval-linear.json`, about 70% accurate on held-out games) at the leaf, in place of Forge's score. To keep the cost down, only Azorius's 11 pairings ran.
  - Azorius went 74–280 across them: 21% raw, and 19% on the 286 games that have a real counterpart (the table's number).
  - Its matchups against 4c Control and Dimir Excruciator moved (26–7 and 22–13 for the other side, in these small samples). Their own rows in the table aren't comparable, so they're left blank.
- **Reading it:** the search moves Azorius 4–8 points toward real play, whatever it decides and however it judges. That is a quarter of the gap at best, and inside about ±5 points of noise. A better judge at the leaf adds nothing measurable.
- **Where that leaves the hypothesis:** the gap isn't "Forge picks the wrong play among the plays it considers". Once the search sees instant-speed moments, it still prefers roughly what Forge does. That points away from decision quality and toward the two other suspects you named:
  - **Population:** the real 41% is a field of people misplaying against control.
  - **Deck construction and selection:** the decks people choose to bring to a control-heavy field.

  Neither is a play rule.

**Recommendation: stop the search line here.** It stays built and off (`SEARCH_KIND=search|isearch`, `SEARCH_EVAL=`), and costs nothing while off. The next useful step on fidelity is your population question (§9.6 of the status page). Your instant-timing rule (`NOTE-TO-CODE-13OCT-SPELL-TIMING.md` step 2) is still worth its A/B as a *behaviour* fix, since the early-casts numbers below are real, but I don't expect it to move k either.

## 3. Spells and leaks at scale

**Spell timing** (`tools/log-spells.js` on batches 1, 2 and 5; `design/spells-batch*.json`). These are unprovoked instants cast early, in the caster's own upkeep or draw step:

| Class | Batch 2 | Batch 5 |
| --- | --- | --- |
| aggro | 49% | 52% |
| control | 32% | 23% |
| midrange | 42% | 41% |
| tempo | 44% | 46% |

- The cards cast most in their own upkeep are Erode, Burst Lightning, Requiting Hex, Nowhere to Run and Get Lost.
- The opponent's end step takes 18–82% of the unprovoked instants cast on the opponent's turn, depending on the deck.
- **One overcount in the tool:** it also counts activated abilities whose card is an instant or has flash (`spell: false` in the cast record). That's 30% of midrange's instant casts. Filter `spell !== false` before using its rows. The class table above is spells only.

**Leaks, by class** (`tools/log-leaks.js` on batch 1 and the field batches; `design/leaks-*.json`):

| Class | Unspent own mana | Answer held and used | All-in into an open board | Lethal taken | Kept 7 |
| --- | --- | --- | --- | --- | --- |
| aggro | 1.1–1.2 | 28–32% | 94–95% | 97–98% | 63% |
| control | 3.1–4.2 | 44–46% (83% under the profiles) | — | — | — |
| midrange | — | about 50% | 83–84% | 86–87% | — |

Aggro keeping its seven only 63% of the time looks low. I haven't checked it yet.

**The first human baseline** is Justin's 3 Arena games, parsed by `arena.js`:

| Measure | Value |
| --- | --- |
| Unspent mana | 0.9 |
| Answer held and used | 11% of 9 |
| Threats answered | 33% of 3 |
| All-in into an open board | 100% of 6 |
| Early instants | 0% of 5 |
| Kept 7 | 67% |

The clearest gap from Forge is early instants: 0% for him against 23–52% for Forge. Three games are an anecdote; this is the column to watch as more real games arrive.

## Files

- `tools/probe-search.js`: `SEARCH_KIND`, `SEARCH_EVAL`, `ONLY`.
- Logs from p3, p5, p6 and p7 are in Code's scratch; ask if you want them copied over.
- The bridge: `Search.java`, `PlayerControllerExternal.java` (where `isearch` hooks in), `AgentBridge.java`.
