# Handoff: Code, 24 August 2026

The account walkthrough for Manzil's new signup gate, specified for privacy and child
safety rather than for the shortest path. Justin's calls from the 24 Aug session are
folded in. **Nothing below has been built. `CLAUDE.md`'s Privacy invariant was rewritten
this session and is the only file this handoff has already touched.**

**Paths.** Relative to the **starshard.net repo root**, not the Build Plan folder. Both
have a `research/` directory and they are different.

**Read first.** `CLAUDE.md`'s rewritten Privacy invariant, and its W6 escalation. This
document is the implementation of both.

**Copy discipline.** Every string in §8 is product copy: no em dashes, lowercase, Manzil's
voice. Prose in this document is internal and unconstrained.

---

## 0. The one-line summary

Ask for the birth data first and the account second, gate at 16 server-side, store five
integers instead of a birth certificate, and keep the raw birth data out of the free game
entirely. Everything else follows from those four.

---

## 1. The flow, screen by screen

Four steps. A user who fails step 2 never reaches step 3, which is the entire point of the
ordering.

### Step 1 — the cast (Design owns the screen)

Birth date required. Birth time optional, with the existing "i don't know my birth time"
toggle. Place optional and free-text, no geocoding in Manzil.

This is **not** presented as a signup step. It is the existing `birthCastTap` flow and it
should keep reading as "cast your five", because that framing is why people give you birth
data at all. The account ask comes after they have seen their cards.

The cast happens client-side in `_saveBirth` (`manzil/index.html:2318`) exactly as it does
today, producing `five`, `rows`, `fill` and the twelve-card `pack`.

### Step 2 — the gate (Code owns, server-side, no screen)

`POST /api/auth/age-check` with the birth date. The server computes age and answers
`{ ok: true }` or `{ ok: false }`. **Nothing is persisted either way.**

- Under 16: the client shows the copy in §8 and stops. Write `starshard-age-fail` to
  `localStorage` so a refresh does not present a fresh empty field to retype. This is the
  documented reasonable-effort standard, not a real barrier, and that is fine.
- **Do not** store the failure server-side. Recording that a specific child tried to sign
  up is collecting data about a child, which is the thing being avoided.
- **Do not** let the client decide this. A client-side age check is not a gate.

### Step 3 — the account (Design owns the screen)

Username, email, password. Three fields, nothing else. No real name field, now or ever.

`POST /api/auth/signup` carries username, email, password, the birth date **again** (the
server re-checks it, never trusting that step 2 happened), and `five` + `pack`.

On success the server writes `users` and the new `manzil_pack` row. It does **not** write
`birth_data`. See §2.

### Step 4 — into the game

Session cookie set, straight to the menu. No email verification wall here: see §5.

---

## 2. What the server stores, and what it does not

This is the substantive change and it is the one that needs Justin's sign-off before it is
built, because it contradicts what shipped earlier today.

**Today:** `POST /api/auth/signup` requires `birthDate` and writes `users` + `birth_data`
in a transaction.

**Specified:** two tiers, because the two products need different things.

| | Manzil (free, the funnel) | Star Shard readings (opted in) |
|---|---|---|
| stores | `five`, `pack`, username, email, password hash | full `birth_data`, encrypted |
| written | at signup | when the user asks for a reading |
| needs | five integers 1-28 | exact positions, forever, for nightly transits |

The justification is in the code. `_chartFive()` reads `b.five` and nothing else, so
**Manzil's entire dependency on the birth chart is five integers between 1 and 28.**
Mansions are ecliptic-longitude buckets, so storing only `five` destroys birth time and
birth place completely and degrades birth date to a candidate set. That is a real
reduction in blast radius, not a cosmetic one.

It is **pseudonymisation, not anonymisation.** `five` is still personal data under GDPR and
still carries export and erasure obligations. The gain is that a full dump of the free
game's database is not a dump of birth certificates.

`birth_data` stays exactly as schema'd, keeps `PUT /api/me/birth`, and gets written on the
Star Shard side when a user wants the reading. Encrypt the columns at the application
layer, key in the environment or a KMS, never in the database. Disk-level encryption alone
protects against drive theft and nothing else that will actually happen.

**New table:**

```sql
CREATE TABLE IF NOT EXISTS manzil_pack (
  user_id INT NOT NULL PRIMARY KEY,
  five_json VARCHAR(64) NOT NULL,      -- [1,7,12,19,25]
  pack_json VARCHAR(128) NOT NULL,     -- the twelve
  birth_year SMALLINT UNSIGNED NULL,   -- age re-derivation only, never a full date
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_manzil_pack_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Per the rewritten Privacy invariant, this table carries `ON DELETE CASCADE` **and** must
appear in `GET /api/me/export`. One without the other is a bug, not a follow-up.

---

## 3. The age gate

**Sixteen, globally, no geolocation.**

The reasoning, so nobody re-opens it casually. The GDPR digital age of consent varies from
13 to 16 by member state (9 countries at 13, 6 at 14, 4 at 15, 9 at 16). Gating at 13 means
owning that table forever, watching it change, and handling VPNs and travel. Gating at 16
is one number and clears every jurisdiction at once. Under-16s cannot complete the $19-24
purchase regardless, because Apple's Ask to Buy routes it to a parent.

**The cost is real:** roughly a quarter of the audience is 13-17, so a 16 gate removes
perhaps 15% of the people from the surface whose entire job is to circulate. Justin has the
number and made the call with it in front of him.

A gate is easy to lower and painful to raise. Ship 16.

Implementation notes:

- Compute against UTC date, not local, so the boundary is deterministic.
- The date field must be neutral. Not "you must be 16 to continue" above an empty box,
  which just teaches people what to type.
- `CF-IPCountry` is available free at the edge once the static site is on Cloudflare. Do
  not wire it into the gate. It is there for the day the gate is *relaxed* by region, which
  is a deliberate future decision, not this one.

---

## 4. Endpoint changes against current `server.js`

| endpoint | change |
|---|---|
| `POST /api/auth/age-check` | **new.** Birth date in, `{ok}` out, rate-limited like signup, nothing persisted |
| `POST /api/auth/signup` | re-check age server-side and reject under 16; stop writing `birth_data`; write `manzil_pack` instead; keep the transaction |
| `POST /api/auth/forgot-password` | confirm it returns an identical response whether or not the email exists. Enumeration here leaks who has an account |
| `GET /api/me/export` | add `manzil_pack` |
| `DELETE /api/me` | verify the cascade reaches `manzil_pack`; add a test that asserts zero rows across every user-scoped table |
| `PUT /api/me/birth` | unchanged, becomes the Star Shard opt-in path |
| lobby | already rejects sockets without a valid session cookie. Good. Add the username join, then read §6 before shipping it |

---

## 5. Password, session, email

Mostly already right. The gaps:

- **bcrypt cost 12** is fine, leave it.
- **`token_version` must increment on password change and on reset**, so a reset kicks
  every existing session. Confirm it does.
- **Session cookie:** `HttpOnly`, `Secure`, `SameSite=Lax`, and a sane `maxAge`. Confirm
  all four in `setSessionCookie`.
- **Email verification is still missing** (`CLAUDE.md` W6). Do not put it in front of play.
  Verify lazily: let them play immediately, and require a verified address before the first
  outbound email and before any purchase. That keeps the funnel intact while making sure
  the nightly email never ships to an address nobody owns.
- **Rate limiting** exists on every auth route. Add one for `age-check`.

---

## 6. Multiplayer safety, before the username goes live

The lobby matches strangers. With a 16+ floor there are still 16 and 17 year olds in it, so
these are not optional.

1. **No free-text channel between players. Ever.** There is no chat today. Keeping it that
   way is the single largest child-safety decision available in a matched-strangers game,
   and it costs nothing because the game does not need one. If an emote set is ever wanted,
   it is a fixed vocabulary, not text.
2. **The username becomes public the moment it is joined into `matched`.** `manzil-lobby.js:65`
   returns `displayName: null` for logged-in users today. When that is filled in:
   - never seed it from the email local-part; plenty of addresses are `firstname.lastname@`
   - the signup copy must say it will be shown to opponents, before they choose it
   - reserve `admin`, `mod`, `staff`, `starshard`, `manzil` and near-misses
   - run it through a profanity filter at signup, not at display time
3. **Report and block.** A minimum viable version is a report button on the match screen
   writing to a table with the match id and the reporting user, plus a block list the
   matchmaker skips. Ship it with the username, not after.
4. **No discovery by email.** There is no user search today. Do not add one.

---

## 7. The obligations, which are now code

From the rewritten Privacy invariant. All of these must exist before wide launch, and three
of them are UI, not API:

- **Delete and export reachable in the interface.** The endpoints exist; the buttons do
  not. App Store review 5.1.1(v) requires in-app deletion and will reject without it.
- **Privacy policy** naming birth data explicitly, with a **written retention policy
  published inside it** (this is a hard requirement of the amended COPPA rule, in force
  since 22 April 2026).
- **Terms of service.**
- **No product copy anywhere may say birth data stays in the browser.** It is now false,
  and a false privacy claim is an FTC Section 5 problem independent of everything else.
  `OWNERSHIP.md`, `DESIGN-BRIEF.md` and `docs/archive/REVIEW.md` still carry the old
  phrasing and need editing.

---

## 8. Copy

Product copy. No em dashes, lowercase, Manzil's register.

**Step 1, unchanged from today.** "cast your five".

**Step 2 failure.**

> the moon keeps her houses for you. come back when you are sixteen.

That is the whole message. No "sorry", no explanation of data law, no field to retry into.

**Step 3, above the fields.**

> your five are cast. name yourself and they are kept.

**Username helper, and this one is load-bearing.**

> lowercase letters, numbers and underscores. other players will see this, so pick a name and not your name.

**Email helper.**

> for your road back in if you lose the password. nothing else without asking.

**Password helper.**

> eight characters at least.

---

## 9. Ownership

- **Design owns** the two screens (`manzil/index.html`, a `.dc.html` artifact) and the copy
  placement. Per `CLAUDE.md`, Code does not hand-edit that file.
- **Code owns** everything in §2 through §7: the endpoints, the table, the gate, the
  lobby's username join, report and block.
- **Sequencing.** The `-2` script fix and any other Code work in `manzil/index.html` must
  land *before* the Design handoff for these screens goes out, not during. Two agents in one
  file in one cycle is the failure this rule exists to prevent.

---

## 10. Open, and needing Justin rather than Code

1. **§2's two-tier model contradicts what shipped this morning.** Signup currently writes
   `birth_data`. Confirm the split before rebuilding the transaction.
2. **Whether the 16 gate is worth ~15% of the funnel.** Recommended yes, but it is his call
   and it is reversible downward.
3. **Whether Manzil is gated at the door at all.** Both the conversion argument and the
   legal argument point at asking for the account *after* the first climb rather than
   before it, because every obligation in this document attaches at account creation and
   none of them attach at play. That is a larger change than this handoff and it is not
   assumed anywhere above, which is deliberate: this document specifies the gated version
   he asked for, built as safely as it can be built.
