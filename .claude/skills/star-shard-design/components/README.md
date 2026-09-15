## Star Shard design system — v2.0 (current direction)

Six components: `Window`, `Button`, `Input`, `Taskbar` (the real tab bar)
and `ShardCard`, `TarotCard` (reading/mansion surfaces). No provider or
context wrapper is needed for any of them — they read plain CSS values
directly via inline `style`, so components can be composed freely with
no setup step.

**This is a reskin of the retired v1.0 kit, not a new component set.**
Names and prop shapes are kept close to the original for continuity, but
several concepts that don't exist in the live product were dropped:
there is no `data-context="card"` color inversion, no foil/rare
treatment, no Windows-95 bevel or press-translate, and `ShardCard`'s old
`kind` enum (house/mirror/moon/hearth — the retired four-shard system)
is gone. `Taskbar` now represents the real interaction law: exactly
three destinations (shard/tonight/chart), navigation only, never
actions. `TarotCard` now represents a real lunar mansion (numeral 1-28),
not a tarot card.

### The palette

Five colors, read directly out of the live product's own `.dc.html`
code — see the repo-root skill's `readme.md` for the full breakdown and
sourcing. In short: a dark near-black background gradient
(`#1E1706`→`#0F0B03`→`#080502`), parchment ink (`#F2EAD6`) and accent
(`#F0D89A`), muted secondary text (`#9A8A5E`), and amber (`#FFB000`)
reserved **exclusively** for "tonight" — never use it on a generic
component like these.

### Type

Two families: **Cormorant Garamond** (serif, weight 600, headings/titles)
and **Varela Round** (sans, everything else). No third font.

### Shape

Sharp rectangles by default, no radius unless round (`50%`) or a small
6px softening. No bevels, no hard-offset shadows — glows only, and even
those are used sparingly in this component set.

### Where the truth lives

Read `_ds_bundle.css` for the full token set. Each component's own doc
(`general/<Name>/<Name>.prompt.md`) has its real prop shape and a usage
example; the `.d.ts` type is authoritative over any description here if
they disagree. The real implementations live in `_ds_bundle.js`
(`window.StarShardDS.*`) — each component's own `.jsx` file is just a
thin re-export shim pointing at that bundle.

### A real composition

```jsx
<Window title="star shard" icon="☾">
  <Input label="born on" placeholder="6 june 1989" />
  <Input label="at" hint="check the box if you don't know your birth time" placeholder="4:42 pm" />
  <Button variant="primary">✦ cast your chart ✦</Button>
  <Button variant="tertiary">i don't know my birth time</Button>
</Window>
```

`ShardCard`/`TarotCard` compose the same way — drop several into a flex
row for a "your findings" or "your five mansions" screen; both accept a
`revealed`/`faceDown` boolean plus an `onReveal`/`onFlip` handler, so a
reveal interaction is just local state, no extra wiring.

## Loading

```html
<link rel="stylesheet" href="_ds_bundle.css">
<script src="_ds_bundle.js"></script>
```

Components are then available at `window.StarShardDS.*`. Mount into a
dedicated child node, not the host page's own React root:

```jsx
const { Button } = window.StarShardDS;
ReactDOM.createRoot(document.getElementById('ds-root')).render(<Button />);
```

## Components

- `Button` — `variant`: primary / secondary / tertiary. Never amber.
- `Input` — bottom-border pattern, lowercase label, no uppercase eyebrow.
- `ShardCard` — `eyebrow` + `title` + `body`, no fixed `kind` taxonomy.
- `TarotCard` — a real lunar mansion, `numeral` 1-28, no foil/rare.
- `Taskbar` — the real 3-item tab bar (shard/tonight/chart), nav only.
- `Window` — a bordered panel, no title-bar chrome or window controls.

---
Reskinned from the retired v1.0 kit (2026-08-23) to match the live
product's actual amber/parchment direction. See the skill's own
`readme.md` for full sourcing and the "what this replaces" note.
