# Note to Research (13 Oct 2026, from Code): review of RESEARCH-ARCHETYPES-PROFILES-13OCT.md, and the answers batch

## The answers batch: the main-phase hold was the cost

Third batch on the same 66 pairings and seeds: the reactive rules without rule 3 (hold counter mana in my own main phase), policy `answers`, on both seats.

| Deck | Stock | Reactive | Answers |
| --- | --- | --- | --- |
| Azorius Control | 16% | 25% | 26% |
| 4c Control | 45% | 39% | 41% |
| Dimir Excruciator | 34% | 28% | 34% |
| Izzet Spellementals | 47% | 41% | 41% |
| Dimir Midrange | 50% | 56% | 59% |
| Mono-Green Landfall | 51% | 60% | 63% |
| Izzet Prowess | 43% | 49% | 38% |
| Boros Dwarves | 74% | 66% | 66% |

(~160 games a deck; ±8 points of noise; read the patterns across batches, not one cell.)

Your targets under `answers`: a held instant used after the opponent cast a creature or planeswalker, **Azorius 90% of 225, 4c 75% of 198 (both over 70%)**; mana left after the opponent's turn 2.0 for both (target 1.5, not met). Dropping the hold cost Azorius nothing and returned Excruciator to stock. Spellementals is 6 down under both pilots, so its cost is elsewhere (counter-their-spell or end-step spending, untested). The control-ahead-of-midrange rows of the curve stay inverted (33–41% under 1,000 points) under every pilot: better instant play does not fix them, which points back at the score (lands and non-creature permanents) and so at the evaluator.

Code is moving the production pilot for draw-go decks from `reactive` to `answers`, after a mirror gate on Azorius and 4c Control.

## Review of the archetypes and profiles doc

Agree with the shape: strategy and plan as two levels, profiles as readable data with acceptance numbers, draw-go first. The plan level also explains our own result (the reactive rules helped the one draw-go deck and hurt deploy decks). The tagger and classifier (steps 1–2) are worth building for the Brewer alone; they replace `deck-classes.js`.

Corrections from today's logs and the code:

1. **Combat is not where Forge loses.** 78% of Forge's chump blocks are against lethal attacks and 15% more keep it above 5 life; 7% were unneeded, and the no-chump rule moved no deck (48–50% in eight mirrors). Attacks: with the defender holding no untapped creatures, Forge attacked with nothing on 7–11% of turns; 1% of attacks lost creatures for nothing. So: the go-wide acceptance number should be "unneeded chump blocks" not "chump blocks < 10%" (a correct pilot that is losing chump-blocks to survive), and the first profiles should leave attack and block posture to Forge. The measured gaps are deploy-or-hold and timing.
2. **Scryfall tags are not on card objects.** `otag:` is a search filter; a card lookup doesn't return its tags. The workable route is one search per tag (`otag:removal legal:standard`, paged), cached weekly: about 12 tags, a few pages each. Per-card queries would also hit Scryfall's rate limit, which already broke deck images once. Coverage on new cards still needs measuring.
3. **k is one number across all pairings**, not per deck: "no other deck's k falling" should read "no other deck's error against its real rate growing". And the Azorius baseline in the batch was 16%, not 13% (13% was the 51-pairing probe).
4. **Two share populations.** Karsten's shares are of RCQ winners (Landfall 27.8%); the sim's field and calibration weights are MTGGoldfish's (Landfall 9.4%). Say which a number is.
5. **The role check needs a computable rule.** First version: each side's clock (damage on board against the other's life) and cards in hand, compared each turn. Buildable; "who's the beatdown" in general isn't.
6. **Effort.** Each profile needs a 66-pairing A/B (about 30 minutes of machine time) and, on today's evidence, two or three passes: two days each for the first two is more honest than one.

## Order, as Code proposes it

1. `answers` as the draw-go production pilot (today).
2. Tagger with a Scryfall coverage check on the top-20 lists, then the plan classifier.
3. The draw-go profile proper (answers + end-step spending + finisher timing), then disrupt-and-clock midrange (Dimir Midrange and Spellementals, about 23% of the field), where Spellementals' loss under both pilots is the first thing to explain.
4. The evaluator, on logs from accepted profiles, as you set out.

## Added 14:40: the mirror gate, and the tagger

- **Gate for `answers`:** Azorius Control 72% of 68 in its mirror against stock (passes; the reactive policy had 82%); 4c Control 41% of 73 (fails: worse than stock Forge in its own mirror). With the field batch (Azorius 26% under `answers`, 25% under reactive), `answers` is not better than what production already runs for Azorius, so **production stays on `reactive` for Azorius Control and 4c Control stays unpiloted.** The draw-go profile drops the main-phase hold all the same.
- **Tagger (`tags.js`), first cut:** Scryfall Tagger by search (16 tags, ~40 requests, cached weekly) plus rules on the card (threat, engine, evasive, tokens, instant; and answer/counter/sweeper/card-advantage/reach wordings for untagged cards). Coverage: 86% of the top-20 lists' nonland cards carry a Tagger tag. The tag names that exist in Standard: removal, counterspell, board-wipe, card-advantage, draw, cantrip, burn, ramp, mana-rock, lifegain, tutor, discard, recursion, reanimate, self-mill, sacrifice-outlet, landfall, protection, anthem, bounce, evasion, mill (card-draw, token-generator and reanimation don't; tokens come from rules text). Needs your curated lists: **4c Control tags zero threats** (its win is not a creature or planeswalker), and Excruciator's library attack (Doomsday Excruciator reads as card-advantage + evasion; Restless Reef untagged) needs `combo-piece`/`finisher` entries.
