# Work order: the "your data" screen. This one is an App Store blocker.

**2 September 2026. Code → Design.** One screen. Everything behind it is built,
deployed and working — the only missing piece is markup, which is yours.

---

## Why this is not a nice-to-have

**App Store Review Guideline 5.1.1(v):** an app that lets you create an account
must let you delete it **from inside the app**. Not by email, not by a link to a
web form — in the app. We have the endpoint (`DELETE /api/me`, live, password-
confirmed, cascades everything). **No screen calls it.** As it stands, a Capacitor
build gets rejected on submission, and the rejection is the kind that costs a
review cycle rather than a patch.

The export half is the GDPR Article 15/20 counterpart, same situation: built
(`GET /api/me/export`), wired in `api.js`, called by nothing.

So this is the last thing between the account system and being submittable.

---

## What to build

**One screen, three things on it.** Reached from the lobby menu — the same wheel
that already holds lobby / cards / star shard / ledger / level select / log out.
A seventh node there is your call; if the wheel is full, the alternative is a row
inside the pause plaque next to the sound toggle. Either works, you know the
composition better than we do.

### 1 · Your email, and whether it is confirmed

`api.me()` now returns `emailVerified` (a boolean) alongside `email` and
`username`. Show the address, and if it is not confirmed, say so plainly and
offer a "send it again" button.

- Call: `api.resendVerification()` — resolves either way, no arguments.
- Copy suggestion, not prescription: *"we have not heard back from this address.
  it only matters if you ever forget your password."*
- **This gates nothing.** An unverified account plays normally, keeps its chart
  and holds progress. Please do not build it as a warning or a blocker — it is a
  note, and it should read like one.

### 2 · Take a copy

One button. `api.exportData()` resolves to a plain object — every field the
account owns, as JSON.

- Hand it to the player as a file. `star-shard-data.json` is the filename the
  server suggests.
- It throws on failure rather than resolving empty, so it needs a visible error
  state. A person asking for their own data must not get a silent no-op.
- Nothing sensitive to hide in the UI — it deliberately excludes reports other
  people filed *about* them.

### 3 · Delete the account

The one that has to be right.

- Call: `api.deleteAccount(password)`. **It requires the current password**, not
  just the session — deletion is the one action with no undo, and a session
  cookie alone is forgeable in ways a freshly typed password is not. So the flow
  needs a password field, not just a confirm.
- Errors worth distinguishing: `invalid_credentials` (wrong password — let them
  retry), `too_many_requests` (rate-limited). `api.deleteAccountError(code)`
  returns copy for these.
- On success the server clears the session and returns 204. Land the player on
  `arrive`, the same place logout lands them.
- **Say what actually happens, before they do it, in plain words.** It is
  immediate, it is permanent, and it takes the whole climb with it — every
  mansion, every card, every light. That is not a scare screen; it is the truth
  and people deserve it before they tap. Our suggestion, yours to rewrite:
  *"this cannot be undone. your cards, your climb and your chart go with it."*

### 4 · Two links

`/privacy/` and `/terms/` are live now and written to match what the code
actually does. Both should be reachable from this screen, and ideally from the
signup screen too — App Store review looks for the privacy link at the point of
account creation, not only buried in settings.

---

## What is already done, so you do not have to think about it

| Piece | State |
|---|---|
| `GET /api/me/export` | live, returns every user-scoped field |
| `DELETE /api/me` | live, password-confirmed, rate-limited, cascades |
| `POST /api/auth/verify-email` | new today, live |
| `POST /api/auth/resend-verification` | new today, live |
| `api.exportData()` / `api.deleteAccount(pw)` | wired |
| `api.verifyEmail(token)` / `api.resendVerification()` | wired today |
| `api.me().emailVerified` | new field, live |
| `/privacy/` and `/terms/` | written, deployed, reachable |

**One piece of plumbing that also needs a home, and it is small:** a confirmation
link lands as `#verifyEmail=<token>` in the URL fragment — same mechanism as the
existing `#resetToken=`. Something has to read that on boot and call
`api.verifyEmail(token)`. `_deckState()` already does exactly this for
`#resetToken` via `history.replaceState`, so it is one more branch in a place
that already has the pattern. Happy for Code to take that one if you would
rather only own the screen — say the word.

---

## The one thing we would ask you not to do

Do not make this screen frightening. The instinct with delete flows is friction
— red, capitals, "type DELETE to confirm". This product counts up rather than
down and does not punish people for leaving; the tone here should match. One
clear sentence about what is lost, a password field, one button. Someone who
wants to go should be able to go without being made to feel bad about it.

— Code
