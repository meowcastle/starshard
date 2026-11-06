# HANDOFF-CODE-STARSHARD-LAUNCH-06NOV.md

**For Claude Code, running on Justin's Mac with real network access.** 6 November 2026.
Goal: **Star Shard, the astrology app, live at https://starshard.net as its own product**,
with its own repo, its own API process and its own database. Manzil and Deck Bench are
separated from it in the same pass (`SEPARATION.md` is the full plan for all three; this
document is the Star Shard part, which goes first).

Why you and not the build shift: the scheduled build shift runs in a sandbox that cannot
reach the NAS, GitHub over ssh, MySQL or starshard.net. Everything below that touches those
is yours. Everything that is pure code in the repo, the build shift has already done or is
doing (SS0 to SS9 done, SS10 and SS11 in progress as of this morning).

Read first, in this order: `STARSHARD-LAUNCH.md` (§0 is the law: the best version forward),
`SEPARATION.md`, `BACKLOG.md` (SS rows), `docs/CLOUDFLARE-RUNBOOK.md`, `CLAUDE.md`.

---

## 0. Decisions already made (do not reopen)

| decision | answer |
|---|---|
| products | three, fully separate: Star Shard (astrology), Manzil (card game), Deck Bench (MTG sim) |
| repos | three GitHub repos; the current `meowcastle/starshard` becomes history |
| databases | one per product. **The existing MySQL database stays with Manzil.** Star Shard starts on a new, empty one |
| accounts | separate per product. No shared login, no single sign-on, no shared cookie. Products link to each other with plain links only |
| Star Shard domain | `starshard.net` (site) and `api.starshard.net` (API) |
| Manzil domain | its own, to be bought (see `SEPARATION.md` §2); until then it stays on `staging.starshard.net` exactly as it runs today |
| Deck Bench domain | stays `sim.starshard.net` for now |
| v1 money | free; no checkout at launch |
| legal | operator Bjur Media LLC, contact privacy@starshard.net, governing law New York |
| DNS | Justin already has a Cloudflare account; starshard.net moves into it from GoDaddy |

---

## 1. Coordinate with the build shift first

The scheduled task "Star Shard build shift" fires every three hours and edits this folder.
Before you touch anything, take its lock: write the current UTC time into
`docs/nightly/LOCK` (`date -u +%Y-%m-%dT%H:%M:%SZ > docs/nightly/LOCK`). A run that finds a
timestamp younger than 170 minutes stops without writing. Refresh the timestamp every two
hours while you work, and write `free` into it when you finish. Read the newest
`docs/nightly/REPORT-*.md` before you start: SS10 and SS11 may have landed since this was
written.

---

## 2. Commit and push what exists (Justin may already have done this)

`git status` showed 186 changed paths on 6 Nov, about ten days of build-shift work with no
other copy. `.gitignore` now excludes `_incoming/`, `_to_delete/`, `app/dist/`,
`app/node_modules/` and `test/_tmp_*`, so the commit is about 289 files, 11 MB. If it is
not already committed, commit it on the current branch (`mtg-sim`) with a plain message and
push. Then merge `mtg-sim` into `main` and push `main`; that commit is the last state of the
monorepo and the starting point for all three new repos.

---

## 3. The new Star Shard repo

Create `meowcastle/starshard-app` (private). It holds only Star Shard. Take from the
monorepo:

| take | path in the monorepo |
|---|---|
| the web app | `app/` (source, `build.mjs`, `serve.mjs`, `og/`, extract scripts) |
| the engine modules | `astro.js`, `astronomy-engine.js`, `sky.js`, `stations.js`, `transits.js`, `reading.js`, `reading-copy.js`, `combos.js` (or the per-cell split SS10 makes), `findings.js`, `rates.js`, `format.js`, `tz.js`, `sigil.js`, `sigil-copy.js`, `deck.js`, `events.js`, `mansion-depth.js`, `api.js` |
| the API | `starshard-api/` with the changes in §4 |
| legal | `privacy/`, `terms/` (Star Shard only, see §6) |
| tests | `test/` minus anything Manzil-only (`fuzz-manzil.mjs`, `qa-loop.mjs`, the manzil engine checks), `starshard-api/test/` |
| tools | `tools/` minus Manzil-only ones (`check-manzil.mjs`, `steam-*`), plus `writing-lint.mjs`, `noun-ledger.mjs`, `build-*.mjs`, `vendor*.mjs`, `deploy.sh` (rewritten, §7) |
| research the corpus needs | `research/corpus-*.md`, `research/mansions-table.json`, `research/combos.json`, the generators' other inputs (check each `tools/build-*.mjs` for what it reads) |
| docs | `STARSHARD-LAUNCH.md`, `APP-FRAMEWORK.md`, `UX-FLOW.md`, `PRODUCT.md`, `PLATFORM.md`, `WRITING.md`, `COSMOLOGY.md`, `UI-PRINCIPLES.md`, `SHARD-MODEL.md`, `CHART-BUILDER.md`, `GENERATION.md`, `RESUME-784.md`, `CLAUDE.md` (cut to the Star Shard parts), this handoff, and a new `BACKLOG.md` holding only the SS rows |
| do not take | anything Manzil (`Star Shard v3 Build Plan/`, `manzil/`, `manzil-*.js`, `ephemeris2.js`, `socket-io-client.js`, `walker-sheet.js`, `MANZIL-*.md`, `research/manzil-*`, `v2/`, `research/v2-sim/`), anything Deck Bench (`mtg sim/`), the retired Star Shard surfaces (`star-shard/`, `Star Shard v*.dc.html`, `ios-frame.jsx`, `account/`, `four-skies.dc.html`), `content/steam/` |

A plain copy with a first commit that says where it came from (the monorepo commit hash) is
enough; history stays in the archived repo. Run `npm install`, `npm test` (root),
`cd starshard-api && npm test`, `npm --prefix app run build:app` and the app smoke before
the first push. Every one must pass.

**One wiring change in the app: the game comes out.** Remove the `play` route from
`app/src/routes.mjs`, step 7 of `app/build.mjs` (the copy into `dist/play/`), `app/play/`,
the `/play/` entry in the build's PUBLIC list and sitemap, and the two "doors" MZ7 added.
Where the app mentions the game (the home page's "walk tonight's road", tonight's "playable
tonight" line, the codex's card and walkers sections), it becomes one plain outbound link
to Manzil's site (`https://staging.starshard.net/` until Manzil has its domain; put the URL
in one constant). No shared session: the link opens Manzil, which has its own sign-in.
The codex keeps the card's numbers and the walkers' lines, because they are the station's
lore; it loses any control that played them.

---

## 4. The Star Shard API, cut down

In the new repo's `starshard-api/`:

- **Remove** everything Manzil: `lib/manzil-engine.js`, `lib/manzil-lobby.js`,
  `lib/manzil-cast.js`, the socket.io server and its import, routes
  `/api/me/manzil-pack` and `/api/me/manzil-progress`, the `five`/`pack` branch of signup
  (signup is now Star Shard's shape only: birth data required, `birthTz` as SS1 defined),
  and the tables `manzil_pack`, `manzil_progress`, `manzil_reports`, `manzil_blocks` from
  `schema.sql`. Drop `socket.io` from `package.json`.
- **Keep**: auth (age-check, signup, login, logout, forgot/reset, verify-email, resend),
  `/api/me`, birth, tonight, state, deck, sigil, recollection, email capture, guestbook and
  its admin routes, export and delete.
- **Tests**: rewrite `test/signup.test.js` for the single shape; delete the Manzil cases
  rather than skip them. `npm test` green on the SQLite shim.
- **Export and delete** must list exactly the tables that remain, and every remaining
  user-scoped table must carry `ON DELETE CASCADE` (CLAUDE.md invariant).
- **Config**: a new `.env` on the NAS, never in the repo:

  ```
  PORT=4002
  DB_NAME=starshard        # the NEW database
  DB_HOST / DB_PORT / DB_SOCKET / DB_USER / DB_PASSWORD   # a new MySQL user with rights on starshard only
  JWT_SECRET=<new, 64 random bytes; not the old one>
  ALLOWED_ORIGINS=https://starshard.net,https://www.starshard.net
  APP_URL=https://starshard.net
  RESEND_API_KEY=<Justin's>
  RESEND_FROM=Star Shard <hello@starshard.net>
  ADMIN_TOKEN=<new>
  TRUST_EDGE_HEADERS=0     # set to 1 only after §8 step 6
  NODE_ENV=production
  ```

  Port 4002, not 4001: the old API keeps running on 4001 for Manzil.
  A new `JWT_SECRET` and a cookie name of `starshard_session` on the `starshard.net` domain
  mean a Manzil cookie can never be read by Star Shard and the reverse.

---

## 5. The database

On the NAS's MariaDB (the same server the current API uses; it is the instance, not the
database, that is shared, and that is fine):

1. `CREATE DATABASE starshard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
2. A new user with privileges on `starshard.*` only.
3. Load the new `schema.sql` and any migrations still needed (email capture).
4. Back it up nightly from day one: a `mysqldump starshard | gzip` to a dated file on a
   second volume, kept 30 days. Write the cron line into `tools/backup.sh` in the new repo
   and install it on the NAS.

**Do not copy any rows from the old database.** The old database is Manzil's (§0). The
`birth_data` rows in it were written by Manzil's chart grab and stay there until Manzil's
own split decides what happens to them (`SEPARATION.md` §5). Before you finish, record the
row counts of every table in the old database in the report (`SELECT COUNT(*)` per table),
so the Manzil split starts from known numbers.

---

## 6. Legal pages

`privacy/` and `terms/` in the new repo describe Star Shard alone: what Star Shard stores
(account, email, birth date/time/place, chart state, ring, email capture), the third
parties that see anything (Resend; the geocoder the birth form calls; Cloudflare once it
fronts the site), Bjur Media LLC as operator, privacy@starshard.net, New York law. Remove
every Manzil and Deck Bench mention. Fix the "how it works" line: Justin's wording call is
pending; until he answers, use "your chart is computed on this device. if you make an
account, it is saved there too, so it opens anywhere you sign in." and flag it in the
report. Run `node tools/writing-lint.mjs` on both pages.

---

## 7. Deploy targets

Rewrite `tools/deploy.sh` in the new repo with exactly two targets:

| target | frontend | API |
|---|---|---|
| `staging` | `app/dist/` to `/volume2/web/starshard-app-staging` | the new API on port 4012 against a `starshard_staging` database |
| `production` | `app/dist/` to `/volume2/web/starshard-app` | the new API on port 4002 against `starshard` |

Keep what the old script got right: atomic write of each file, the vendor hash check, the
health check after restart. Fix what the audit found: the restart race
(`pkill; sleep; nohup` hitting EADDRINUSE); run each API under a supervisor that restarts
it (Container Manager or a `docker compose` service, the same way the RV-rentals stack on
this NAS does it), and add `GET /health` returning 200 and the git commit. Add a Cloudflare
cache purge at the end of a production frontend deploy (`/`, `/index.html`, the HTML
routes) once §8 is done; the API token for it is a NAS secret.

**Do not touch** `/volume2/web/starshard-staging`, the old API on 4001 or the old database.
That is Manzil's live site until its own split moves it.

On the NAS, Web Station needs two virtual hosts on port 80: `starshard.net` (and `www`) to
`/volume2/web/starshard-app`, and `starshard-staging-app.local` or a path you choose to the
staging folder. The site is a static build with client-side routes: unknown paths must
fall back to `index.html` (check what `app/serve.mjs` does and mirror it).

---

## 8. Cloudflare and DNS

Justin already has a Cloudflare account. He does the clicks; you write the exact values
into the report and check each step with `curl` and `dig` from the Mac.

1. **Add the site.** Cloudflare dashboard → Add a site → `starshard.net` → Free. Cloudflare
   imports the GoDaddy records. Check the import against what resolves today
   (`dig +short starshard.net`, `staging`, `api.staging`, `sim`, `api`, `www`, `MX`, `TXT`).
   **`staging` and `api.staging` must be in the list**, or Manzil goes dark when the
   nameservers switch. Remove the GoDaddy website-builder records for the root and `www`.
2. **Switch nameservers at GoDaddy** to the two Cloudflare gives. Wait for "active".
3. **Tunnel.** Follow `docs/CLOUDFLARE-RUNBOOK.md` pass one to create `starshard-nas` and
   run `cloudflared` on the NAS (copy the RV-rentals compose service). Public hostnames:

   | hostname | service |
   |---|---|
   | `starshard.net` | `http://localhost:80` (Web Station vhost for the production folder) |
   | `www.starshard.net` | redirect rule to `https://starshard.net` |
   | `api.starshard.net` | `http://localhost:4002` |
   | `staging.starshard.net` | `http://localhost:80` (Manzil, unchanged) |
   | `api.staging.starshard.net` | `http://localhost:4001` (Manzil's API, unchanged) |
   | `sim.starshard.net` | whatever it points at today; do not change it |

   Websockets must stay on for `api.staging` (Manzil's lobby).
4. **Email.** Email Routing: `privacy@starshard.net` and `hello@starshard.net` forward to
   Justin's inbox. In Resend, add the `starshard.net` sending domain and put its DNS
   records into Cloudflare, so password-reset mail comes from `hello@starshard.net` and
   passes SPF and DKIM.
5. **Cache rules** from the runbook's table, adapted: hashed assets in `app/dist/` cached a
   year; HTML short.
6. **Only then** close the router's port forward, and only then set
   `TRUST_EDGE_HEADERS=1` on the Star Shard API (the runbook's two conditions).

---

## 9. The launch gate (SS13), in order

1. All tests green in the new repo; build clean; app smoke green at 390 and 1440 wide.
2. `tools/deploy.sh staging`; open it beside the live game and click every page. **The law
   (STARSHARD-LAUNCH §0): a page that reads as a lesser product than the game does not
   ship.** Write what you saw, page by page, into the report.
3. On staging, the stranger's path by hand: land, enter a birth, read the shard, sign up,
   receive the verification mail, sign out, reset the password by mail, sign in, export,
   delete. Every mail must arrive from `hello@starshard.net`.
4. Lighthouse on `/` and `/tonight`: performance and accessibility both 90 or above on a
   phone profile.
5. Justin looks at staging and says go.
6. `tools/deploy.sh production`; repeat step 3 on https://starshard.net with a real
   address; check the link preview of `/` and one `/station/` page with a social card
   validator.
7. Mark SS13 done in the new repo's backlog.

---

## 10. After launch, in the new repo

Point the build shift at the new repo: Justin updates the scheduled task's prompt (it names
the folder and the backlog). The new backlog carries SS14 (retire old surfaces, now just
"archive the monorepo"), SS15 (email reminders), SS16 (checkout), SS7b (the corpus prose
pass), and the open wording calls from the reports. Manzil and Deck Bench each get their
own backlog in their own repo (`SEPARATION.md`).

---

## 11. What to report

Write `docs/handoffs/REPORT-CODE-STARSHARD-LAUNCH.md` in the new repo: what you did per
section, every command's result that matters, the old database's table counts (§5), the
DNS records before and after, anything you could not do and why, and what Justin must do
next. Plain prose, no em dashes.
