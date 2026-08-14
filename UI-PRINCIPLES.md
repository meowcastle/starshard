# UI-PRINCIPLES.md — how this app is built

**v1 · August 14, 2026.** Binding on Claude Design. Supersedes nothing;
sits under `DESIGN-SYSTEM.md` (tokens) and `WRITING.md` (strings) and
answers the question neither does: **what goes where, and why.**

Sourced from Apple's current HIG, the interaction-design canon, and
teardowns of the apps that solve our exact problem. Every rule below is
here because it is currently broken, not because it is famous.

---

## 0. The object model — the bug, and the fix

> Justin, Aug 14: *"your star shard is also called your ring? super
> confusing. your reading is your star shard. what is the ring?"*

He is describing a real defect, and it is bigger than a synonym.

**What the shipped system image actually claims:**

| string on screen | what it points at |
|---|---|
| "your star shard" | the whole natal object |
| **"shard"** (tab 1 of 5) | **one section of the chart** |
| "your ring" | the 28-segment graphic |
| "your chart" | the container holding the five tabs |

So **shard names two different things at two different scales**, and one
circular graphic carries two names. Norman's rule is that the system
image is the *only* channel to the user — *"because designers cannot
communicate directly with users, the entire burden of communication is on
the system image."* A user cannot build a working model out of that, and
we have no second channel to correct it with.

### The resolution — three nouns, and no more

**1. Your Star Shard.** The object the app makes for you. **The ring is
not a second object; it is the shard's shape.** A shard of a star, drawn
as twenty-eight segments, dark at first, lighting one station at a time.
The word *ring* never appears in a user-facing string again — it survives
only as geometry vocabulary in code (`ringSegments`, `ringTicks`).

**2. Your chart.** The reference document underneath the shard. A
destination, titled **your chart**, reached by a control labelled **your
chart**. (Smith & Mosier 2.0/14, 1986: *"The title of a display should be
identical to the menu option used to request that display."*)

**3. Tonight's station.** The collectible.

That is the entire noun inventory. It matches `WRITING.md`'s vocabulary
budget exactly — one new noun per surface — and it survives the recall
test: ask a user what the thing is called *after* they've used it, and if
they produce a word our UI doesn't use, our system image is teaching the
wrong model.

### The substitutions

| # | from | to |
|---|---|---|
| 1 | `your ring is dark. it lights one segment at a time, and only by walking.` | `your shard is dark. it lights one station at a time, and only by walking.` |
| 2 | `see my ring →` | `see my shard →` |
| 3 | `{{ sndClaimEpithet }} · {{ sndClaimStepName }} is lit on your ring.` | `… is lit on your shard.` |
| 4 | `a station you aren't there for stays dark — the ring only lights by being walked.` | `… — the shard only lights by being walked.` |
| 5 | `aria-label="your ring, with tonight's crossing lit"` | `aria-label="your star shard, with tonight's station lit"` |

And two tab renames, because a tab may not be named after the object that
contains it, and because `depth` describes our filing system rather than
its contents:

| tab | from | to | why |
|---|---|---|---|
| 1 | `shard` | **`sky`** | it is the sun / moon / rising summary. The shard is the whole thing, not this tab |
| 4 | `depth` | **`traditions`** | it holds what Arabia, India, China and Europe each saw. Say so |

`houses` · `pattern` · `becoming` stay. Free vocabulary, plus our one
spent coined noun.

---

## 1. The laws, ranked by what is currently broken

**1. The system image is the only channel.** (Norman, *DOET*.) Every
naming inconsistency installs a wrong mental model that we then cannot
reach. Before any screen ships: enumerate the nouns in the data model,
enumerate the nouns in the strings, and require a bijection.

**2. One region is one thing.** (Gestalt; strength order is **enclosure >
proximity > similarity** — common region "can overpower other grouping
principles.") Two cards of equal visual weight declare two objects of
equal importance, and users will hunt for the difference between them.

**3. Signifiers, not affordances.** (Norman, *Interactions* 2008 —
*"Forget affordances: provide signifiers."*) A touchscreen affords
touching everywhere, so the affordance carries **zero information**. Every
discoverability decision in this app is a signifier decision. Co–Star's
chart placements are tappable and signalled only by "a subtle darkening";
users report never finding them.

**4. Progressive disclosure splits by frequency, never by skill.** (Nielsen.)
Most people are *perpetual intermediates* and never graduate. **Two levels
maximum** — *"each additional level multiplies clicks and halves
discoverability."* And the bright line: **state, cost, permissions and
risk always live at level 1.** Against this, Tognazzini's standing
objection: *hidden complexity increases perceived complexity* — hide it
"only in showrooms, not in actual use."

**5. "Less, but better" — not less.** Rams' phrase is *Weniger, aber
besser*, and principle 10 reads *"concentrates on the essential aspects,
and the products are not burdened with non-essentials."* The reduction is
of **non-essentials**. Cutting something the reader needs is not less-but-
better, it is just less. (Rams' own caveat, 2015: *"I didn't intend these
10 points to be set in stone forever… I'm actually very surprised that
people today, especially students, still accept them."* Treat them as
questions, not a scorecard.)

**6. Honest** (Rams 5): *"It does not make a product more innovative,
powerful or valuable than it really is."* No manufactured urgency, no
capability theatre, no label implying personalisation we didn't compute.
This is already our ethics floor; it is also a design law.

**7. Unobtrusive** (Rams 5 — note it is 5, and honest is 6; they are
routinely swapped): *"Products fulfilling a purpose are like tools. They
are neither decorative objects nor works of art. Their design should
therefore be both neutral and restrained, to leave room for the user's
self-expression."* The reading is the figure. Everything else recedes.

---

## 2. The daily is a five-screen wizard

Before any of the layout critique below: **the nightly reading is paginated
across five modal screens.** `sndIsBeat0` … `sndIsBeat4`, with `sndPips`
progress dots and three `next ✦` buttons between them. To read ninety
words, a returning traveler does this:

```
   land on tonight
→  tap "walk tonight's crossing ☾"
→  beat 1 · the station        next ✦
→  beat 2 · the cast           next ✦
→  beat 3 · the counsel        next ✦     ← the reading is here
→  beat 4 · the question
→  beat 5 · the claim          claim
→  "see my ring →" / "done"
```

**Five screens and four taps, every night, forever — for content that
fits on one.** This is what "the function of the daily reading is
terrible" means, and no amount of restyling touches it.

Krug's second law is often misread as "clicks don't matter." What he
actually wrote is *"it doesn't matter how many times I have to click,
**as long as each click is a mindless, unambiguous choice**."* A `next ✦`
that reveals the next fragment of a paragraph is not a choice at all —
it is a **pagination tax** on a single screen of text. And Apple's
modality rule bites: *"aim to keep modal tasks simple, short, and
streamlined"*; *"avoid creating a modal experience that feels like an app
within your app."*

Every app in the field study that works does the opposite. Wordle's grid
**is** the launch screen. grug's wisdom **is** the screen — and it won an
Apple Design Award two months ago. WHOOP: *"just the answer."*

**The ceremony is not wrong. It is in the wrong place.**

A paced, beat-by-beat reveal is exactly right for something that happens
**once** — which is why `SIGIL-READING.md`'s nine-beat arrival grammar is
good design. It is exactly wrong for something that happens **365 times a
year.** The rule:

> **Ceremony scales inversely with frequency.**
> Arrival is once: pace it. Tonight is nightly: one screen.
> The rare night earns the ceremony back — and that is what makes it feel rare.

Three consequences:

1. **Compose the five beats into one page.** They stay as *content*; they
   stop being *navigation*. Nothing is cut.
2. **Keep the paced reveal for threshold nights only** — the four special
   crossings (`NIGHT.sun`, `NIGHT.moon`, `NIGHT.rising`, `NIGHT.becoming`,
   roughly once a month each) and the rare threshold cast. When the
   ceremony is reserved, its appearance is itself the signal that tonight
   is different. Used nightly, it signals nothing.
3. **Delete every `beat N ·` label** regardless. They are our internal
   function names printed on the user's screen.

---

## 2b. The tonight screen — diagnosis

This is what Justin means by *"from a UI experience terrible."* Here is
the shipped DOM order, top to bottom:

```
1  eyebrow    tonight's crossing            ← our jargon
2  link       your chart →                  ← text link, top-right
3  tabs       tonight | this week
4  svg        the shard, 210px
5  eyebrow    {{ sndStepName }}             ← "dwelling"
6  h1         {{ sndStationEpithet }}       ← "The Void"
7  muted      {{ sndCastFlavor }}
8  mono       next crossing in {{ countdown }}
9  card       ┌ the counsel
10 p          │ {{ sndCounselBody }}        ← ★ THE READING ★
11 button     walk tonight's crossing ☾
12 card       ┌ ✦ kindled tonight
13 p          │ epithet · stepname
14 button     share my shard
```

**Six structural failures:**

**a) The reading is the tenth element.** Everything above it is
apparatus. Co–Star's single most-cited interface criticism is that new
users *cannot find their horoscope* and must learn the layout by
repetition — that is precisely this bug, and we have it worse because we
also lead with a 210px graphic. Compare WHOOP: the answer renders at
**~72pt at the top**, and the critique's line is *"Just the answer. No
graphs, no charts, no noise."*

**b) The screen answers no question.** Every home screen that works
answers one, and it is a verb. WHOOP: *how should I train today?*
Dark Sky: *do I need an umbrella in the next hour?* Duolingo: *here's
your next step.* Ours opens with a step name and an epithet — two nouns
from our private vocabulary — which is a *state report*, not an answer.

**c) Two equal cards declare two equal things.** "the counsel" and
"✦ kindled tonight" are the same component at the same weight. The second
is a **receipt**, not a peer. Gestalt says we have announced two objects.

**d) We are printing the composer's architecture on screen.** The night
loop currently renders `beat 1 · the station`, `beat 2 · the cast`,
`beat 3 · the counsel`, `beat 4 · the question`, `beat 5 · the claim`.
Those are *our internal function names*. They are the purest possible
violation of both the fourth-wall law and Nielsen #2 (*"speak the users'
language… rather than internal jargon"*). **Delete every beat label.**

**e) "walk tonight's crossing ☾" is a metaphor where a verb belongs.**
Krug's test is that the screen be **self-evident**. The primary action
should say what it does.

**f) The counsel body is the same for everyone.** `sndCounselBody` is
`station.dailyCrossing` — a fixed line per station, identical for every
user on Earth, under an eyebrow reading "the counsel" that implies it was
written for them. That is Rams 6. It is fixed by wiring `transits.js`
(Code item 1), not by design.

## 2c. The tonight screen — the shape it should be

Three tiers with **visible boundaries**, which is the pattern both Oura
and WHOOP converged on independently (Oura collapsed five tabs to three;
WHOOP's is score → trend → raw). Each tier answers a *different question*
and the user always knows which tier they are in.

```
TIER 1 — the answer                        (always visible, no scroll)
  the reading itself, large, the first thing on the page
  one line naming what it was drawn from, and that line is the link down
  ─────────────────────────────────────────
TIER 2 — tonight's sky                     (one scroll)
  the shard, lit to tonight's station
  the station, its name, what it is
  the claim — a receipt, subordinate, not a card
  ─────────────────────────────────────────
TIER 3 — the numbers                       (opt-in, one level, never two)
  the orb in degrees, the planet, the natal point
```

**Rules for it:**

1. **The reading is the page, not a card.** 60–90 words is one screen at
   generous size. A card in a stack of cards says *this is one of several
   things*, which contradicts having one primary daily action. grug — an
   Apple Design Award winner two months ago, one piece of wisdom per
   sunrise — makes the text the screen. So does Co–Star, whose *only*
   undisputed success is tone.
2. **Exactly one affordance downward, and it must be specific.** Not
   "view your chart" — name the placement: *"your moon in the 8th →"*.

   **Correction, Aug 14: it is a push, not a tab switch.** My original
   wording ("tapping straight to that section") sent it into the chart
   tab, which collides with Apple's rule — *"transporting someone to
   another tab by tapping on an element within a view is jarring and
   disorienting."* The link **pushes a single-placement view onto
   tonight's own stack**; that pushed view may offer *see the whole
   chart →* at its foot. Drill-down preserves the destination the
   traveler chose. Duplicating one house passage across two contexts is
   normal and costs nothing.

   And the label itself: *"this came from…"* is the labelling tic
   `WRITING.md` bans. The line is **`your moon in the 8th →`**, no
   preamble. This is the fix for The Pattern's most-
   repeated complaint (*"there's no way to see the astrological info"*)
   and it is the highest-value single link in the product — it converts a
   90-word reading from a dead end into the front door of a document.
3. **Depth expands in place.** Dark Sky's most-praised property was that
   *"the system expanded rather than jumping to new screens, maintaining
   context throughout."* Where it must navigate, animate to preserve
   spatial position (WHOOP).
4. **Deliberate imprecision on tier 1.** Dark Sky said "light / medium /
   heavy," never "0.25 inches," and was celebrated for it. We compute
   orbs to a decimal; **they belong in tier 3.** The weekly is the
   exception — there, an exact `0.0°` is the point (`PRODUCT.md` §6b
   beat 2), because it is rare and time-bound.
5. **The claim is a receipt.** Subordinate type, no enclosure, no second
   card.
6. **A rendered end-state.** After tonight's station is walked, the
   screen must visibly become *finished*, with the next arrival named and
   a countdown — Wordle's post-solve modal is the reference, and it
   resolves to **local midnight**, not a server hour. Ours should resolve
   to the local crossing.

---

## 3. Navigation

**Apple's dividing line, verbatim:** *"Use a tab bar to support
navigation, not to provide actions… If you need to provide controls that
act on elements in the current view, use a toolbar instead."*

Consequences for us:

- **The daily action never goes in the tab bar.** Walking tonight's
  station is an action.
- **`tonight | this week` is a segmented control, not tabs.** It switches
  a view within one destination. Correct as built.
- **`your chart →` as a top-right text link is Co–Star's exact failure.**
  Their entire navigation is two small text links in the top corners, and
  the documented result is that users don't find the chart. If tonight
  and your chart are the two top-level destinations, they are a **tab
  bar**, and Apple requires it to *stay visible* — *"If you hide the tab
  bar, people can forget which area of the app they're in."*
- **Your chart is a navigation stack, not a sheet.** Apple: *"avoid
  creating a modal experience that feels like an app within your app…
  If a modal task must contain subviews, provide a single path through
  the hierarchy."* A five-tab browsable document is not a single path.
- **Never title a screen with the app name.** *"Your app's name doesn't
  provide useful information about your content hierarchy."* The
  `✧ star shard ✧` eyebrow is decoration where a location cue belongs.

---

## 4. Apple's current rules that bind us

**"Clarity, deference, depth" is dead.** That trio survives only in the
*archived* iOS 7 transition guide. Citing it is a decade stale. The
current framing is **hierarchy, harmony, consistency**, and the operative
doctrine is the two-layer model.

**Liquid Glass — the two-layer model is the load-bearing rule.** Content
layer at the bottom; a floating functional layer of bars, sheets and
controls above it. Apple, verbatim: **"Don't use Liquid Glass in the
content layer."** And: **"Always avoid glass on glass."** And: *"Reduce
the use of toolbar backgrounds and tinted controls… use the content layer
to inform the color and appearance of the toolbar."*

**This is good news for us.** Our CRT/terminal/dark-first direction is a
*content layer* identity — the reading, the shard, the type. It is fully
compatible provided the **chrome is system**: don't hand-roll a custom
tab bar background, don't put a custom visual effect behind sheets, let
`ScrollEdgeEffectStyle` handle the boundary. Every hour spent styling
bars is an hour spent fighting the platform and losing on the next OS.

Also on the stop-list, and we do these: **no ALL-CAPS section headers**
(moved to title-style capitalisation), no hard-coded control metrics, no
unlayered app icon.

**The star-burst intro is not a launch screen.** Apple is blunt: *"A
launch screen isn't part of an onboarding experience or a splash screen,
and it isn't an opportunity for artistic expression."* The intro must run
**after** launch completes, inside onboarding. And the motion law kills
it on repeat: *"don't make people wait for an animation to complete
before they can do anything, **especially if they have to experience the
animation more than once.**"* This is a nightly app. **First run only,
skippable, and never again.**

**Notification permission.** Our plan — ask *after* the shard is revealed,
on its own screen — is exactly Apple's sanctioned exception: *"If your app
needs access… consider integrating the permission request into your
onboarding flow… gives you the opportunity to show people why."* Two hard
constraints on that screen: **one button only**, titled Continue or Next,
with no way to leave without seeing the system alert; and the purpose
string in **sentence case, active voice, ending in a period**.

**The push-permission screen currently breaks the priming rule.** It ships
two buttons — *turn on the nightly reminder* and *not tonight*. Apple's
constraint on a custom screen that precedes the system alert is explicit:
**"Include only one button"**, and *"don't provide a way for people to
leave the screen or window without viewing the system alert."*

That collides with our own ethics floor, which wants a real opt-out for a
13–17 audience. **The resolution is to stop treating it as a priming
screen.** Don't ask on a screen of our own that offers a decline; make the
nightly reminder something the traveler *asks for* — a control on the
tonight screen — so that tapping it is already the affirmative choice, and
the system alert follows immediately with one button behind it. Never
asked is better than asked and declined: a denial is permanent, and it
costs us the loop.

**App Review 4.5.4:** *"Push Notifications must not be required for the
app to function."* Our nightly loop leans on the push. The app has to be
complete without it — which the collection already gives us, since a
missed night is a gap, not a failure.

---

## 5. The numbers

| | value | status |
|---|---|---|
| Tap target | **44×44 pt** design target; 28×28 absolute floor | HIG guidance |
| Body text | **17 pt** default, **11 pt** minimum | HIG |
| Weights | never Ultralight / Thin / Light — *"difficult to read"* | HIG |
| Contrast | **4.5:1** under 17 pt · **3:1** at 18 pt or bold | WCAG AA, Apple "as guidance" |
| Text scaling | must survive **200%** enlargement | HIG |
| Touch target, empirical | **≥9.6 mm** rendered (Parhi et al. 2006); spacing does not rescue an undersized target | research |
| Safe areas | **dynamic — never hard-code.** Only tvOS publishes fixed insets | HIG |
| Prominent buttons per view | **one or two** | HIG |
| Screen title | under 15 characters | HIG |

At the largest accessibility size, *"aim to display as much useful text
as you do at the largest standard font size"* and **keep primary elements
at the top of the view regardless of font size.** For us that means: at
AX5, the reading is still first. Test it.

---

## 6. What we take from the field, and what we refuse

**Take:**

- **The one big thing, physically large.** WHOOP's 72pt score; grug's
  wisdom-as-the-screen.
- **Push carries the full text.** Co–Star's most-warmly-cited decision,
  one per day, complete without opening. It also survives the majority of
  nights nobody opens the app. Timing behaviour-inferred, not user-set —
  Duolingo abandoned user-set times outright because *"life always gets
  in the way."*
- **Colour rationed until every hue means something.** WHOOP: *"Every hue
  carries meaning. There are no arbitrary accent colors."* Dark Sky used
  colour essentially once, for the alert, and animated only when it was
  actually going to rain. **Animation as signal, not decoration** — which
  gives our threshold nights a job to do.
- **Dark is functional, not fashionable.** WHOOP's stated reason is eye
  strain during the early-morning and late-night checks that are when
  people actually open it. We are a *nightly* app. This is not a style
  question.
- **Let the chrome encode the sky.** Sunlitt's background tracks the
  sun's position — *"so when a user opens the app, they 'feel' the sun on
  their screen."* Moonlitt won the 2026 Apple Design Award for
  Interaction on touch feel and haptics, not looks.
- **Collection, not streak.** You cannot fall behind on a collection,
  only be further from complete. If we ever ship a streak, it counts
  **opening** (Finch) — and Duolingo's own data: decoupling the streak
  from goal-completion raised 7-day streaks by **over 40%**.
- **No guilt.** NYT Games — a billion-dollar daily-habit product — ships
  **no streak-loss notifications and no guilt prompts at all.**

**Refuse:**

- **Undiscoverable navigation.** Co–Star: tiny section labels, grey text
  failing contrast, no grid, tap targets signalled by "a subtle
  darkening." The consequence is measurable and it is that people can't
  find the product.
- **The black box.** The Pattern's most repeated complaint. Every night
  must name the placement it drew on and link there.
- **Long undifferentiated scroll.** What Oura redesigned away from. Scroll
  is not hierarchy.
- **Churn on the ritual surface.** *"Why does this app change so
  frequently."* / *"I feel like I just lost a very knowledgeable friend."*
  A ritual surface accrues value from **sameness**. Redesigning tonight
  costs more goodwill than redesigning anything else — so get it right
  now, then leave it alone.

**And the caution that applies uniquely to us:** a 90-word nightly
reading is the highest-frequency, lowest-surface-area channel in this
whole study. The two most damaging complaints across every astrology app
— visible templating, and *"it isn't growing with me"* — will surface in
weeks at this cadence, not months. **The chart is the structural defence.**
It is what lets each night be specific to a named, inspectable placement
instead of a variable substituted into a frame.
