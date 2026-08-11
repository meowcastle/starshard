Text field. The bevel runs inset — dark on top and left — which is what separates an input from a button at a glance.

```jsx
<Input label="your name" placeholder="mikufan39" />
<Input label="born on" type="date" hint="we never send this anywhere" />
```

- Use native `type="date"` / `type="time"` on phone so the OS picker appears.
- 44px minimum height. Never remove the focus ring.
