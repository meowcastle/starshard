# Coach parameters, and the Standard legality check (13 Oct 2026)

For Code, from Research, with Justin's ask. Two parts: what a user can tell the coach so its advice fits them, and a hard rule that a Standard list cannot carry a card that is not Standard-legal. The coach's grounding (numbers from the page only, ranges read, fidelity stated) stays exactly as `coach.js` has it; nothing here loosens that.

## Part 1 · Coach parameters

Today the user's only input is the free-text notes box, which the prompt respects but cannot structure. Replace it with a small settings object on the brew, shown on the Deck tab as one row of facts the user can edit (Design will draw it), and passed to the coach as a labelled block in `context()`.

### 1. Goal

| Field | Values | What it changes |
| --- | --- | --- |
| `goal.event` | `rcq` (default), `store`, `arena-bo3`, `arena-bo1`, `fnm`, `none` | Rounds for the top-8 math (RCQ 6–7, store 4–5, FNM 3–4; Arena ladder has no top 8, so the headline is match win rate and the levers are "points of win rate" instead); whether sideboarding counts (Bo1: game 1 only, the sideboard section hides); the field snapshot (Arena vs paper, once the population question is settled) |
| `goal.date` | date or none | "Ready by" in the coach's words; the run target picks the field snapshot nearest the date |
| `goal.rounds` | override | For the people who know their event |
| `goal.posture` | `consistent` (default) / `ceiling` | Consistent: prefer changes that raise the floor (mana, curve, the worst matchup). Ceiling: accept variance for a higher top-8 chance (the big-matchup swing, the engine) |

### 2. Constraints

| Field | Values | What it changes |
| --- | --- | --- |
| `keep` | card names | Never suggested out; the coach says so when a fix would need one of them |
| `never` | card names | Never suggested in |
| `budget` | `any` (default), `wildcards: {rare: n, mythic: n}`, `paper: $n` | Swaps limited to what the budget allows; the coach says the cost of each suggestion |
| `collection` | an Arena collection export (the `.csv` the client produces) or none | Suggestions only from cards owned, plus a "would need N wildcards" line on the rest. The per-card `arena` flag already exists; this adds ownership |
| `level` | `learning`, `competitive` (default), `grinder` | Depth of explanation: learning gets the why spelled out and the role per matchup; grinder gets the numbers and the swap |

### 3. Mode

The readout answers one question (what costs you the most). Each mode is a prompt variant with its own output shape, chosen from a segmented control above the composer; readout stays the default and runs automatically after each run. The others run on request.

| Mode | Asks the coach for | Output shape |
| --- | --- | --- |
| `readout` (default) | the weakness, why, 2–3 testable fixes ranked by top-8 value | as today |
| `sideboard` | a sideboard guide per matchup from `plans` (in, out, why, the role after boarding) | one row per opponent, the plan editable in place (the Sideboard plans section already exists; this fills it with reasons) |
| `mulligan` | keep/ship rules for this list by matchup class, with example hands | a short table: hand shape → keep or ship → why |
| `pilot` | how to play one matchup: who is the beatdown (Flores' check, per the posture profiles), what to hold, what to answer on sight, what to play around, when to switch role | prose, one matchup at a time, from the opponent row's "how to play it" link |
| `mana` | land count, colour sources (Karsten, already computed), curve against the plan's shape, MDFCs | the functional check's findings in the coach's words with the fix |
| `review` | the whole version history: what each change did (from Compare), what to try next | prose; needs two or more versions |

### 4. Evidence grade on every suggestion

Add `evidence: 'strong' | 'weak' | 'untested'` to each option in the readout schema, with a one-line `basis` ("Azorius 3–17 over 20 games, range 8–32%"). Strong: the matchup's range sits on one side of 50% and the lever is worth 1+ points. Weak: inside the noise. Untested: from the coach's own knowledge, not these games. The page hatches weak and untested options the way it hatches thin matchups (SIM-PRINCIPLES.md, rule 2), and "Test it" is the primary action only on strong ones.

### 5. The suggestions ledger

The coach is not told how its earlier suggestions turned out. Add to `context()` a block built from `run.coach.options` across the brew's runs: for each option with a `test`, the version it became, before and after headline, and whether the difference was outside the noise (Compare's 6-games-in-20 rule). "Suggested −2 X +2 Y as v3: 52% → 55%, inside the noise." The prompt gains one sentence: do not re-suggest a change that was tested and did not help; build on the ones that did.

### 6. The user's own games

When `SIM_GAME_LOG=all` is on (or once the bridge overhead is profiled and it is on by default), the six statistics for the brew's own runs go into `context()` as one short block: unspent mana, held instants used, chump share, lead changes. The coach can then say "in your games the deck held three mana open on 40% of turns" rather than reasoning from the field. Until then, nothing; never let it guess at behaviour it has not seen.

### 7. Visible limits

`usage.js` already counts asks per day. Show the remaining count where the composer placeholder already shows it under 5, from the first ask, and make the daily limit a per-user setting an admin can change rather than a constant.

**Effort.** 1 (settings object, prompt block, the facts row's strings): one day with Design drawing the row. 3 (modes): half a day per mode for prompt and schema; sideboard and pilot first. 4 and 5: half a day together. 6 waits on logging. 7: an hour.

## Part 2 · Standard legality on upload

Today `meta.formatOf()` infers the narrowest format every card is legal in, so a Standard list with one Pioneer card silently becomes a Pioneer brew (or "casual"), runs against the wrong field, and the page says "Pioneer legal" as if that were the intent. Justin's rule: **a Standard list rejects cards that are not Standard-legal.**

**Behaviour.**

1. The paste step gains a format choice, default Standard (the sim's formats: the Goldfish list in `/api/me`), remembered per user. The inferred format is shown as a hint ("every card here is Standard-legal" / "3 cards are not Standard-legal"), never silently adopted.
2. On "Create" with Standard chosen: every card is checked against Scryfall `legalities.standard` (already in the card cache, `KEEP` in `meta.js`). Any card that is `not_legal`, `banned` or unknown blocks creation. The error names the cards and, for each, the narrowest format it is legal in: "Not Standard-legal: Llanowar Elves (Pioneer), Craterhoof Behemoth (Modern). Remove them, or create the brew as Pioneer." Unknown names (typos) stay the existing flagged rows but also block creation for Standard, since an unknown card cannot be shown legal.
3. The same check runs on a new version (paste a new list) and on "Test it" swaps (the coach's `in` cards are already filtered by `legalities[b.format] === 'legal'`; keep that, and make the coach's prompt say the format so it does not suggest a card that will be filtered).
4. **Rotation.** A stored Standard brew is re-checked when the calibration field refreshes (the reading is already redone then). A version that has become illegal is marked on the Versions row ("2 cards rotated out: …") and cannot be queued against the Standard field until a new version fixes it; its old results stay.
5. Restricted/banned: `banned` blocks; `restricted` is not a Standard state, ignore.
6. Commander and the other formats keep today's inference, with the same explicit choice offered; the hard rejection is a property of a chosen format, not of Standard only. Standard is the default because it is the sim's field.

**Where.** `server.js` create/version/test handlers call a new `meta.legalFor(list, format)` returning `{ ok, illegal: [{name, legalIn}], unknown: [names] }`; `describeDeck` passes the per-card legality through to the rows so the Deck tab can mark a card (`statusNote: 'not Standard-legal'`, in `--loss`, the same slot "unknown, skipped" uses). The paste step's format control and the error wording go to Design; Research will write the strings with the facts row.

**Acceptance.** Paste a Standard list with one Modern card and Standard chosen: creation refused, the card and its format named. The same list with Modern chosen: created as Modern. A stored Standard brew after a field refresh that rotates one of its cards: the Versions row says which card, the queue button is disabled with the reason, old results intact. `npm test` gains the three cases.
