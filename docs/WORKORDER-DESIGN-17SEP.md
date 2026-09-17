# Work order for Design — 17 Sep 2026

Two items. The first is a regression against Design's own standing rule and is
measured, not remembered. The second is new markup that Code cannot write
because it lives in the `.dc.html`.

Neither blocks anything Code is doing. Both block things that matter.

---

## 1. The pre-hydration SVG binding class has regressed

**The rule, which is Design's own (2 Sep):** a bound geometry attribute is
never safe. A mustache inside `d`, `cx`, `cy`, `r`, `x1`, `viewBox` or any
other geometry attribute is invalid to the browser's SVG parse *before* the
runtime hydrates, and the browser logs an error for every one. The fix is a
`style` transform on a wrapping `<g>` with the element at 0,0, or a static
attribute, or routing through `_pathG`.

**What CLAUDE.md records:** 37 → 10, and the last ten are
`<svg viewBox="{{ …artBox }}">` across nine art-wrapper sites, correctly
exempt because `_measureArt()` computes a real per-card `getBBox()` at runtime
and that normalisation is what makes every card read at the same weight.

**What is actually there now, measured in Chromium on the live file
(`Manzil - Game Prototype V2.dc.html`, working-tree copy, 17 Sep):**

> **28 errors across 21 distinct bindings.**

Roughly nine are `artBox` and stay exempt. The rest are raw geometry on shape
elements — the class the 2 Sep sweep closed:

| binding | count |
|---|---|
| `{{ flLineVB }}` | 2 |
| `{{ d.x }}` | 2 |
| `{{ d.y }}` | 2 |
| `{{ ln.d }}` | 1 |
| `{{ sg.d }}` | 1 |
| `{{ rp.x }}` `{{ rp.y }}` `{{ rp.r }}` | 1 each |
| `{{ cdxSunX }}` `{{ cdxSunY }}` `{{ cdxMoonX }}` `{{ cdxMoonY }}` | 1 each |
| `{{ dc.box }}` `{{ yc.box }}` | 1 each |
| `{{ introAr… }}` (viewBox) | 2 |
| `{{ c.artBox }}` `{{ s.artBox }}` `{{ cdxArtBox }}` `{{ dsArtBox }}` `{{ bwCardBox }}` `{{ hc.artBox }}` | the exempt set |

`rp.x` and the codex `<path d>` were already handed back on 13 Sep and are
still open. The rest are newer.

**Why it keeps coming back:** `tools/check-manzil.mjs` treats bound geometry
attributes as **warnings, not failures** — deliberately, because they are
console noise and Design's markup. That was the right call when there were ten
known-exempt ones. It is why nobody noticed twenty-eight.

**Ask:** sweep the non-`artBox` entries above through `_pathG` or a wrapping
`<g>` transform. Then tell Code, and Code will tighten `check-manzil.mjs` to
fail on any bound geometry attribute **outside a named exempt list**, so the
`artBox` nine stay legal and nothing new can land quietly. A warning nobody
reads is the same as no check — this repo's own lesson, twice over.

## 2. Turnstile on signup and the guestbook

**Why.** The guestbook is an unauthenticated public `POST`. Its only current
defence is storing an HMAC of the visitor's IP and letting an admin delete by
that hash afterwards. That is cleanup, not prevention. Signup is likewise open,
in front of an audience this repo documents as skewing 13–17.

**Split of work.** Turnstile is a client widget plus a server-side
`siteverify` call. The widget is markup, so it is Design's. The verification,
the secret, and the failure behaviour are Code's. Code will not add the server
half until the widget exists, because a server that requires a token no client
sends is an outage.

**What Design needs to add**, on the cast/signup form and the guestbook form:

1. `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>`
   in the `<helmet>`.
2. A container at the point of submit:
   `<div class="cf-turnstile" data-sitekey="{{ tsSiteKey }}" data-callback="{{ tsOnToken }}" data-theme="dark"></div>`
3. Two bindings in `renderVals()` for Code to fill: **`tsSiteKey`** (string)
   and **`tsOnToken`** (callback, receives the token string). Code will wire
   both and pass the token to the API.
4. The submit button should be inert until a token exists. Reuse the existing
   `st.busy` pattern (`bCastLabel`/`siLabel`, `pointer-events:none`) rather
   than inventing a second disabled state.

**Two constraints, both learned the hard way here:**

- **Theme it.** The default widget is a light box on a `#040302` page.
- **Do not put the sitekey in the markup as a literal.** It differs between
  the test key and the real one, and a literal is a value Code cannot change
  without a Design cycle. Bind it.

**What Code will do once the bindings land:** verify server-side on
`POST /api/auth/signup` and `POST /api/guestbook`, fail closed with a real
error rather than a silent drop, and keep `express-rate-limit` in place —
Turnstile replaces neither the rate limiter nor the IP hash, it sits in front
of them.

---

## Not asked for, flagged only

`docs/MANZIL-CODE-OWNED-BEHAVIORS.md` is at 44 markers and
`tools/check-manzil.mjs` fails the build if any goes missing, which is working.
The SVG class above is the one category that is checked but not enforced. If
item 1 lands, that gap closes too.

---

## Addendum, 17 Sep evening — Code's half of item 1 is done early

Appended rather than edited.

**The check was not merely lenient about bound geometry attributes — it could not
see most of them.** Its element list was
`rect|circle|line|path|text|ellipse|polygon|polyline`, with **no `svg`**. Since
`<svg viewBox="{{ … }}">` is **15 of the 22** bound geometry attributes in the
file, the check reported 7 where there were 22, which is why the count in §1
above (28 errors, measured in a browser) could disagree with a passing build
without anyone noticing. **A warning you cannot see reads as coverage.**

Fixed in `98b81e8`: `svg` added, and the total is now reported alongside the
per-element split so the number is directly comparable to a console count.

**Still a warning, deliberately.** Tightening to a failure lands when the sweep
does, against a named exempt list — failing today would fail the build on
Design's own known-exempt `artBox` nine. The ask in §1 is unchanged; Code's side
of it is ready.

The marker count referenced under "Not asked for" is now **45**.
