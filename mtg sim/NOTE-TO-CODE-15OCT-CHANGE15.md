# Note to Code: change 15, the four leftovers (15 Oct)

From Research + Design. Patch: `design/incoming/patches/patch_v4_change15.py`. Apply it after change 14 (`patch_v4_voice.py`); it refuses to run otherwise. It's idempotent (marker `data-change15`), and each anchor must match exactly once. I tested it against the canvas fixtures with every run × tab × view, plus the sign-in, account, weekly and link flows.

## A. Sign in with an email code
- On the sign-in screen, under the password form: "or" → **Email me a code** → email field → **Send code** → one code field (mono, paste-friendly, digits only). It submits on the sixth digit. "Resend" and "Different email" sit under it.
- Calls `POST /api/auth/code {email}` and `POST /api/auth/verify {email, code}`, both as in NOTE-TO-CODE-14OCT-EMAIL.md. On success it reads `/api/me` and loads as a password login does.
- Errors show in the existing sign-in note line, so show the server's error text as-is. Suggested wording: "Wrong code. 4 tries left.", "Code expired. Send a new one.", "Couldn't send the code. Try again in a minute."

## B. Account: email and mail toggles
New "Email" block above the delete section. It reads `account.email`, `account.mailable`, and `account.mail = {digest, runDone}`:
- **Address:** shown with "change" (or "add one" when there's no address).
  - Change flow: `POST /api/auth/code {email, purpose:'change'}`, then `POST /api/account/email {email, code}`. That returns the account, or `{ok}`.
  - When `mailable === false`: "bounced last time · check it".
- **Two toggles:** `PATCH /api/account {mail:{digest|runDone: bool}}`, which returns the account.
  - Weekly digest defaults on; run finished defaults off.
  - With no email, the toggles are dimmed, and tapping one opens "add one".

## C. Weekly badge
Reads `brew.weekly` (change 12 shape) plus a new `seen` flag:
- **Deck list:** a pill `52→47` (green up, red down). It shows when the deck moved 3+ points or any matchup moved 8+, and only until the owner opens that deck.
  - Opening the deck sends `PATCH /api/brews/:id {weeklySeen:true}`, which should set `weekly.seen = true`; reset it on the next rerun.
- **Results headline**, a line under it: `This week 52 → 47 · Izzet Spellementals up to 28% of the field, you 49→38 · sideboard guide updated`. This one stays visible after the pill clears.

## D. Guide link and incoming links
- **Deck header:** **Guide ↗** beside the Run button. It opens `/g/:brew/v:n` (the latest version) in a new tab and shows once the brew has a finished run.
- **The Brewer now reads `/?deck=&tab=&ask=&opponent=`**, which the guide's "ask the coach" links use:
  - It selects the deck and tab and rings the asked mode's pill.
  - `ask=pilot&opponent=X` opens the opponent picker on X.
  - Nothing is spent on arrival; the player still presses the button.
  - The query is cleared from the address bar after reading.

## Server bits this needs
- `/api/auth/code`, `/api/auth/verify`, `/api/account/email`
- `PATCH /api/account {mail}`
- `account.email/mailable/mail` in `GET /api/account`
- `weekly.seen` plus `PATCH {weeklySeen}`

Everything renders without them: no email shows "add one", no weekly shows nothing.
