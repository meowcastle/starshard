# Note to Code (13 Oct 2026, from Research): Justin's Arena log, and the parser it needs

`design/arena-2026-10-13.log` (git-ignored, 8.3 MB) is Arena's `Player.log` with Detailed Logs on, from Justin's first three ladder matches with Squall tonight. This is the human game record we said we did not have: how the deck does against real opponents, and how a person pilots it, in the same terms as our own game log.

## What is in it (read by hand tonight)

Three best-of-one Ladder matches, Justin (Arena name `blueassassin`) 3–0:

| Opponent | Seat | On the play | Turns | Result | Final life (me / them) |
| --- | --- | --- | --- | --- | --- |
| ToJikalo | 1 | them | 19 | win, concede | 25 / 3 |
| Sarcofago | 2 | them | 12 | win, concede | 38 / 2 |
| tmntgrove20 | 2 | them | 12 | win, timeout | 19 / 14 |

Message counts: 987 `GameStateMessage`, 16 `DeclareAttackersReq`, 0 `DeclareBlockersReq` (he was never asked to block, or Arena auto-handled), 3 `MulliganReq`, 31 `SelectTargetsReq`, 4,291 `ActionType_Cast` entries in available-actions lists (what he could cast, not what he cast), 719 `ActionType_Play`. 137 distinct `grpId` card ids.

## The parser (`tools/arena-log.js`), what to extract

1. **Matches**: `MatchGameRoomStateChangedEvent` → `matchId`, players with `systemSeatId`, `eventId` (Ladder / Constructed_Best_of_Three / …); the final `results` array with `MatchScope_Match`, `winningTeamId`, `reason`.
2. **Games and turns**: `GameStateMessage.gameStateMessage.turnInfo` (`turnNumber`, `activePlayer`, `phase`, `step`); `players[]` with `lifeTotal`, `systemSeatNumber`; `gameObjects[]` with `grpId`, `zoneId`, `ownerSeatId`, `visibility`; `zones[]` mapping zone ids to Hand / Battlefield / Library / Graveyard / Stack per seat. Our own log's `turn` record can be built from this almost field for field: board, each seat's view, life, lands untapped (tapped flag on objects), hand size.
3. **Decisions**: `ActionsAvailableReq` is the menu he was offered; the next `ClientToGreMessage` (`ClientToGreMessage` with `performActionReq`) is what he chose. That pair is the human equivalent of our pilot's "decision" record: did he pass with mana open, what did he cast, what did he hold. `DeclareAttackersReq` and the reply give attacks; `SelectTargetsReq` the targets.
4. **Card names**: `grpId` is Arena's id. Scryfall carries it as `arena_id`; add it to `KEEP` in `meta.js` and the cache maps ids to names on the next refresh. Until then the parser can carry ids.
5. **Opponent's deck**: cards the opponent revealed (cast, on the battlefield) are enough for `plan.js` to read the plan and name the nearest meta deck, which is how the match gets an archetype label for calibration. The `courseId` field (`Avatar_Basic_…`) is the player's avatar, not the deck; ignore it.

## What it feeds

- **Real results for the brew**: match outcome, opponent archetype, on play/draw → a `realGames` list on the brew, shown on the Results tab beside Forge's number ("in your own games: 3–0, 3 matches") and, once there are 30+, a calibration bias for the brew itself rather than its nearest meta cousin.
- **The six statistics for a human seat**: unspent mana after the opponent's turn, held instants used, chumps, lead changes (using our evaluator's score, not Forge's, on the reconstructed board) → the first human baseline for the pilot targets, from the player whose deck it is.
- **The Arena population**: the archetypes met on the ladder, by week, for the population question.

## Caveats

- Best-of-one: no sideboarding, and Arena's Bo1 hand smoothing means mulligan statistics are not comparable to paper.
- Arena rewrites `Player.log` on each launch; Justin copies it into `design/` after a session. A watcher that copies it on change would be better and is a five-line script in the Mac worker.
- Opponent names are visible in the log; anonymise them in anything that leaves the Mac (the sim's fixtures already do this for usernames).

Effort: the parser is about a day; the Results-tab line and the brew-level calibration half a day each once the parser exists.
