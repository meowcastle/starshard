# Handoff: Design, 24 August 2026

Real PvP shipped for Manzil this session, plus a bot fallback for when no
one else is at the table. **No markup changed anywhere in this handoff** —
everything below rides the existing `.dc.html` and its own copy, verbatim.
This doc is a receipt, not a request, except where §4 flags an open
question.

---

## 0. The one-line summary

The old "find a battle" was fake: a `setTimeout` chain, a hardcoded roster
of six names, and the local single-player bot secretly playing both sides.
It's now real matchmaking against a live server, with a proper fallback —
not "the sky" herself, a separate weaker stand-in — when no one's free.

## 1. The rules engine had to be made seat-symmetric first

Report: none written up separately: the fix is the conformance-vector
change itself, `research/manzil-engine-v6.js`.

About a third of the 28 signatures were hardcoded to only work for
whichever seat is literally called `"you"` — the bearer, the ghost, the
heart, the void, the veil, the chamber, the blaze, the return, the
turning, the listener, the glance, and the gate's lead-seizing check all
silently did nothing (or the wrong thing) for the other seat. Invisible in
every existing mode, because "you" is always the human and "sky" is
always the AI or a name-only stand-in — but fatal for two real people
playing full leveled decks against each other, since either one could
land in the "wrong" seat.

Fixed, all owner-relative now. **51 of 51 conformance vectors pass** (37
original + 14 new, mirroring every changed ability from the other seat).
Nothing about the client's own single-device `_faceOf`/`_lodge`/`_resolve`
changed — those stay exactly as they were for practice/road/night modes,
on purpose.

## 2. Real matchmaking replaces the fake roster

New: `starshard-api/lib/manzil-lobby.js` (Socket.io), wired into
`starshard-api/server.js`. Guest identity is a signed token, no account
required, matching Manzil's no-login ethos. Moves are validated
server-side against the now-fixed engine — a client never resolves its
own or an opponent's flip; it just replays what the server says happened.

**Every screen this uses already existed.** "the open tables" screen's
three states (idle → seeking → found) are the same ones Design shipped;
`foundName`/`foundLine` now carry a real opponent's name instead of a
random pick from the hardcoded six. The screen's own copy — *"battles are
random: a free hand under the same sky, found for you. when no one is
free, the sky pilots a signed hand herself"* — was already describing
exactly the fallback in §3, unbuilt until now.

## 3. Queue-timeout bot fallback (~25 seconds)

If no real opponent is found within about 25 seconds, the client cancels
the real queue and falls back into a local duel automatically, using the
same "found" visual (no new screen, same transition beat).

**The fallback bot is not the sky.** She's the road's actual endgame boss
(full planet hand, two-ply lookahead) and deliberately stays reserved for
that. The fallback reuses the old roster's flavor names instead — vess,
koda, amara, jun, petra, noor — picked at random, purely cosmetic (name +
one line, `foundLine`).

**Her hand now scales with the player.** Rather than a fixed five, her
pack is built fresh each duel to match the player's own current
signature-awake vs. asleep split — if you're carrying 5 awake cards and 7
asleep ones, she gets the same 5-and-7 mix, drawn from mansions outside
your own pack where enough exist. As you level more of your own twelve,
she keeps pace automatically; nothing about her needs re-tuning as the
game's own leveling data changes.

## 4. Open, yours if you want it

Nothing new needs building — this whole feature rode existing screens and
existing copy. Two things worth a look if you want them:

- The found-stage flavor lines (`foundLine`) were written for the old
  fake roster names; they read fine for the bot fallback too, but they've
  never been reviewed with "this might be a bot standing in for a
  real player" in mind.
- The fallback is currently silent about *why* it happened — a player who
  waits it out sees the exact same "the table is dealt…" beat as a real
  match, no distinction drawn. That's deliberate (per the lobby's own
  copy, the sky "piloting a signed hand" is framed as ordinary, not a
  consolation prize) but flag it if that read feels wrong once it's
  played a few times.

## 5. Where it lands

- `Star Shard v3 Build Plan/Manzil - The Empty District.dc.html` —
  `_ensureSocket`/`_duelSeekTap`/`_botPack`/`_startBotDuel`/
  `_enterPvpBoard`/`_proposeMove`/`_commitPlaceRemote`, plus small guards
  added to `_commitPlace`, `_skyMove`, `_advanceRound`, `_shape` so the
  three modes (pass-and-play, bot, real PvP) each use the right path.
- `starshard-api/lib/manzil-lobby.js` (new), `manzil-engine.js` (new,
  synced copy of the research engine) — server side, not yours to touch.
- `socket-io-client.js` (new, vendored, not CDN-fetched) —
  `tools/vendor-socketio-client.mjs` regenerates it.

## 6. Verification receipts

- Engine: 51/51 conformance vectors, both before and after the copy sync
  into the server's `lib/`.
- Two real browser tabs, real guest identities, live on staging: genuine
  pairing (no hardcoded name), correctly mirrored hands, a live claim
  ("the root claims the ghost") rendering identically and in sync on both
  screens.
- Bot fallback, live in-browser: fired at the ~25s mark, played a full
  round including a multi-card tie-chain flip, survived into round 2
  (this caught and fixed a real bug — her round-2 hand was coming up
  empty before the fix), and her pack's awake/asleep counts matched the
  player's own pack exactly in a direct check.
- Deployed to `staging.starshard.net/manzil/` and to the NAS backend;
  confirmed live via direct requests against both, not just local
  testing.
