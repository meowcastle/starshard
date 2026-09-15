Window from the Star Shard v2.0 design system (current live direction) — a plain bordered panel, not a desktop window. Use via `window.StarShardDS.Window`.

```jsx
<Window title="your chart" icon="☾">
  <Input label="born on" placeholder="6 june 1989" />
  <Button variant="primary">✦ cast your chart ✦</Button>
</Window>
```

## Props

```ts
interface WindowProps {
  title?: string;
  /** Unicode glyph shown before the title, e.g. "☾". */
  icon?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
```

No `focused`/`onMinimize`/`onClose` props — there's no window chrome or
multi-window desktop metaphor in the live product to control.
