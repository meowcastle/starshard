The four shards of a reading. Each one is dressed as a file so the desktop metaphor pays off somewhere real.

```jsx
<ShardCard kind="moon" title='Saʿd al-Suʿūd' body="the luckiest of the lucky" />
<ShardCard kind="house" revealed={false} onReveal={flip} />
```

- Exactly four kinds: `house`, `mirror`, `moon`, `hearth`. Do not invent a fifth.
- `house` must not render when the birth time is unknown — suppress it rather than reading from a guessed noon.
- The face-down → tap → flip gesture is shared with TarotCard. Keep them consistent.
