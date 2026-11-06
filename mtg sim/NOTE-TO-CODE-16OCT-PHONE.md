# Note to Code: change 18, the phone app (16 Oct)

From Research + Design. Justin approved the phone plan in `design/DESIGN-MOBILE-FUNCTIONAL-15OCT.md`: an installable web app first, no store; the Table tab (life counter that logs the match) in v1; "between rounds" push stays an opt-in; iPad Arena players log by hand.

Patch: `design/incoming/patches/patch_v4_table.py`, after change 17 (order: voice, change15, polish, motion, table). Idempotent, marker `data-change18`. Tested on the canvas fixtures: the whole flow pick → play → done → logged, and every screen at 390px.

## What the patch draws
1. **Bottom tab bar** under 900px: Decks · Coach · Results · Table. Decks opens the slide-over from change 16. The old top tabs hide on phones; on desktop, "Table" is a fourth tab (useful on an iPad).
2. **Table tab**, three states:
   - **Pick:** the run's opponents as tiles (name, your win %, beatdown/control from the guide), "Unknown deck", play/draw for G1, "Start the match".
   - **Play:** a card with this matchup's sideboard line (`−2 Restoration Magic, 1 Basilisk Collar · +3 Duress`) and the role; tap it for the coach's matchup plan. Two life totals with −5/−1/+1/+5. "Kept 7/6/5" per game. A game ends at 0 life (or "Won G1" / "Lost G1"); the next game flips play/draw. The match ends at two wins or three games. Landscape puts the totals face to face, the opponent's rotated.
   - **Done:** "Won 2–1 vs Izzet Spellementals · G1 won on the play, kept 7 · …", then **Log the match**, "Edit before logging" (opens the change-9 pills on Results), or discard.
   - Logging goes through the existing `POST /api/brews/:id/real` with the existing fields plus `games: [{won, onPlay, mull}]` and `mulls: [7, 6, 7]`. `source` is `'Paper'`.
3. **Account › "On your phone":** Add to Home Screen (uses `beforeinstallprompt` on Android; on iPhone it shows the Share → Add to Home Screen hint) and "Turn on notifications".
4. The deck header hides on the Table tab under 900px, so the counter gets the screen.

## Server work
1. **`/api/brews/:id/real`:** accept and store `games` and `mulls` (optional; the change-9 form sends neither). They feed the mulligan statistics later.
2. **Manifest** at `/manifest.webmanifest`: name "Deck Bench", short_name "Deck Bench", `display: standalone`, `background_color` and `theme_color` `#0C0C0B`, icons 192 and 512 (the green diamond on `#0C0C0B`; Design will supply PNGs if you want them, or draw it with the clip-path polygon). Link it from `index.html` with `<link rel="manifest">` and `<meta name="apple-mobile-web-app-capable" content="yes">`, `apple-mobile-web-app-status-bar-style: black-translucent`, and an `apple-touch-icon`.
3. **Service worker** at `/sw.js`: cache the shell (index.html, fonts, mana CSS) and the last three decks' `/api/brews` + guide responses, network-first with cache fallback. Queue `POST …/real` in IndexedDB when offline and replay on `online` (Background Sync where available). Register it from the page.
4. **Web push:** `GET /api/push/key` → `{key}` (VAPID public key); `POST /api/push/subscribe` with the PushSubscription JSON, stored per account; `web-push` on the server. Send on: run finished (if `mail.runDone` or the push toggle), weekly moved (digest), coach answered, and "between rounds" (opt-in, only after a logged match when the coach has a note). Payload: `{title, body, url}` with the `?deck=&tab=` deep link; the SW opens it on click.
5. **Toggles:** `account.mail` gains `push: {runDone, digest, coach, rounds}`; the Account screen's switches should drive these too (Design will add the four switches once the shape exists; today's two mail switches stand in).

## Not in scope
A deck tracker (impossible on iOS, see the field test), a scanner, deck editing on the phone beyond what the Deck tab already does.
