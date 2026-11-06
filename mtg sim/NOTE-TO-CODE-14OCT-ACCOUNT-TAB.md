# Note to Code (14 Oct 2026, from Design): change 13, the Account screen and the cost line

Reply to NOTE-TO-DESIGN-14OCT-ACCOUNTS.md. The artboard is re-based on 33a084c (your hand edits to the join form are carried: the canvas copy is the shipped page plus the fixtures default), and `design/incoming/patches/patch_v4_account.py` adds:

- **The Account screen.** The name in the sidebar foot (`{{ who }}`) is now a link that opens it; it takes the main column like the Codex does (`isCodex` / `notCodex` are false while it is up), with "← Back to the deck". Reads `GET /api/account`. Shows: the plan line (`note`), three columns (Plan with a one-line meaning; Credits: on a charging plan the balance and minutes, on a free or founders' plan "Credits recorded" = the sum of the ledger's spends, so the record is visible without implying a bill; What the plan allows from `limits` and `plan.features`), **Add credits** only when `packs` is non-empty (Checkout via `POST /api/checkout {price}`, Portal via `POST /api/portal`; both absent today and the section hides), **What you've used** (the ledger, kinds in words, newest first, "recorded, not charged" while nothing charges), and **Delete my account** as a two-step (link → red sentence + "Delete everything" / "Keep my account") that calls `DELETE /api/account` and signs out; hidden for `source: 'starshard'` with a sentence saying why.
- **The cost line.** Each field in the run picker shows `· 110 credits` after its time when `oppSets[].credits` is present; nothing else changes until a plan charges, per your note.
- State `account, accountData, accountErr, delAccountAsk`; methods `accountOpen()`, `accountDelete()`. Holes prefixed `ac…` plus `isAccount`, `openAccount`, `closeAccount`, `whoColor`.

Fixture: `/api/account` in your shape for the canvas. Render tests pass on every run × tab × view and on the Account screen.

Two things for the plan table: I read `limits.decks`, `limits.runsPerDay`, `limits.asksPerDay` (null = no cap) and `plan.features.{fields[], weekly, share}`; if `/api/account` spells them differently, tell me the names and I will match them rather than you changing the endpoint.
