# Strategy-first: rebuilding the sim around the brewer's loop (23 Oct 2026)

Justin: "Rebuild the whole sim UI and strategy around this function, and develop the engine to be hyper-focused on this: strategy brewers refine and develop."
"This function" is the W/B Final Fantasy thread's method (`design/incoming/WB-FF-THREAD.md`, `REFINE-BY-STRATEGY-23OCT.md`).
Board: "strategy-first rebuild" on the canvas (far left). File: `design/DESIGN-STRATEGY-FIRST-23OCT.html`.

## 1 · What the product is now
**For brewers:** a place to develop a deck's strategy. You name what the deck is trying to do. The sim finds what stops it, finds the best answers in all of Standard, tests each change against your previous version on the same games, and turns what it learns into a matchup book you use at the table.
**What it's not:** a meta-deck copier, a win-rate oracle, or a collection manager.

**Why this is also the right engine bet.** Code's 19–23 Oct measurements:
- **The sim can't rank the field.** The mean per-deck error is 11.6 points against real results, and the rank correlation with real deck rates is about zero after weeks of dial fitting. Proactive decks read high; sequencing decks read low.
- **What it can do reliably is compare two versions of the same deck on the same seeds.** Most of its bias cancels in the difference. Refining a strategy is exactly that comparison, so it puts the engine where it is trustworthy.
- **The absolute "57% vs the field" number moves out of the headline.**

## 2 · The objects
- **Deck** → **Strategy** (versioned) → **Lists** (versioned, each saved under a strategy version) → **Tests** (paired comparisons) → **Book** (per-opponent plans).
- **Strategy:**
  - **summary** (2 sentences, the player's words)
  - **engine** (locked cards)
  - **win condition** (what "working" looks like, measurable)
  - **piloting rules** (structured; the sim's pilot follows them)
  - **obstacles** (what stops the win condition, each with its answers and how they're delivered)
  - **weak to**
- **Field:** each meta deck's share, how it wins, core cards, and which of your obstacles it presents. The field is the set of opponents, never the template.
- **Collection:** an input. It marks answers as owned and powers "owned only." It isn't a home tab.

## 3 · The screens
**Header:** deck picker `Squall ▾` · tabs **Strategy · Test · Book** · card search · Run · avatar (Account, Binder).
**State line:** strategy v3 · list v7 · tested vs Dimir +9 per 100 · in your sleeves.
**Coach column:** on every tab. It co-authors the strategy, explains, and proposes; nothing it proposes changes the deck without the Save sheet.
**Phone:** the bottom bar is Strategy · Test · Book · Table.

### Strategy (home)
1. **The strategy card.** Summary, engine, win condition, piloting rules, version history ("v2 → v3: you, 'my voltron needs to get through all obstacles'"). **Edit** opens it in your words. The coach redrafts and flags risks, then you save.
2. **Obstacles → answers.** One row per obstacle:
   - what it is and which field decks bring it (with their share)
   - your current answers
   - the best Standard answers (owned, price, fit)
   - how they're delivered (e.g. "Cloud fetches")
   - **Apply** (into the Save sheet) or **Test vs the deck that brings it**
3. **The list, grouped by role, not by type:** engine · enablers · answers · protection · card flow · mana. Each card shows owned, price, and how it performed in the last test. **Edit** works in place and ends on the Save sheet.
4. **The check, folded in.** Mana and curve findings show as small flags on the roles they affect, not as a separate "closest shell" card.

### Test
1. **Comparisons, newest first.** Each is "list v7 vs v6", the matchups tested, the change per 100 matches with its range, and a verdict (keep / inside the noise / worse). Each keep has **Keep v7**; each test has **Test another change**.
2. **Strategy stats per list.** From the win condition: for Squall, the turn the champion first attacks alone, survives the first removal, lifegain triggers a turn, equipment attached by turn 4.
3. **Why you lose, per matchup.** Each loss gets a tagged reason: engine never deployed · engine removed with no protection up · out-raced · swept · flooded or screwed · out of cards. Two worked examples per reason, each a one-line game summary.
4. **The field.** Matchups worst-first, with how each opponent beats your plan, and **Test a fix** on each. The whole-field number sits here, labelled as the sim's read with its range. It isn't the headline anywhere.
5. **Run.** Whole field or chosen opponents · games · G1 and post-board · time estimate. The queue and status live on the header line.

### Book
Per opponent:
- how they win
- what beats your plan
- your plan
- ins and outs
- what the tutor fetches (or your key choice)
- kill on sight
- what not to waste removal on

Built from the strategy, the tests and the field. It's editable, printable as a table card, and shareable. **The Table tab on the phone opens the entry for the opponent you pick.**

### Collection (secondary, from the avatar menu)
The binder, value, and "what you could build". A deck started from it lands on the Strategy tab with the coach's first draft.

### Retired or folded
- Brew-from screen → Collection.
- Suggestions → the obstacles table.
- "Closest shell" check → flags on roles.
- Sim tab → Test.
- Plan page → Book.
- Versions chooser → state line + Test.
- Results headline → Test's field section.

## 4 · The engine program (in order; each step has an acceptance check)
The golden test throughout is Justin's Squall voltron (the final 60 in WB-FF-THREAD.md) against Dimir Midrange and Mono-Green, the two matchups the thread said decide it.

**E0 · Read the strategy (added 23 Oct, Justin: "if I upload a random deck, how does it determine the deck's core function?").** Today nothing does; Squall's strategy was written by hand from the thread. E0 drafts strategy v1 for any uploaded deck in four layers, each checking the last:
1. **Read the cards.** Role table from `tags.js` (removal, protection, equipment, tutor, lifegain, draw, creatures by size, mana), the curve and the colours. Pure lookup, instant.
2. **Find the engine.** A link graph between cards. Payoff ↔ enabler: a lifegain payoff plus lifegain sources. Tutor ↔ targets: Cloud fetches equipment, and there are 9. Build-around text: "attacks alone", "whenever you gain life", "for each equipment". Weight by copies (4-ofs > 1-ofs) and by how many links a card has. The top 2–4 cards are the engine candidates.
3. **Hypothesis, then the sim checks it.**
   - **Shape.** Match it to an archetype: voltron, go-wide, aggro, control, combo, ramp, tempo. The closest meta deck is shown as a cousin, never a template.
   - **Telemetry.** Run about 300 games against the top 5 (E2). Record how games are won: the share of damage from the single biggest source, attackers per attack, kill turn, which cards were in play at the kill.
   - **Ablation.** Remove one engine candidate at a time and replay the same seeds (E1). The cards whose removal costs the most are the engine.
4. **Draft and ask.**
   - **Output.** The coach writes the summary (2 sentences), engine, win condition, piloting rules and first obstacles, each with a confidence level.
   - **Questions.** It asks at most two, only where the read splits (e.g., "Is Liliana removal or a finisher here?").
   - **Save.** The player edits in their own words and saves strategy v1.
- **Forge bias.** The stock pilot attacks with everything, so telemetry can misread voltron as go-wide. Until E4 passes its gate, card text and the player's words outweigh telemetry when they disagree, and the draft says which one it leaned on.
- **No coherent plan.** The answer says so: "No clear engine. Three half-plans: lifegain (9 cards), equipment (6), removal (11). Pick one and I'll show what supports it." It never invents a strategy.
- **Cost.** Layers 1–2 are free and instant. Layer 3 is one background run, about 10 min, shown as "checking how it wins…". The draft appears without it and updates when it lands.
- *Accept:*
  - **Squall, cold.** Given the 60 with no context, E0 names Squall, Aerith and Cloud as the engine, reads "voltron/toolbox", and its win condition matches the thread's "one champion connects alone by turn 5".
  - **Meta lists.** Three meta lists (Dimir, Mono-Green, Azorius) come back as their known archetypes.
  - **Random pile.** A shuffled 60 of random W/B cards gets the "no clear engine" answer.

**E1 · Paired targeted runs (the measuring stick).**
- A run against chosen opponents only, reusing the base run's seeds per opponent, with G1 and post-board reported separately.
- It stops early when the difference is clear either way (SPRT on the paired difference) and reports per 100 matches with a 95% range.
- *Accept:* two identical lists come out inside the noise in 95% of repeats. A known-bad change (−4 Erode +4 basic lands) shows clearly worse against Mono-Green within one run of 200 games or fewer.

**E2 · Strategy telemetry.**
- From the game logs, per game: when the engine cards were cast, the first solo attack, attachments, removal aimed at engine cards and whether protection answered it, lifegain events, and tutor choices.
- A generic extractor, configured by `strategy.engine`, `strategy.winCondition` and `strategy.piloting`. The log tools already parse turns, casts and targets.
- *Accept:* Squall's three stats come out per list and per matchup, and a hand check of 10 games agrees.

**E3 · Loss reasons.**
- A classifier over each lost game with six reasons (above), driven by telemetry plus life totals and board states by turn.
- *Accept:* on 30 hand-labelled Squall losses, at least 80% match.

**E4 · The strategy-aware pilot.** The brew's seat plays by its piloting rules. In the bridge pilot (forge-pilot/bridge), for the seat that owns a strategy:
- **attackAlone:** a designated champion set; others attack only when lethal or when the champion can't.
- **holdProtection:** keep N mana and a protection card up while the champion is equipped or enchanted.
- **tutorPolicy:** the tutor picks by the opponent's deck from the strategy's table.
- **equipPriority:** what to attach first, to whom.

These rules ride on the existing profile/policy machinery (`policies.json`).
*Accept:*
- **Mirror gate:** the strategy pilot beats the stock pilot with the same 60 by 55% or more on fixed seeds.
- **Telemetry shows the plan is actually played:** the champion attacks alone on 80%+ of its attacks.
- The thread's caveat ("Forge attacks with everything and spends protection early") is measurably gone.

**E5 · Obstacle search and rules verification.**
- **Search:** candidates for an obstacle come from `cards.js` and `tags.js`, filtered by colour identity and legality. Each is scored for fit to the strategy: does it solve the obstacle; does it share tags with the engine; is it delivered by the deck's route (equipment for a tutor deck); its mana slot.
- **Verification:** every claim the coach or the table makes about a card's ability (flying, lifelink, hexproof, trample…) is checked against Oracle text before it's shown. The thread caught Sheltered by Ghosts this way, by hand.
- *Accept:* for Squall's six obstacles, the thread's picks (Basilisk Collar, Orcrist, My Precious, Medic's Kitesail, Buster Sword, Enlightened Confidant) rank in the top 3 of their row. Zero unverified keyword claims ship.

**E6 · The field model.**
- Per field deck: core cards (in 4 of its last 5 lists at 3+ copies), how it wins (its plan from `plan.js`), and which obstacles it presents to a given strategy (its removal count, sweepers, fliers, speed, from tags).
- Weekly with the field pull.
- *Accept:* the obstacle rows on Squall name the decks the thread named (Dimir for removal, Mono-Green and Jund for big blockers, control for wipes).

**E7 · Sideboard and Book from tests.**
- Per opponent: candidate ins come from E5 against that deck's obstacles. Each in/out set is tested G2–3 only (E1). The best set writes the Book entry; the tutor table comes from the strategy.
- *Accept:* Squall's Book reproduces the thread's ins/outs table within two cards per matchup, and each entry carries its tested change.

**Stop or slow:** the nightly per-style dial fitting against absolute real rates. Keep the nightly measurement as a health check, but stop tuning toward it. Engine time goes to E1–E4.

## 5 · Order of work
1. E1 (paired targeted runs) and the Test tab's comparison card: the measuring stick comes first.
2. Strategy object + the Strategy tab's strategy card (coach draft, player edit, versions) + the role-grouped list. E0 layers 1, 2 and 4 ship here (the first-run "what your deck is doing" screen). Layer 3 follows once E1 and E2 exist.
3. E2 + E3 → Test's strategy stats and loss reasons.
4. E5 + E6 → the obstacles table with Apply / Test.
5. E4 (the pilot plays the strategy). Re-run the golden test and compare before and after.
6. E7 + Book + Table lookup.
7. Retire the folded screens (§3) once their replacements are live; Collection moves under the avatar.

Already built and kept: the state line, Save sheet, versions, queue persistence, Archidekt import, prices and buy links, the coach column and its card tools, Table, the field pull and real data.

## Affiliate links: never on the owner's own purchases
TCGplayer's partner guidelines: "Affiliate links are not for personal use." Self-referral risks the affiliate status. Rule: when the signed-in account is the site owner (or an admin), every shop link and cart link is built **without** `TCG_AFFILIATE` / `CK_PARTNER`. Same links, no code. Test: signed in as bluenocturne, no rendered href contains the affiliate or partner parameter.

## 6 · What Justin decides
- **Tab names:** Strategy · Test · Book (proposed), or Deck · Test · Book.
- **Whether the whole-field number appears at all** for a brew, or only per-matchup paired results. The proposal keeps it in Test, labelled as the sim's read.
