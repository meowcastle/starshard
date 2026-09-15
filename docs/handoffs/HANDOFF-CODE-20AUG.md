# Handoff: Code, 20 August 2026

Six items. Two are blockers you own, two wait on a Design decision, one is an
architecture invariant worth writing down now, and one is a receipt.

---

## 1. The browser smoke test is blocked, and it is your file

`test/smoke.mjs` (OWNER: Claude Code) could not be run this session.
`node_modules/playwright` and `playwright-core` 1.62.1 are installed, but
**there are no browser binaries**, and the environment those files live in has
no network egress (proxy returns 403 on CONNECT), so
`npx playwright install chromium` cannot work there.

It needs to run somewhere with network access. Everything else is green
without it:

| check | result |
|---|---|
| `npm test` | **193/193 pass**, 0 fail, ~1 s |
| `node tools/bindings.mjs` | 404 bindings, 352 top-level, **none missing** |
| `node tools/combo-harness.mjs check research/combos.json` | **784/784 clean**, 0 collisions, 0 over-used frames |

Also worth knowing: `test/smoke-phone.mjs` declares itself non-functional in
its own header. It drives the archived v2 page and calls `buildShards()` /
`weave()`, both removed in the August 13 cleanup. Phone-viewport coverage is a
rewrite, not a run.

## 2. `combos-goldset.json` does not exist

`GENERATION.md` §5b.2 and §4 both reference it. It is not on disk, which made
the gold eval unrunnable until the eight originals were recovered from the
approved reading HTMLs in `Star Shard v3 Build Plan/uploads/`.

Recovered set: `run/gold/goldset-recovered.json` (address-keyed, 8 entries).
**Commit it under the documented name so §5b.2 is repeatable.** This is the
same shape of loss `GENERATION.md` §4g exists to prevent: the expensive thing
lived only in a scratch file.

## 3. The calendar gate, once Design settles the rule

An eleventh gate in `tools/combo-harness.mjs` (Design owns the corpus side,
you own what ships it): flag any **second-person sentence asserting elapsed
years**. It would have caught 557 sentences across 367 cells before a human
read one.

Pair it with a positive instruction, per §4c's own lesson that a bare ban
produces a paraphrase rather than a better sentence: *duration may be shown in
the scene, never asserted about the reader.* "the birthdays were done
properly" passes; "for thirty years" does not.

Detail and counts: `research/gold-eval.md` §3.

## 4. The four contracts

Decision from this session: Star Shard and Manzil stay **one repo, one
account, one entitlement**, with Manzil as a door on the nightly page rather
than a second app. That decision is only durable if the seam is enforced, so
it should be written down before Manzil moves out of the design prototype and
into the app.

**Manzil may depend on exactly four things and nothing else:**

1. `ephemeris`: tonight's mansion and the true planet positions
2. `chart`: which mansions the user's lights occupy, hence their owned cards
3. `account`: entitlement and saved state
4. `canon`: the 28 names, values and art

No other import in either direction. In particular, if Manzil ever imports the
reading corpus or the sigil renderer, the option to split the products later
dies quietly. The prototype currently honours this (three localStorage keys
plus `window.ManzilEphem`), so this is a rule to preserve, not one to
retrofit.

## 5. The MVP path is unchanged

Still yours, still in this order: **server-side entitlement** (the paywall is
`setState({owned: true})` today, and a localStorage entitlement is forgeable
and evicted by Safari under storage pressure), **merchant-of-record web
checkout**, then the **Full Reading page** (`reading.js`'s `fullReading()` is
built and tested and renders nowhere).

The Capacitor wrapper is a separate project, not a prerequisite for charging
money.

## 6. Receipts from this session

- The Build Plan folder is consolidated. `Star Shard v3 Build Plan` is
  canonical again and matches the 20 Aug export **byte for byte across all 36
  non-upload files**. `Star Shard v3 Build Plan (1)` was moved to
  `_to_delete/`, not deleted.
- Three byte-identical duplicates (`ephemeris2.js`, `manzil-art2.js`,
  `research/support.js`) verified by hash and parked in
  `_to_delete/build-plan-dupes-20aug/`.
- `research/gold-eval.md` cited the `(1)` path; corrected to the canonical
  folder and verified to resolve.
- New this session, none of it wired into the app:
  `research/manzil_sim_shape.py`, `research/manzil-loop/` drivers,
  `research/gold-eval.md`, `run/gold/`.
