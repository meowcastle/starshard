# Star Shard — ship-readiness audit (26 Oct 2026)

*Independent code audit of the repo snapshot. Tests run; nothing modified. Companion to `SHIP-AUDIT-26OCT.md` §1.*

## What exists

**Front end.** `star-shard/index.html` (171 KB, 349 bindings) is a hand-synced copy of `Star Shard v4.dc.html` (byte-identical after `../` path normalisation). It is a Design-tool (`dc-runtime`) page: `support.js` pulls React/ReactDOM/Babel and transpiles the `<script type="text/x-dc">` block in the browser. Thirteen engine modules load via dynamic `import()` (`star-shard/index.html:934-942`): astro, sigil, sky, reading, stations, reading-copy, sigil-copy, tz, api, transits, combos, findings, format. Three tabs (tonight / chart / shard) plus onboarding, "add a chart", "keep your shard" (account sheet), "own the road" (paywall mock), "the covered well" (Manzil door, forced off at line 1807). `four-skies.dc.html` is a share page reached via query params (lines 2099-2102). `mansions/` holds 30 generated static permalink pages + OG images; `sitemap.xml` lists 30 URLs.

No `<title>` or OG tags on `star-shard/index.html` (grep count 0; `account/index.html` has them).

**API.** `starshard-api/server.js` (1,107 lines, Express 4 + MySQL2, JWT cookie `starshard_session`, 90-day expiry, token_version revocation). 36 routes: auth (age-check, signup, login, logout, forgot/reset-password, verify-email, resend-verification), `/api/me` (+ birth, manzil-pack, manzil-progress, export, DELETE), state, deck, sigil, recollection, guestbook (+ admin). All user routes behind `requireAuth` (line 124); rate limiters on 8 endpoints; CORS allow-list from `ALLOWED_ORIGINS`. Socket.io lobby for Manzil PvP (`lib/manzil-lobby.js`). Age gate: `lib/age-gate.js`, 13 worldwide, 14/15/16 for specific EEA states, region from client-supplied IANA tz; `CF-IPCountry` honoured only if `TRUST_EDGE_HEADERS=1` (off). Signup re-checks age server-side (`server.js:357-359`).

**Data stored** (`schema.sql`, 13 tables): users (email, username, bcrypt hash, email_verified), `birth_data` (full date/time/place/lat/lon, opt-in tier), `manzil_pack` (five ints + birth_year), sigil, recollection, window_state, deck, password_resets, email_verifications, manzil_progress/reports/blocks, guestbook (ip_hash). No payments table, no payment provider anywhere (grep for stripe/paypal/iap: 0 hits). Email: Resend, for reset and verification only. Analytics/telemetry: none in page or server (grep 0); the privacy page's "no analytics" claim holds.

**Deploy.** `tools/deploy.sh`: cat-over-ssh to a Synology NAS (`justin@wreckroom.nyc`, `/volume2/web/starshard-staging`, Node 20 at `/volume2/@appstore/Node.js_v20`), served as `staging.starshard.net`; API at `api.<host>:4001` (`api.js:17`). No CI, no production environment distinct from staging, DB migrations manual, restart is `pkill; sleep; nohup` with a documented EADDRINUSE race (`deploy.sh:190-210`). Root `index.html` is Manzil; Star Shard lives at `/star-shard/`.

## Test results

- `npm test`: 202/202 pass (node --test; astro, sigil, sky, transits, reading, findings, rates, combos, deck, events, mansions, stations, reading-copy, age-gate [9]).
- `npm run bindings`: 408 bindings, none missing. `npm run manzil`: 45 code-owned markers present, 5 SVG warnings (Manzil only).
- `npm run selfhost`: passes after `node tools/vendor.mjs` (3/3 SRI hashes verified).
- `node starshard-api/lib/manzil-engine.js`: 36/36 self-checks.
- `node --check starshard-api/server.js`: OK. `npm ci` in both packages clean.
- Not run: `test/smoke.mjs`, `test/selfhost.mjs` (Playwright; Chromium download blocked, no system browser). `test/smoke-phone.mjs` is self-declared non-functional. There is no API integration suite; only the age-gate unit tests and engine self-checks. Server routes against a real MySQL: not verified.

## Blockers

1. **Star Shard's own signup is broken.** `star-shard/index.html:1252-1256` calls `api.signup()` with `{username, birthDate, birthTimeKnown, placeName, lat, lon, tz}` but no `five`/`pack`; `server.js:362-363` requires `parseManzilPack(req.body)` and returns 400 `invalid_input`. Every account created from the Star Shard page fails with "could not create your account". The lat/lon/placeName it sends are ignored (signup writes only `manzil_pack`); `api.saveBirth()`/`PUT /api/me/birth` is never called from the page (grep 0), so the readings tier is never populated from Star Shard.
2. **No monetisation exists.** PRODUCT.md §12 (decided Aug 13): "One-time unlock plus cosmetics. No microtransactions. Arrival and the Deep Chart are free." The page has a "$19 once" button (`star-shard/index.html:818`) whose handler is `ownIt: () => this.setState({ owned: true })` (line 1804) and a dead "restore a purchase" button (line 820). `payOn` is gated on `props.nightEight`, default false. PLATFORM.md says IAP is app-wrapper-only; no Capacitor project exists. Decision needed: free web v1, or Stripe/web checkout + server entitlement.
3. **Server engine imports probably 404 in production.** `server.js:880-882` imports `../sigil.js`, `../deck.js`, `../astro.js`; `deploy.sh` ships those modules to `starshard-staging/`, not to `/volume2/web/` where `BACKEND_REMOTE`'s parent resolves. `PUT /api/sigil` and `POST /api/recollection` depend on this. Not verified against the box.
4. **Legal pages describe a different product.** `privacy/index.html:43` opens "To play Manzil you need an account"; terms ("Manzil is free to play; Star Shard's deeper reading is a one-time unlock") promise a purchase that does not exist; `privacy:112-114` says export and deletion are "built into the product" but no page calls `exportData`/`deleteAccount` (grep 0). Company name "Wreck Room", `privacy@starshard.net`, NY governing law are unconfirmed per CLAUDE.md.
5. **Password reset / email verification have no UI.** `forgot|resetPassword|verifyEmail`: 0 hits in `star-shard/index.html` and `account/index.html`. Endpoints exist; a locked-out user has no path.
6. **No page metadata.** No `<title>`, OG, or description on the Star Shard page.

## Should-fix

- **Performance.** First load about 3.2 MB runtime (Babel 3 MB, self-hosted) + `combos.js` 1.52 MB + `reading-copy.js` 397 KB + `astronomy-engine.js` 108 KB, then in-browser Babel transpile of a 171 KB page. Phone-first audience on a home-uplink NAS. Splitting `combos.js` (784 cells; one needed) is the obvious win.
- **Accessibility.** `aria-`: 0, `alt=`: 0, `@media`: 0; 12 clickable `<div onClick>`s; 55 font-size declarations at 9 to 11 px. Layout fixed at the Design tool's 470×960 preview via `ios-frame.jsx`; desktop/tablet behaviour not verified.
- **Content review.** `RESUME-784.md:5`: "The generation pass is complete. Nothing in it has been reviewed." The 784-cell combination corpus is live on the shard tab unread (estimated 13 hours, §5b).
- **Ops.** Deploy race documented but unfixed; no process supervisor; `.env` on box only; no backups mentioned; no health endpoint; no error reporting.
- **Age gate on the Star Shard page** never calls `api.ageCheck()` first (account portal does, `account/index.html:568`).
- **`manzil_reports` cascades on the reported user** (CLAUDE.md W6), a moderation hole in the shared DB.

## Later

- Daily/weekly generative pipeline (PRODUCT.md §7-11): `transits.js` + `weeklyReading()` templated and wired; no LLM, moderation, or storage layer; §12b model/host decision open.
- "In your life" lifetime-rarity line (STATUS-AUG14; SHARD-MODEL's headline claim): not built.
- `fullReading()` built/tested, nothing renders it. `mansion-depth.js` generated, unwired. `sigNightOf[n]` re-read: stub. Reminders toggle (`toggleRemind`, line 2022) sets state only. Frame switching, 28 match flags (12/28), minigame layer, Capacitor wrapper: unbuilt.
- Dead/legacy: `Star Shard v2 (archived).dc.html`, `v3.dc.html`, `test/smoke-phone.mjs`, `sigil-copy.js` placeholder prose for the Sounding.

## Star Shard–Manzil touchpoints

- **Shared account + DB.** One `users` table; `POST /api/auth/signup` is Manzil-shaped (requires `five`/`pack`, `server.js:242-248, 362`). Login accepts email or username for both (`server.js:403-408`).
- **Shared portal.** `account/index.html` titles itself "the account manzil and star shard share" (line 8), shows "manzil" as the heading (line 127), and hands off into Manzil: `window.location.href = "../#tutorial"` / `"../#legend"` / `"../"` (lines 510, 511, 618).
- **Manzil links to Star Shard** with a broken href: `Star Shard v3 Build Plan/Manzil - Game Prototype V2.dc.html:4211` → `href="Star Shard v4.dc.html"`, not a deployed path (live is `/star-shard/`).
- **Manzil writes Star Shard's birth tier.** V2 `:16273-16278` calls `api.saveBirth()` so a Manzil signup unlocks a reading "with no second birthday prompt".
- **Star Shard → Manzil door** exists in markup (`star-shard/index.html:240-244, 824-827`) but `gameNightOn: false` (line 1807).
- **Shared code/deploy.** `api.js` carries Manzil functions; `FRONTEND_FILES` ships `manzil-copy.js`, `manzil-art2.js`, `ephemeris2.js`, `socket-io-client.js`; `server.js` boots the Socket.io lobby unconditionally (lines 12-13); privacy/terms are Manzil-first; Manzil owns the site root.

## Effort to ship (standalone web v1)

| # | Item | Size | Priority |
|---|---|---|---|
| 1 | Decouple signup: make `five`/`pack` optional server-side (or compute them in-page), write `birth_data` from Star Shard signup via `saveBirth` | 0.5 d | blocker |
| 2 | Decide monetisation for web v1 (free, or Stripe + `entitlements` table + `owned` from server); remove/hide fake "$19" and "restore" buttons until real | 0.5 d decide / 3-4 d Stripe | blocker |
| 3 | Verify/fix server's `../sigil.js` import path on the NAS; add a deploy smoke request | 0.5 d | blocker |
| 4 | Account UI: forgot/reset password, verify-email landing, export + delete buttons (`docs/WORKORDER-DESIGN-ACCOUNT-DATA-02SEP.md`) | 2 d | blocker |
| 5 | Rewrite privacy/terms Star Shard-first; confirm entity, contact, law | 0.5 d + Justin | blocker |
| 6 | `<title>`/OG/description + per-chart share image; sitemap includes `/star-shard/` | 0.5 d | blocker |
| 7 | Move Star Shard to site root or its own domain; fix Manzil's broken href; de-Manzil the account portal copy | 1 d | should |
| 8 | Call `ageCheck()` before showing signup fields | 2 h | should |
| 9 | Split `combos.js` per cell (or lazy JSON); measure phone load on 4G | 1 d | should |
| 10 | Human read of the 784-cell corpus (RESUME-784 §5b) | 13 h | should |
| 11 | Accessibility pass: buttons not divs, labels, contrast, min 12 px, desktop layout | 1-2 d | should |
| 12 | Playwright smoke in CI-ish form; API integration suite against Docker MySQL | 1-2 d | should |
| 13 | Deploy hardening: fix restart race, process supervisor, `/health`, DB backup | 1 d | should |
| 14 | Reminder channel (email via Resend, opt-in, off for minors) | 2 d | later |
| 15 | Lifetime-rarity module; daily/weekly LLM pipeline; Capacitor + IAP | weeks | later |

Blocker total: roughly 5 to 6 working days for a free web v1 (plus decisions on #2 and #5); add 3 to 4 days if web checkout is in scope.
