## Star Shard design system — build conventions

Six components: `Window`, `Button`, `Input`, `Taskbar` (desktop chrome) and
`ShardCard`, `TarotCard` (collectible surfaces). No provider or context
wrapper is needed for any of them — they read CSS custom properties
directly via inline `style`, so as long as the bound stylesheet is loaded
(it always is), components can be composed freely with no setup step.

### The one structural rule: page vs. card context

Everything defaults to **page context** (cream surface, teal-900 ink).
`TarotCard` renders in **card context** internally (it sets
`data-context="card"` on its own root) — the same twelve brand values,
roles inverted: cream and teal-900 swap places. Don't nest a `TarotCard`
inside anything that also sets `data-context="card"`; it already does that
itself. Nothing else in the set uses card context.

### The token vocabulary — real names, use these not raw hex

Surfaces/ink: `--surface`, `--surface-raised`, `--surface-sunken`, `--ink`,
`--ink-muted`, `--ink-accent`, `--ink-warn`, `--accent` (teal-500, used for
ShardCard's title strip and shard-glyph), `--action` (pink-500, primary
button fill). Bevel: `--edge-light` / `--edge-dark` as the two border-color
values, `--bevel` (2px width) — raised = `light dark dark light`, inset
(Input) = `dark light light dark`. Shape: `--radius-none` (everything),
`--radius-card` (16px, TarotCard only). Shadow: `--shadow-window`
(Window), `--shadow-raised` (Button/ShardCard). Type: `--font-retro`
(Pixelify Sans — titles/eyebrows/labels, uppercase, `--tracking-eyebrow`
letter-spacing), `--font-display` (Baloo 2 — headings, 700/800 weight only),
`--font-body` (Varela Round — everything else), `--text-2xs` through
`--text-3xl`. Spacing: `--space-1` (4px) through `--space-9` (40px),
`--tap-min` (44px — the floor for any interactive element).

The rare-pull foil treatment (`TarotCard rare`) pulls from a separate
sub-ramp — `--foil-surface`, `--foil-sunken`, `--foil-edge` — exposed at
`:root` unconditionally, so `rare` just switches which surface token a
`TarotCard` reads. Don't reuse the foil tokens outside `TarotCard[rare]`.

### Where the truth lives

Read `styles.css` (the bound copy in this project) before styling anything
new — it's the full token set. Each component's own doc (`<Name>.prompt.md`
in this project) has its real prop shape; treat the `.d.ts` type as
authoritative over any description here if they ever disagree.

### A real composition

Star Shard's actual login flow — `Window` + `Input` + `Button` composed
together, matching how the live site uses them:

```jsx
<Window title="account.exe" icon="🔑">
  <Input label="your name" placeholder="mikufan39" />
  <Input label="password" type="password" placeholder="8+ characters" />
  <Button variant="primary">☾ log in</Button>
  <Button variant="tertiary">new here? sign up instead</Button>
</Window>
```

`ShardCard`/`TarotCard` compose the same way — drop several into a flex row
for a "reveal your reading" or "collect the mansions" screen; both accept a
`revealed`/`faceDown` boolean plus an `onReveal`/`onFlip` handler, so a
flip interaction is just local state, no extra wiring.
