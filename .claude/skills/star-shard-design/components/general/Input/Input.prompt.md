Input from the Star Shard v2.0 design system (current live direction). Use via `window.StarShardDS.Input`.

```jsx
<Input label="born on" placeholder="6 june 1989" />
<Input label="at" hint="check the box if you don't know your birth time" placeholder="4:42 pm" />
```

## Props

```ts
interface InputProps {
  /** Lowercase, small, muted — never uppercase/letterspaced (calm-pass law). */
  label?: string;
  hint?: string;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
```
