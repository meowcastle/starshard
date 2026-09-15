# DESIGN-HANDOFF.md — what to give Claude Design

**v2 · August 13, 2026.** Ten files. Not sixteen.

> **⚠ Merge target: `Star Shard v3.dc.html`.** That's the live page.
> There is no `Star Shard v2.dc.html` — the repo has
> `Star Shard v2 (archived).dc.html`, the retired pre-reboot page kept
> as reference only. Do not merge into it.

## Read order (Aug 15)

**`CHART-BUILDER.md` first now.** The Star Shard reading is the product's
centrepiece and its layout is specified there, along with the three new
components. Then `APP-FRAMEWORK.md` for the shell it sits in, then
`UI-PRINCIPLES.md` for the laws.

Eight worked example readings ship alongside as HTML. **They are the
spec.** Where a document and an example disagree, the example wins — it
was built from real charts through the shipped modules.

---

## Read order (Aug 14 — superseded above)

**`APP-FRAMEWORK.md` first, then `UI-PRINCIPLES.md`, then everything else.**
The navigation model changed: the app is moving from twelve full-page
state gates to **three persistent tabs**. Every other file in the packet
describes screens; those two describe the shell the screens now live in,
and a screen designed against the old shell will have to be redone.

**Build from `Star Shard v3.dc.html`. Do not start a new file.** The
numbers, so this isn't a matter of taste: the file is 1,638 lines —
915 of screen markup, 721 of seam, 207 live bindings, plus the helmet and
the token layer. **The broken part is 14 lines.** That is the whole
screen-state machine. Starting fresh would discard 207 binding names and
every merged screen body in order to replace fourteen lines.

**Do the tab bar first, before any screen work.** Not because it's the
biggest change — because once three persistent destinations exist, every
later decision is forced into the new model. Left until last, the wizard
survives the redesign.

---

## What this is (say this first, in the prompt)

**Star Shard is a JavaScript game anchored in real astrology.** Not an
astrology app with game elements — a game whose systems happen to be
computed from the actual sky. Today it has one loop (arrive, get your
shard, come back nightly); minigames that surface shards come later.
Design decisions break toward *game*: motion, reward, a hero object on
screen, an interface that behaves rather than a document that sits.

The runner and the intro animation are the tonal reference. They're the
only two things that already feel right.

## The packet

| # | File | Why |
|---|---|---|
| 1 | **`UX-FLOW.md`** | the screens, in order, with the visual direction (CRT/terminal, dark-first) |
| 2 | **`PRODUCT.md`** | the two surfaces after arrival: the Deep Chart (five tabs) and the daily/weekly |
| 3 | **`research/corpus-arrival.md`** | every word of the front door, final |
| 4 | **`research/corpus-chart-daily.md`** | the Deep Chart and Daily copy — houses, aspects, special nights, fallbacks |
| 5 | **`DESIGN-SYSTEM.md`** | palette, type, contrast floors — still the law, now applied dark-first |
| 6 | **`research/mansions-table.json`** | card data: epithets, kanji, real asterisms, guardian animals |
| 7 | **`OWNERSHIP.md` + `BINDINGS.md`** | the seam contract |
| 8 | **`WRITING.md`** | the copy law — read before writing a single string |
| 9 | **`UI-PRINCIPLES.md`** | **new Aug 14** — the object model, the tonight diagnosis, Apple's current rules. The *why* |
| 10 | **`APP-FRAMEWORK.md`** | **new Aug 14** — the map, the three screen archetypes, the eleven components. The *what to build* |
| 11 | **`CHART-BUILDER.md`** | **new Aug 15** — the Star Shard blueprint. Five components, three of them new. **The centrepiece surface** |

**Do not send:** COSMOLOGY, INSTRUMENT, ANCHORS, SIGIL-READING,
BLUEPRINT, PORT-SPEC, the station corpus, the research reports. That's
the writers' and engineers' layer. Design needs screens, copy, tokens,
and the contract — sending the cosmology invites a mood board when what
we need is an interface.

## The five things to get right

1. **The ring is the hero.** Every screen has it. It draws itself, it
   accrues light, it's the share artifact at every stage.
2. **Instrument, not journal.** Monospace for every number; Baloo 2 for
   headlines. That pairing is the whole voice. No paper texture, no
   serif body, no ruled lines.
3. **The compute readout is a feature.** Real values printing as they
   resolve, not a spinner.
4. **Progressive disclosure everywhere.** Plain fact → the reading →
   `where this comes from ▾`. The scholarship is opt-in, always.
5. **Nothing fades in.** Things draw, type, ignite. Respect
   `prefers-reduced-motion` with instant-draw fallbacks.

## Money (decided — tell Design, it changes the UI)

**One-time unlock, plus cosmetics. No microtransactions, ever.**

- The **arrival and the Deep Chart are free** — they're the proof and
  the share.
- **One purchase** unlocks the ongoing game: the nightly loop's full
  depth, the daily and weekly readings, the codex. One price, owned
  forever, no subscription.
- **Cosmetics are the only recurring surface**: ring skins, card backs,
  art by Suyin, seasonal frames. Bought because they're beautiful,
  never because they're an advantage.
- **Nothing that affects collection is purchasable.** No paid pulls, no
  currency, no timers to skip. The sky is the drop table and it can't
  be bought. This isn't only ethics — a quarter of the audience is
  13–17, and a one-time price with cosmetic extras is the model that
  survives that scrutiny.

**UI consequence:** there is no shop tab in the main loop. Cosmetics
live in the codex, next to the thing they decorate. No prices in the
reading flow, ever.

## The vocabulary retirement (Aug 14 — do this at merge)

`WRITING.md` gained a **vocabulary budget**: one new noun per surface,
everything else in free astrology vocabulary. Eight coined terms are
retired from user-facing strings because each renames something that
already has a free name. They stay valid as internal identifiers — this
is about strings a traveler reads, not symbols in the code.

**The corpus never leaked any of them.** Every occurrence is in markup,
and it is seven strings total.

`Star Shard v3.dc.html` — **live, 2 strings**:

| line | from | to |
|---|---|---|
| 451 | `tonight the lantern stands in` | `tonight the moon stands in` |
| 716 | `{{ sndStepName }} · the lantern stands here tonight` | `{{ sndStepName }} · the moon stands here tonight` |

`Star Shard - Night Loop (hi-fi).dc.html` — **unmerged, 5 strings.**
Catch these before the merge or they arrive as seventeen:

| from | to |
|---|---|
| `☾ THE LANTERN, TONIGHT` | `☾ THE MOON, TONIGHT` |
| `tonight the lantern stands in` | `tonight the moon stands in` |
| `where the lantern came from, where it goes next` | `where the moon came from, where it goes next` |
| `the lantern is in the last quarter of this step. tonight reads as a pair.` | `the moon is in the last quarter of this station. tonight reads as a pair.` |
| `The Void · dwelling is lit on your ring. three steps left in this arc — the lantern comes back in 27 nights.` | `The Void is lit on your ring. three nights left in this stretch — the moon comes back in 27.` |

**Keep the four position words** — *entering, dwelling, turning,
leaving*. They're ordinary English describing where something is. The
category label "Step" is the jargon; the values aren't. `sndStepName`
keeps its name and keeps rendering.

**The three nouns that survive, one per surface:** *shard* (arrival),
*station* (night loop), *the Becoming* (Deep Chart). If a fourth coined
word appears in a layout, it's a bug in the copy, not a gap — raise it.

---

## Copy is final; layout should fit it

Every string for every screen now exists in the two corpus files. **Do
not write placeholder copy** — use the real text, and if a slot looks
empty in the manifest, it's because it doesn't exist yet and should be
raised rather than filled. Copy may still be sharpened after handoff,
but it will be **slot-stable**: same IDs, same count, lengths within
±15%, so nothing reflows.

## This ships as an app, not just a page

`PLATFORM.md` has the reasoning; what it means for your layout:

- **Design for standalone display mode.** No browser chrome means **no
  browser back button** — every screen needs its own way back, in the
  layout.
- **Safe areas.** Respect `env(safe-area-inset-*)` top and bottom. The
  ring must not sit under a notch, and the primary CTA must not sit
  under the home indicator.
- **No hover states.** Touch only. Every interactive element needs a
  visible *active/pressed* state instead.
- **The push-permission prompt is a designed moment.** It should be
  asked *after* the shard is revealed — never on launch — with one
  screen explaining what the nightly reminder is. Getting denied here
  costs us the retention loop, so this screen matters as much as the
  reading.
- **Dark status bar** styling, and app icon + splash at the usual iOS
  sizes.
- 44px tap targets (already in the brief, now load-bearing).

Nothing else changes. Same markup, same bindings, same corpus — the
wrapper is a packaging step Code handles.

## The writing law

`WRITING.md` — one page, and it applies to every string in the export.
Short version: **show it, don't introduce it.** If a line's job is to
prepare the reader for the next line, cut it. Placeholder copy that
explains itself will get rewritten, so leave copy slots empty rather
than filling them with lorem that sets a wrong rhythm.

## Handing back

Binding manifest (every `{{ name }}`, per surface), confirmation the
`<helmet>` meta survived, confirmation no engine module was imported.
`npm run bindings` runs on receipt.
