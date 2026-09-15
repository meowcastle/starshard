# The mobile port: landscape-locked, wrapped with Capacitor, and the three things that have to change first

**15 September 2026. Measurement → Code (cc Design).** Scoping note for shipping Manzil as an Android
and an iOS app. Decisions taken by the user on 15 Sep: **landscape-locked**, **Capacitor wrapper**,
**this note before any build**. Everything measured below came from the running staging build.

The short version. The port is smaller than it looks, for one happy reason: **the game is already built
at phone size.** The stage is a fixed 932x430 box scaled by a single CSS transform, and 932x430 is
exactly an iPhone Pro Max viewport rotated to landscape. On a modern phone held sideways the game fits
edge to edge at scale 1.0 with no letterboxing at all. What the port really costs is three things that
have nothing to do with packaging: **type that is too small to read on a phone**, **a build that fetches
its own framework from a CDN and evaluates its logic from a string**, and **safe areas**. Sections 2, 3
and 4.

---

## 1. What the client actually is

| fact | value | why it matters |
|---|---|---|
| stage | fixed **932 x 430** CSS px, one transform scales it to the viewport | no reflow, no breakpoints needed; it letterboxes rather than breaking |
| aspect | **2.167** | modern phones are 19.5:9 (2.167) and 20:9 (2.22): a near-exact match |
| media queries | **2 in the whole app** (`print`, `prefers-reduced-motion`) | there is no responsive layout to port, and none is needed under this decision |
| document | **1.26 MB** of HTML, logic evaluated at runtime by `evalDcLogic` | see 3 |
| scripts | React 18.3.1 + react-dom UMD **from unpkg**, plus own `support.js`, `manzil-art2.js`, `ephemeris2.js`, `socket-io-client.js` | see 3 |
| PWA | **no manifest, no service worker** | nothing to reuse; both have to be written |
| viewport meta | `width=device-width, initial-scale=1` | needs `viewport-fit=cover` added, see 4 |
| back end | `api.staging.starshard.net` + socket.io | needs a per-environment config in the shell |
| sky maths | `ephemeris2.js`, computed on device | good: the night, the moon's house and the chart work offline |

## 2. How the stage lands on real devices

Scale is `min(width/932, height/430)`. Bars are the letterbox. Card is a hand card, measured at 81 stage px.

| device (landscape) | viewport | scale | bars | card | the 9.5px nav label becomes |
|---|---|---|---|---|---|
| iPhone 15 Pro Max | 932 x 430 | **1.000** | none | 81pt | 9.5pt |
| iPhone 15 | 852 x 393 | 0.914 | none | 74pt | 8.7pt |
| Pixel 8 | 892 x 412 | 0.957 | none | 77pt | 9.1pt |
| Galaxy S23 | 853 x 393 | 0.914 | 1pt | 74pt | 8.7pt |
| iPhone SE 3 | 667 x 375 | 0.716 | 67pt tall | 57pt | **6.8pt** |
| iPad 10.9 | 1180 x 820 | 1.266 | 275pt tall | 102pt | 12.0pt |

Two readings of that table.

**The good one.** Touch targets are fine. A hand card is 57 to 102pt on every device, well past the 44pt
floor, and the nine stations are the same. Nobody has to redraw the board.

**The bad one.** **Type does not survive the scale.** The lobby's place labels ("the ring · codex", "the
fence · ledger", "the gatepost · how to play") are 9.5px at 0.8 opacity today, which is already small on
a desktop; on a phone they land between 6.8 and 9.5pt, under any legibility floor and far under the 11pt
minimum either platform expects. Their hit target is 11px tall, which is a quarter of the 44pt guidance.
The same applies to every small label on the surfaces: "leaves in 8h", the codex row labels, the ledger's
numerals. **This is the one piece of design work the port genuinely requires, and it is worth doing on
desktop anyway** — it is the same finding as section 4 of the ship read, arriving from a different direction.

Two device notes. The **iPhone SE** and any 16:9 phone letterbox 67pt, so the game will sit in a band with
the app background above and below; that band needs a deliberate treatment rather than black. **Tablets**
letterbox heavily (275pt on an iPad): either accept wide bands, or declare phone-only on the App Store,
which is a one-line decision but does cost the iPad listing.

## 3. The two things Apple will look at, and both are fixable

**Remote scripts.** The app fetches React and react-dom from `unpkg.com` at runtime. In a wrapper this is
both a review risk (App Store 2.5.2, executable code fetched at runtime) and an offline failure: with no
network the app does not boot at all, not even to a friendly screen. **Vendor them.** React UMD is about
140 KB gzipped; it goes in the bundle with the rest.

**Runtime evaluation.** The `.dc.html` format ships its logic as a string that `support.js` evaluates
(`evalDcLogic`). Evaluating code that shipped inside the app binary is allowed; evaluating code fetched
from the network is not. Once the scripts are vendored, this is defensible, but it is still the thing a
reviewer would ask about, and it is also why the document is 1.26 MB of HTML. **Recommendation:** a small
build step that emits the prototype as a static bundle (HTML + a JS file) for the app targets, so the
shipped artifact contains no network-fetched code and no string eval. Design keeps authoring in the
`.dc.html` lineage exactly as now; the build is a one-way export, not a new source of truth.

**While we are in the store rules:** account creation exists (`login`, `ageCheck`), so Apple 5.1.1(v)
requires in-app account deletion — `api.deleteAccount` already exists, so this is a matter of exposing it
on a settings surface, which does not exist yet. If any third-party sign-in is offered, Sign in with Apple
has to be offered beside it. There is no in-app purchase today, so none of the commerce rules bite yet.

## 4. The wrapper work, in order

1. **Static build target.** Vendor React and react-dom, inline or bundle `support.js`, `manzil-art2.js`,
   `ephemeris2.js`, `socket-io-client.js`. Output: one folder Capacitor can copy. No unpkg, no eval of
   anything fetched.
2. **Capacitor project** for both platforms, one web build feeding both.
3. **Orientation lock to landscape** in both manifests (`android:screenOrientation="sensorLandscape"`,
   iOS `UISupportedInterfaceOrientations` landscape only). Also handle the first-launch case where the
   phone is portrait: a single "turn your phone" card, not a squashed board.
4. **Safe areas.** Add `viewport-fit=cover` to the viewport meta and inset the stage by
   `env(safe-area-inset-*)`. In landscape the Dynamic Island eats about 59pt on one side and the home
   indicator about 21pt at the bottom; the stage is full-bleed today, so the leftmost station and the
   bottom of the hand shelf will sit under both without this.
5. **Offline and error states.** The API carries progress and the open tables; the sky maths do not need
   it. Minimum: a readable "the road is out of reach tonight" screen, and pass-and-play still playable
   offline, which is a real selling point and is already built.
6. **A manifest and a service worker** — needed for the Android TWA fallback and worth having anyway for
   the web build's own reliability.
7. **Store furniture.** Icons, splash, landscape screenshots, age rating, privacy policy URL, privacy
   labels (the app collects a birth time and place for the chart, which is sensitive and has to be
   declared honestly), and a settings surface carrying account deletion and data export.
8. **Push**, if wanted. "The moon enters the heart tonight" is the natural notification and the retention
   doc's own hook; APNs and FCM through Capacitor, and it is the one piece of work that is genuinely new
   rather than ported.

## 5. The split

- **Code:** items 1 to 6 and 8. The build step is the substantial one; the rest is configuration.
- **Design:** the type floor (nothing under 11pt at scale 1.0, which means nothing under 11px in the
  stage), hit targets to 44pt on the scene marks, the letterbox band treatment for 16:9 phones and
  tablets, the turn-your-phone card, icon and splash, and landscape screenshots.
- **Measurement:** I will verify the built app against this table on device sizes, and check tap targets
  and type sizes the same way I checked them on staging.

## 6. What I would not do yet

**Do not start the wrapper until the road runs.** The blocker in `THE-SHIP-READ-15SEP.md` means the
single-player loop ends after one board; wrapping that would produce an app whose main mode does not
work. The packaging work in section 4 is independent of it and can be specced now, but the first build
worth putting in a simulator is one where a climb can be finished.

**Do not design portrait yet.** The decision is landscape-locked, and the numbers support it: the stage
is already a phone landscape viewport at scale 1.0. Portrait would mean rearranging the nine-station
arc, the hand shelf and the dawn pairs, which is a second layout to design and maintain, and it should
wait until the flow work in the ship read has settled.

### Files

Measurements from staging on 15 Sep; `research/THE-SHIP-READ-15SEP.md` for the build's current state.
