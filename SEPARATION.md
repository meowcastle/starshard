# SEPARATION.md — three products, three repos, three databases

**6 November 2026. Justin's call:** Star Shard, Manzil and Deck Bench are three separate
products. Each gets its own repo, its own API process, its own database, its own accounts
and its own legal pages. They link to each other; they share nothing at runtime.

This supersedes the "one app" plan of 27 October (`STARSHARD-LAUNCH.md` §2.2 to §2.3,
where Manzil lived at `/play` inside Star Shard). The look decision stands: Manzil V2's
look is still the best version the brand has, and Star Shard keeps it. Sharing a look is
not sharing a product.

---

## 1. What is tangled today

| link | where | cut by |
|---|---|---|
| one API process serves Star Shard and Manzil | `starshard-api/server.js` | each product gets its own API (§3) |
| one database, one `users` table, one session cookie | MySQL `DB_NAME`; `starshard_session` | Manzil keeps the old database; Star Shard starts a new one (§4) |
| the game's live-play lobby runs inside that process | `lib/manzil-lobby.js`, socket.io in `server.js` | moves with Manzil |
| signup accepts a Manzil shape and a Star Shard shape | SS1's two branches | each API keeps its own shape only |
| the game sits at `/play` in the Star Shard app | `app/build.mjs` step 7, `routes.mjs`, `app/play/` | removed from Star Shard; a plain link instead |
| the game's account and export doors point at Star Shard's pages | MZ4, MZ7 build-time rewrites | Manzil gets its own account page back (§6) |
| Deck Bench founders sign in with their Star Shard login | `mtg sim/server.js` lines 126 to 135 and 1839 to 1850, `accounts.js` `starshard_id` | Deck Bench accounts become local only (§7) |
| one deploy script, one web folder, one privacy page | `tools/deploy.sh`, `privacy/`, `terms/` | one of each per product |
| shared engine code | `tz.js`, `api.js`, the ephemeris, `support.js` | copied into each repo, then each owns its copy |

The last row is deliberate. Copies drift, and that is the price of separation; it is
cheaper than a shared package three products have to agree on. The one place drift would
be visible to a person is the Moon's position, so each repo keeps the 730-night agreement
test against `astro.js` (`test/tonight-agreement.test.mjs`).

---

## 2. Homes

| product | site | API | database | repo |
|---|---|---|---|---|
| **Star Shard** | `starshard.net` | `api.starshard.net` (port 4002) | `starshard`, new and empty | `meowcastle/starshard-app` |
| **Manzil** | its own domain, to buy; until then `staging.starshard.net` as today | `api.<its domain>`; until then `api.staging.starshard.net` (port 4001) | the existing database, renamed `manzil` when it moves | `meowcastle/manzil` |
| **Deck Bench** | `sim.starshard.net` for now | same host, its own server | its SQLite file under `DATA_DIR`, as today | `meowcastle/deck-bench` |

**Manzil's domain is Justin's to buy.** Short, sayable, and not about astrology so the
game can stand alone: candidates to check at the registrar are `playmanzil.com`,
`manzil.game`, `manzilgame.com`, `getmanzil.com`. Buy it inside the existing Cloudflare
account (Cloudflare Registrar sells at cost), so DNS is already there. Moving Manzil onto
it costs almost nothing in code: `api.js` already finds its API at `api.<hostname>`.

Deck Bench moves to its own domain when it opens beyond the founders. Until then
`sim.starshard.net` is only a hostname; nothing on its pages says Star Shard.

---

## 3. One API each

| | Star Shard API | Manzil API | Deck Bench |
|---|---|---|---|
| starts from | `starshard-api/` with Manzil cut out | `starshard-api/` with Star Shard cut out | `mtg sim/server.js`, unchanged in shape |
| keeps | auth, `/api/me`, birth, tonight, state, deck, sigil, recollection, email capture, guestbook, export, delete | auth, `/api/me`, manzil-pack, manzil-progress, tonight, email capture, export, delete, the lobby (socket.io), reports and blocks | its own accounts, runs, brews, coach |
| signup takes | birth data, `birthTz` | the five, the pack, birth year (the two-tier model: no full birth data) | name, email, password; no Star Shard login |
| removes | `lib/manzil-*`, socket.io, the five/pack branch, the manzil tables | birth, sigil, recollection, state, deck, guestbook, the birth-data branch | the Star Shard login path and `STARSHARD_API` |
| secrets | its own `JWT_SECRET`, `ADMIN_TOKEN`, DB user | its own | its own |

Each process runs under a supervisor with a `/health` route; none of them can reach
another's database (separate MySQL users with rights on one database each).

---

## 4. Data: who keeps what

**Manzil keeps the existing database.** Star Shard's own signup never worked before
SS1 (the audit's blocker 1), so the accounts in it are Manzil players. They keep their
logins, their packs and their progress with no migration.

**Star Shard starts empty.** Nothing is copied into it. Anyone who used both makes a Star
Shard account at launch; the Star Shard launch page can say so in one line.

**Deck Bench keeps its SQLite file.**

---

## 5. The rows that need a decision

The existing database holds tables Manzil no longer needs once it is alone:

| table | why it is there | proposal |
|---|---|---|
| `birth_data` | Manzil's chart grab wrote full birth data so a reading could unlock in Star Shard | Manzil's privacy model is the five integers, not a birth certificate. Tell those players by email that the reading lives at starshard.net now and that their full birth data will be deleted from the game in 30 days; then delete the table. **Justin's call.** |
| `sigil`, `recollection`, `window_state`, `deck` | Star Shard surfaces, written only if someone used the old Star Shard page signed in | count the rows (Code's handoff §5). If close to none, delete with the same notice. |
| `guestbook_entries` | the old Star Shard page's guestbook | export it to a file for Justin, then drop it from Manzil's database |
| `email_capture` | MZ3's field, a Manzil list | stays with Manzil |

Code records the row counts during the Star Shard launch; nothing is deleted until Justin
has seen them and the notice has gone out.

---

## 6. Manzil on its own

After Star Shard is live:

1. `meowcastle/manzil` from the monorepo's last commit: the live game file and its
   runtime files (`support.js` via `tools/selfhost-runtime.mjs`, `ephemeris2.js`,
   `manzil-art2.js`, `manzil-copy.js`, `socket-io-client.js`, `api.js`, `tz.js`,
   `walker-sheet.js`), `manzil/` (the rules sheet and manual), the Manzil API, the
   engine research (`research/manzil-*`, `research/manzil-loop/`), the TCG track (`v2/`,
   `research/v2-sim/`, `docs/BACKLOG-V2.md`, `MANZIL-*.md`), `content/` (the Steam and
   video work), the MZ and V2 backlog rows, the Manzil part of `CLAUDE.md`,
   `docs/MANZIL-CODE-OWNED-BEHAVIORS.md`, `tools/check-manzil.mjs`, the Manzil tests.
2. The account door comes back into the game: the September file already has its own
   in-page cast, signup and sign-in (CLAUDE.md, 30 Aug). What it lacks is export and
   delete. MZ4 pointed those at Star Shard's account page; instead they become two items
   in the game's own pause menu calling `api.exportData()` and `api.deleteAccount()`.
3. Its own privacy and terms, its own Resend sending domain, its own deploy script.
4. Rename the database `manzil`, move the API to the new domain, and point the tunnel at
   it. Old `staging.starshard.net` redirects to the new domain for 90 days.
5. The build shift gets a second scheduled task, or the existing one is pointed at this
   repo; one backlog per task, never two.

---

## 7. Deck Bench on its own

1. `meowcastle/deck-bench` from `mtg sim/` (it is already self-contained: its own
   `package.json`, Dockerfile, deploy script, tests).
2. Cut the Star Shard sign-in: remove `STARSHARD_API`, the login branch at
   `server.js:1839` to `1850`, `accountFor`'s `starshard_id` path and the column. Each
   founder whose account has `source = 'starshard'` gets a one-time "set your password"
   email (the existing Resend code path), and their account becomes `source = 'sim'` with
   history kept.
3. Its own privacy and terms (the audit lists them as a public-launch blocker anyway).
4. FS2 to FS4 move into its backlog.

---

## 8. Order

| step | what | who |
|---|---|---|
| 1 | Star Shard: new repo, cut API, new database, Cloudflare, launch (`docs/handoffs/HANDOFF-CODE-STARSHARD-LAUNCH-06NOV.md`) | Code on the Mac, Justin for the Cloudflare clicks and the go |
| 2 | Manzil: Justin buys the domain; Code makes the repo, cuts the API, renames the database, sends the notice, moves the domain | Code, Justin |
| 3 | Deck Bench: repo, local accounts only, its own legal pages | Code or the build shift |
| 4 | Archive `meowcastle/starshard` as read-only history | Justin |

Star Shard goes first because it is the smallest cut (it takes nothing with it but code)
and because Manzil keeps running untouched on its current host while that happens.
