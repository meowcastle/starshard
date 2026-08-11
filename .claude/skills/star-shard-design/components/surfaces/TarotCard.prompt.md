The collectible. 28 of these, one per lunar mansion — the deck is the product's spine, not decoration.

```jsx
<TarotCard numeral="XIX" name="Saʿd al-Suʿūd" epithet="the luckiest of the lucky" art={url} />
<TarotCard numeral="XVII" rare />
<TarotCard faceDown onFlip={turn} />
```

- Sets `data-context="card"` on itself. Do not wrap it in another card context.
- `radius-card` (16px) is correct here — a card is physically a card. This is the only place radius is non-zero besides circles.
- **Must survive a 100px thumbnail:** the numeral is the one element that stays legible at feed-preview size. Test every new face at 100px before shipping it.
- `art` is a commission. There is no generated fallback beyond the ☾ placeholder — ship the placeholder rather than a stand-in illustration.
