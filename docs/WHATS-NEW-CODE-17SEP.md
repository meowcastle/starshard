# What Code changed — 17 Sep 2026

Infrastructure and the age gate. Nothing in any `.dc.html`, nothing in
`renderVals()`, no bindings added or renamed. `npm run check` passes at
202/202 with the working-tree copy of `Manzil - Game Prototype V2.dc.html`
in place.

**Nothing here is committed yet**, and see the warning at the bottom about
that file, which changed under us mid-session.

---

## 1. unpkg is off the critical path

`support.js` fetches React, ReactDOM and `@babel/standalone` from unpkg.com.
That is ~3.2 MB before first paint, and `tools/vendor.mjs`'s own comment is
blunt about the failure mode: if unpkg is slow, blocked or down, the site
renders raw `{{ mustaches }}`. A third-party CDN has been a hard single point
of failure for the whole product, in front of a residential uplink.

**The runtime already had the hook.** `cdnScriptFor(url, sri)` checks
`window.__resources[url]` and uses that src when it is a non-empty string,
falling back to the CDN otherwise. So this needed no edit to the generated
file — it is the dc-runtime's own supported escape hatch.

New: **`tools/selfhost-runtime.mjs`** writes `build/support.js` — the pristine
runtime with a shim that fills in `window.__resources` pointing at `/vendor/`.

Why a build step and not an edit:

- `support.js` is generated and arrives byte-identical through deliveries.
  Hand-editing it is the exact pattern this repo keeps getting bitten by.
- `deploy.sh` regenerates it **on every deploy**, so a delivery that replaces
  `support.js` cannot silently put unpkg back in the critical path.

It verifies its own inputs. The SRI hashes baked into `support.js` are a free
oracle for "is `vendor/` actually what the runtime expects?". All three
currently match byte-for-byte. If a delivery ships a runtime built against a
newer React, the build **fails loudly** instead of serving the wrong version
to every visitor.

`tools/deploy.sh` now: builds the runtime, skips `support.js` in the
`FRONTEND_FILES` loop (it ships from `build/` instead), ships `vendor/` to
`$FRONTEND_REMOTE/vendor/`, and skips re-sending a vendor file whose remote
hash already matches — babel.js alone is 3 MB over cat-over-ssh.

**The vendor paths are root-absolute (`/vendor/…`) on purpose.** The runtime
injects those `<script>` tags at boot, so a relative URL resolves against the
DOCUMENT, not against `support.js`. `./vendor/react.js` would be correct at
the site root and a 404 under `/star-shard/` and `/account/`, which load the
same runtime.

### Verified in a real browser, with a control

`test/selfhost.mjs`, run with unpkg hard-blocked at the network layer:

| | pristine runtime | self-hosted |
|---|---|---|
| React + ReactDOM up | no | **yes** |
| `<x-dc>` hydrated | no | **yes** |
| unpkg requests | 2 | **0** |
| unresolved `{{ }}` on screen | — | **0** |

The control is deliberate and the test asserts on it. A self-hosted run that
passes proves nothing on its own: the browser could have cached React, or
unpkg might never have been on the path. **If the control ever starts passing,
this test has stopped measuring anything.**

Also learned: **Babel is never fetched at boot.** `ensureBabel()` is lazy and
only fires for a jsx `<x-import>`. So the 3 MB is not first-paint cost. The
test asserts `/vendor/babel.js` is served and SRI-correct rather than
requested.

`npm run check` is now `bindings → manzil → **selfhost** → test`. The selfhost
step soft-skips when `vendor/` is absent (it is gitignored, so a fresh clone
legitimately has none); the real build hard-fails, because deploy must never
ship a page that silently falls back to unpkg.

## 2. The age gate has a second opinion

`starshard-api/lib/age-gate.js` gains `minAgeFor({country, tz})`,
`minAgeForCountry(cc)` and `countryOfRequest(req)`. **`minAgeForTz` is
untouched** so every existing caller behaves identically.

The file's own header has always said region detection is the client's IANA
time zone because no geo-IP exists in this stack. With Cloudflare in front,
`CF-IPCountry` is real network-path geolocation and outranks it.

**Policy (Justin's call, 17 Sep): `country`.** The edge decides; the time zone
fills in when the edge says nothing. Same reasoning that reversed the flat-16
decision on 30 Aug — it does not over-restrict travellers. `strictest` (the
higher of the two) is available via `AGE_REGION_POLICY=strictest`.

**It ships switched OFF.** `server.js` has `regionOf(req)` gated behind
`TRUST_EDGE_HEADERS`. `CF-IPCountry` is an ordinary request header: while
anything can reach the API without passing through Cloudflare, a caller can
set it by hand, and under the `country` policy that is a way to talk a 16
minimum down to 13. Do not set it until the API is behind the tunnel **and**
direct origin access is closed. One without the other is worse than neither,
because it replaces an honest heuristic with a forgeable one.

### A bug worth recording, because it reads as correct

The first version's "did the edge answer?" test checked whether the country
appears in `COUNTRY_MIN_AGE`. **Most of the world is deliberately absent from
that table** because it sits at the 13 floor — so a US/CA/AU/JP answer read as
*no answer* and fell through to the client's clock, the one signal the edge
exists to outrank. A US IP with a Berlin clock returned 16.

`test/age-gate.test.mjs` (9 tests) pins that case by name, plus the
sentinels: Cloudflare sends `XX` when it cannot tell and `T1` for Tor, and
both must fall through rather than restrict — **unknown is not the same as
strict.**

## 3. Privacy page

The `unpkg` row is **gone** from the third-party table. That is a real
reduction: the runtime is served from our own origin now, so unpkg no longer
sees every visitor. Google Fonts remains.

Nothing else on that page changed, on purpose. The Cloudflare row, the "our
own hardware, not a cloud host" sentence and the age-detection wording are all
still true as written and only stop being true the moment the tunnel is live.
They are staged as gated steps in `docs/CLOUDFLARE-RUNBOOK.md` rather than
applied early, because a privacy page that describes a future state is just a
false one.

## 4. `docs/CLOUDFLARE-RUNBOOK.md`

The tunnel plan, pass one (static site) and pass two (API), the cache rules,
and the exact privacy edits each stage requires.

---

## Warning: that file changed under us

`Star Shard v3 Build Plan/Manzil - Game Prototype V2.dc.html` was modified at
**22:22 today, mid-session**, growing 13.7 KB — the "second look keeps what it
keeps" hand-animation work. Code did not touch it.

This is the two-agents hazard this repo opens with. It is fine, but:

- The changes above are in **entirely disjoint files**. No overlap.
- `npm run check` passes with that file present: 408 bindings none missing,
  all 44 code-owned markers intact.
- **Commit the two sets separately.**

---

## Addendum, 17 Sep evening — what moved after this was written

Appended rather than edited, so the original stands as written.

- **"Nothing here is committed yet" is no longer true.** All eleven files are in
  `a487d0a`, under their own message. They first went in as part of a Manzil
  commit, because a `git add -A` from the parallel session swept them up; that
  commit was split into `c6b7761` (Manzil) + `a487d0a` (this work) and
  force-pushed, with the resulting tree verified byte-identical to the original.
  **This document's own last line — "commit the two sets separately" — is exactly
  the instruction that was missed.**
- **The marker count is 45, not 44.** One was added the same day: `nw && nw.hand`,
  guarding the walker deref that stalled every road after board one.
- **`npm run check` is 202/202**, and the nine that took it from 193 are
  `test/age-gate.test.mjs` from this work — not, as the Manzil commit originally
  and wrongly claimed, tests that `_preview` brought with it.
