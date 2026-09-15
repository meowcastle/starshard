Button from the Star Shard v2.0 design system (current live direction — amber/parchment, not the retired Windows-95 kit). Use via `window.StarShardDS.Button`.

```jsx
<Button variant="primary">✦ weave my reading ✦</Button>
<Button variant="secondary">back to log in</Button>
<Button variant="tertiary">skip for now</Button>
<Button variant="primary" disabled>sending…</Button>
```

## Props

```ts
interface ButtonProps {
  /** primary = filled parchment glow, secondary = parchment outline, tertiary = plain muted text link. */
  variant?: "primary" | "secondary" | "tertiary";
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}
```

Never use amber (`#FFB000`) for a button — amber is reserved for
"tonight," never a generic action.
