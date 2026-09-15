TarotCard from the Star Shard v2.0 design system (current live direction) — despite the legacy name, this now represents one of the 28 real lunar mansions, not a tarot card. Use via `window.StarShardDS.TarotCard`.

```jsx
<TarotCard numeral={21} name="the empty district" epithet="counts two alone" art="/mansions/21.png" />
<TarotCard faceDown onFlip={() => reveal(21)} />
```

## Props

```ts
interface TarotCardProps {
  /** 1-28, the mansion's position. */
  numeral?: number;
  name?: string;
  /** The mansion's epithet, e.g. "the empty district". */
  epithet?: string;
  /** URL of the commissioned mansion art. Falls back to a ☾ placeholder. */
  art?: string;
  faceDown?: boolean;
  width?: number;
  onFlip?: () => void;
  style?: React.CSSProperties;
}
```

No `rare`/foil prop — that treatment and the roman-numeral tarot framing
are retired along with the old card-context color inversion.
