# Handoff to Code: 15–16 Oct (Research + Design)

Eleven patches are ready. Apply them in this order to `public/index.html`. Each one is idempotent and refuses to run without the one before it. Every anchor must match exactly once, so if the page has drifted, the patch stops and names the anchor that failed. Send me that name and I'll re-base the patch.

```
cd "mtg sim"
python3 design/incoming/patches/patch_v4_voice.py   public/index.html   # change 14
python3 design/incoming/patches/patch_v4_change15.py public/index.html  # change 15
python3 design/incoming/patches/patch_v4_polish.py  public/index.html   # change 16
python3 design/incoming/patches/patch_v4_motion.py  public/index.html   # change 17
python3 design/incoming/patches/patch_v4_table.py   public/index.html   # change 18 (16 Oct)
python3 design/incoming/patches/patch_v4_list.py    public/index.html   # change 19 (16 Oct)
python3 design/incoming/patches/patch_v4_craft.py   public/index.html   # change 20 (16 Oct)
python3 design/incoming/patches/patch_v4_paper.py   public/index.html   # change 21 (16 Oct)
python3 design/incoming/patches/patch_v4_brewfrom.py public/index.html  # change 22 (16 Oct)
python3 design/incoming/patches/patch_v4_buylinks.py public/index.html  # change 23 (16 Oct)
python3 design/incoming/patches/patch_v4_check.py    public/index.html  # change 24 (16 Oct)
```

All of them are drawn and tested on the canvas boards (project/Brewer-v4.dc.html, project/Guide.dc.html), with the fixtures at 1440px and 390px.

## What each one is (details in the matching note)
| # | Patch | Note | Server work |
|---|---|---|---|
| 14 | voice + relative headline | NOTE-TO-CODE-15OCT-VOICE.md | none. Uses `run.relative` / `summary.relative` (shipped). Guide.dc.html copy and headline changes are in the canvas template |
| 15 | email-code sign-in, account email + mail toggles, weekly badge, Guide ↗, `?deck=&tab=&ask=&opponent=` | NOTE-TO-CODE-15OCT-CHANGE15.md | **yes, see below** |
| 16 | phone/iPad layout, stat row, fit fixes | NOTE-TO-CODE-15OCT-POLISH.md | none |
| 17 | motion system | NOTE-TO-CODE-15OCT-MOTION.md | none |
| 18 | phone shell, Table tab (life counter that logs the match), install + push | NOTE-TO-CODE-16OCT-PHONE.md | **yes**: manifest, service worker, web push, `games`/`mulls` on log-a-match |
| 19 | list by type, buy links, sign-up closed copy | NOTE-TO-CODE-16OCT-LIST.md | `rows[].type`, `GET /api/public` |
| 21 | paper first: paper defaults everywhere, Arena labelled as the learning source | (this file, below) | none |
| 22 | the Cards dial (owned only / up to $X / anything) on the coach, the paper collection paste box on Account, "Brew from your collection" | NOTE-TO-CODE-16OCT-BREWFROM.md | **yes**: `/api/collection/paper`, `/api/collection/brews` + start, coach and swap test read the collection |
| 23 | a TCGplayer link on every buyable card: missing cards, craft table, brew-from and field "to finish" | NOTE-TO-CODE-16OCT-BUYLINKS.md | optional `rows[].buy` (Scryfall purchase link), `missing[]` on brew/field rows |
| 24 | **the brew check + Optimize my brew**: curve and mix vs the closest shell, findings with fixes, one button that chains structure → owned swaps → run → matchup fixes. The front door for the main job | NOTE-TO-CODE-16OCT-CHECK.md | **yes**: `ver.check` from Codex norms, `POST /api/brews/:id/optimize`, binder-format paste |
| 20 | collection and craft: what you own, the wildcard bill, each substitute priced by the sim, the field by what you can build | NOTE-TO-CODE-16OCT-CRAFT.md | **yes**: `/api/collection` from the Arena log, `rows[].rarity`, `brew.craft` from the swap SPRT, `/api/field/craft` |

## Change 25: paper only (16 Oct evening)
`patch_v4_paperonly.py`, after check. Arena leaves the product surface: no shelves, no wildcards, no "Arena (practice)"; with no collection pasted, the Deck tab shows one line and a "Paste my collection" action instead of Arena data. Dry-run clean on the live page after your 7a6e8a7 + the eleven.

## Change 29: the coach's ask bar (16 Oct, phone bug)
`patch_v4_askbar.py`, after change 25 (independent of 26–28). Justin's phone screenshot: the thread showed through the ask block's fade, the block stacked pills + input + three questions, and sat behind the bottom bar. Now opaque with a top rule, pills in one sideways-scrolling row on phones, suggested questions only before the first exchange, bar above the bottom bar. Apply it with the eleven + paperonly; it's a one-command fix.

## Distill (16 Oct, after v5)
`DECK-BENCH-DISTILL.md` at the root: scorecard, vocabulary law with a grep rule, copy budget, cut lists with quoted strings, one-owner table, safety gaps first, execution order (changes 26–28, then v5). Re-grep every quoted string before editing; the line numbers are from the canvas board. The visual is the "ux-distill" board on the canvas.

## v5: Deck · Collection · Sim (design overhaul, revised)
`design/DESIGN-V5-JOURNEY-16OCT.md` and the "v5 · Deck · Collection · Sim" board on the canvas. Three tabs for one deck (picked in the header), the coach as a docked column that reads the current tab, Collection as its own tab with a stat row, a worth-sorted missing table and "what you could build". The doc has the fold table and the build list.

## Change 21: paper first
The sim is a paper tool. Arena is where it learns how a person plays (the log on the Mac feeds calibration and "your play"), not where the deck lives. The patch turns every Arena-first default round: log-a-match defaults to Paper (sources Paper · Arena Bo3 · Arena Bo1), the collection opens on the paper shelf with Arena labelled "Arena (learning)", the facts line reads "Paper · Arena can't teach 1 card of it", paste help leads with plain text and Moxfield. Server side: `source` defaults to `'Paper'` wherever it defaults; the coach prompt should assume paper Bo3 unless the run says otherwise.

## Server work (change 15 + mail)
1. `mail.js` over Resend REST, per NOTE-TO-CODE-14OCT-EMAIL.md.
   - Domain `sim.starshard.net` is **verified** in Resend (14 Oct). Open/click tracking is off.
   - Justin puts `RESEND_API_KEY` in the NAS `.env` himself.
2. `POST /api/auth/code {email, purpose?}`: six-digit code, 10-minute expiry, 5 tries, 3 per address per hour, 20 per IP.
3. `POST /api/auth/verify {email, code}`: issues a session cookie.
4. `POST /api/account/email {email, code}`: changes the address and returns the account.
5. `GET /api/account` adds `email`, `mailable`, `mail:{digest, runDone}`. `PATCH /api/account {mail:{…}}` returns the account.
6. `brew.weekly.seen`, plus `PATCH /api/brews/:id {weeklySeen:true}`. Reset `seen` on each new weekly rerun.
7. Bounce/complaint webhook sets `mailable=false`.

Until these exist, the page degrades quietly: no email shows "add one", no weekly shows nothing.

## Also
- **Coach prompt and server brief:** add the five voice rules from `design/VOICE-AND-LEXICON-15OCT.md`. There's a before/after example at the bottom of that file.
- **Fan Content Policy** (checked 15 Oct, see the project doc `sim-checks-15oct.md`):
  - Add the exact notice to the page footer and to every email: "Deck Bench is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC."
  - Keep the Codex pages and shared guides viewable without signing in.
  - Stripe stays off until Justin has a lawyer's read.

## Engine queue (unchanged, still the critical path)
- Excruciator combo profile (NOTE-TO-CODE-15OCT-EXCRUCIATOR-LINE.md).
- Pilot-error dial at every priority, plus combat.
- Knobs plus the optimiser.
- A fresh baseline at 160 games per pairing, so Research can score it against the ship bar.

## Waiting on Justin
- Social layer: own circle first, or strangers?
- Add rank correlation ≥ 0.7 to the ship bar?
