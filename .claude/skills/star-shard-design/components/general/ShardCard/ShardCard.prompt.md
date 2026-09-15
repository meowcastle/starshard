ShardCard from the Star Shard v2.0 design system (current live direction). Use via `window.StarShardDS.ShardCard`.

```jsx
<ShardCard eyebrow="colocation" title="your moon and midheaven, joined" body="the chart separates them by 9°; the shard reads them as one." />
<ShardCard revealed={false} onReveal={() => setRevealed(true)} />
```

## Props

```ts
interface ShardCardProps {
  /** Small muted label above the title, e.g. "colocation" or "your moon". */
  eyebrow?: string;
  title?: string;
  body?: string;
  revealed?: boolean;
  onReveal?: () => void;
  style?: React.CSSProperties;
}
```

The old `kind` enum (house/mirror/moon/hearth) is gone — that four-shard
taxonomy is retired. Don't reintroduce a fixed kind list; pass whatever
eyebrow text actually fits the finding.
