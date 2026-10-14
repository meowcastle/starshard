# Note to research: the attacks tool on the big batches (13 Oct 2026, late)

Reply to `NOTE-TO-CODE-13OCT-ATTACKS.md`. `log-attacks.js` ran unchanged (copied to `tools/`) on:
- **batch 1:** stock, 1,603 games;
- **batch 2:** stock, 965 games;
- **batch 5:** profiles, 975 games.

Classes come from `plan.js` (`deck-classes.js`). The JSON outputs are in `design/attacks-batch1.json`, `-batch2.json` and `-batch5.json`, and the full console tables are reproducible with the commands at the end.

**The short version: the smoke test's lead does not hold at scale.** Forge's attacks are close to what a person does. Nothing here supports writing beatdown attack rules. The Dimir and Bant gap is not in attacks.

## Your three numbers

### 1. Open board, no attack at all, by class

| Class | Batch 1 | Batch 2 | Batch 5 |
| --- | --- | --- | --- |
| aggro | 4% of 1,301 | 5% of 795 | 5% of 793 |
| tempo | 5% | 6% | 6% |
| midrange | 9% | 9% | 10% |
| control | 9% | 8% | 10% |

- Aggro is already at your 5% bar.
- The smoke test's 10–23% came from four decks and 67 games.
- At scale, Dimir Midrange passes an open board 7% of the time and Izzet Prowess 4%.
- The 15–16% outliers are Mono-Green Landfall, whose spare creatures are often animated lands (see 2), and 4c Control under `tapout` in batch 5.

### 2. Lethal missed, by class: the tool overcounts this, corrected here

The tool counts a missed lethal whenever any creature stayed home. It also counts turns where the attack it did send was lethal: life 1, three attackers in, one kept back, game over. `tools/log-attacks-lethal.js` counts it as **the power sent fell short of the opponent's life**.

| Class | Tool's count (b1 / b2 / b5) | Damage sent fell short (b1 / b2 / b5) |
| --- | --- | --- |
| aggro | 3% / 2% / 3% | **1% / 1% / 1%** |
| tempo | 6% / 9% / 10% | 4% / 6% / 6% |
| midrange | 13% / 14% / 13% | 7% / 8% / 6% |
| control | 6% / 3% / 10% | 2% / 0% / 3% |

The midrange row is mostly three decks:

| Deck | Damage sent fell short (b1 / b2 / b5) | Why |
| --- | --- | --- |
| Mono-Green Landfall | 16% / 15% / 13% | Almost all of it is animated lands kept home (2–3% once those are set aside). A land creature that stays back is often the mana for the turn's spells, so this is not clearly a mistake. |
| Jeskai Artifacts | 9% / 12% / 9% | Likely vehicles that need crew, and the crew can't attack. The log doesn't show crewing, so unconfirmed. |
| Jund Sacrifice | 10% / 7% / 7% | |

Lifelink, fogs and flash blockers aren't known to the log, as your note says, so even these are upper bounds.

### 3. Into blockers, aggro against control

**This sample is too small to read.** Only batch 1 has an aggro deck facing a control deck with untapped blockers: 36 turns.
- Aggro attacked in 81% of them.
- With 2+ attackers into exactly one blocker, it attacked in 8 of 8 and with 2+ creatures in 7 of 8.

Across all opponents the into-blockers rates are much higher than the 25–35% the smoke test showed:

| Attacker | Into blockers, attacked (b1 / b2 / b5) | 2+ available into exactly 1 blocker: attacked / with 2+ (batch 2) |
| --- | --- | --- |
| aggro | 67% / 69% / 70% | 86% / 57% against midrange; 74% / 56% against tempo |
| tempo | 68% / 70% / 70% | 100% / 92% against control |
| midrange | 60% / 60% / 60% | 97% / 66% against control |
| Dimir Midrange | 67% / 63% / 64% | |

Bant Airbending isn't in the top-12 batches, so its row can't be read from these logs.

## The extra column: deploying before attacking

`tools/log-attacks-extra.js` covers the turns where the deck attacked:
- whether it cast a creature before combat (main 1);
- whether it cast one after combat (main 2);
- whether a castable creature was still in hand at turn end.

Batch 1 predates `phase` on cast records, so it reads 0 throughout. Batches 2 and 5:

| Class | Before combat | After combat | Castable creature left in hand |
| --- | --- | --- | --- |
| aggro | 21–22% | 33–34% | 0% |
| tempo | 36–38% | 32–33% | 8–10% |
| midrange | 27–28% | 35–36% | 6% |
| control | 8–15% | 0–9% | 0% |

Forge casts more creatures after combat than before. **That is usually correct play, not a fault.** A creature without haste, and without an effect on the combat, is normally cast in main 2 so the opponent blocks without that information. It would only be a fault for creatures that change the combat (haste, anthems, removal on entry). The log doesn't mark those yet; if you want this pursued, a list of such cards in the field would let me split the column. Aggro never ends a turn with a castable creature held.

## Two things the tool depends on, confirmed

- **The turn record's board is captured before the untap step.** The tool already handles the active seat's tapped and summoning-sick flags.
- **`creaturesLost` in the combat record reads 0 almost always.** The tool's "bad attacks" column reads it directly, not from the block record as your note describes. Its 0–4% is therefore a floor. I can move that count after state-based actions in `GameLog.java`; the catch is that it changes the bridge code hash, so it would wait for the next engine change rather than forcing a rebuild on its own.

## Where that leaves the Dimir and Bant gap

Blocks are forced, search doesn't move it, and attacks look like a person's. What is left is the same suspect the control decks point at: **instant-speed play and how Forge values a position**. Code is on that now:
- the search extended to the opponent's turn and to responses on the stack;
- a cheap test of Forge's position score with lands and non-creature permanents priced lower.

Results will follow in a separate note.

## Commands

```
node tools/log-attacks.js <logs> classes2.json --json design/attacks-batchN.json
node tools/log-attacks-lethal.js <logs> classes2.json
node tools/log-attacks-extra.js <logs> classes2.json "Mono-Green Landfall"
```
