# Note to Code (14 Oct 2026, from Research + Design): change 10, "Your play with this deck"

Item A of RESEARCH-APP-VALUE-14OCT.md: the pilot statistics, run on the player's own Arena games, shown beside the pilot targets. Built end to end against Justin's three 13 Oct games; what remains is yours and is small.

## The tool: `design/incoming/tools/log-leaks.js`
`node tools/log-leaks.js <logs dir> [--seat player] [--json out.json]`. Reads the sim's log format (your `arena.js` output, or any Forge log) for one seat and writes `{ games, wins, turns, stats: { unspentOwn, unspentOpp, heldUsed, threatsAnswered, openBoardAttacked, lethalTaken, earlyInstants, keeps7 }, moments: [{ match, game, turn, kind, text }] }`. Each stat is `{ value, n, unit }`; n = 0 means the log did not carry what it needs, and the page shows "not measured yet". Moments are the turns behind the numbers ("held Restoration Magic through the opponent's turn with 4 mana open and cast nothing", "2 mana unspent with Squall castable", "lethal on board and the attack was skipped").

On the three Arena games (`design/arena-games/`, parsed offline with `design/arena-run-offline.js` because Scryfall is unreachable from my shell; your parser's numbers for unspent mana and held instants match): own-turn unspent 0.9, held instant used 11% of 9, threats answered 33% of 3, early instants 0% of 5, kept seven 2 of 3.

## The page (`design/incoming/Brewer-v4.dc.html`, `patches/patch_v4_leaks.py`, after `patch_v4_logmatch.py`)
Under the "in your own games" row and the log-match panel: "Your play with this deck · 3 games, 3 won · 21 of your turns · graded the way the sim grades its own pilots", then tiles (value in `--win` / `--amber` / `--loss` against the pilot target, "a strong pilot: over 50% · from 9 cases"; "— not measured yet" with n = 0), then "The turns behind the numbers", first 12 moments with match and turn. Reads `brew.real.leaks` in the tool's shape. Targets live on the page (own-turn unspent ≤ 1.0; held-and-used ≥ 50%; threats answered ≥ 70%; open-board attack ≥ 95%; lethal 100%; early instants ≤ 5%; keeps shown without a target). The opponent-turn unspent-mana tile was dropped: for a tap-out deck it is not a leak.

## What I need from you
1. Run `log-leaks.js` after `arena-log.js` (and after each watcher copy) and store the output as `brew.real.leaks`, pooled over the brew's matches; the Results tab then shows it. Match ids can be shortened to 8 characters on the brew (the page prints 4).
2. The Arena parser is missing what three of the tiles need: **attack and block records** (`DeclareAttackersReq` and the reply give attackers; `untappedDefenders` from the opponent's untapped creatures at that moment; blocks from `DeclareBlockersReq`), **the step inside a phase** on `turn` / `cast` records (Arena's `turnInfo.step`: `Step_Upkeep`, `Step_Draw`, `Step_End` … the tools already read those names), and **`stack` size on casts** (the pending stack count in the GRE message), so "in response" can be told from unprovoked. With those, `log-attacks.js` and `log-spells.js` also run unchanged on human games, which is the human baseline the pilot targets were missing.
3. Opponent names never reach the brew: `moments` carry match ids only. Keep it that way.

The same statistics, run per deck across *all* users' uploaded logs, are the human baseline for the pilot targets (SIM-PRINCIPLES: real play is the reference). Worth a `realdata`-style pooled table once there are more than a few hundred human turns.
