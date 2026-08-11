Bevelled action button — the only control that starts a flow ("shatter the sky", "weave my reading").

```jsx
<Button variant="primary" onClick={shatter}>✧ shatter the sky ✧</Button>
```

- `primary` pink-500, `secondary` teal-200, `tertiary` transparent.
- The label is **always** `teal-900`. White on pink-500 is 2.55:1 and fails AA — the shipped site gets this wrong.
- Minimum height is 44px on every surface, including desktop.
- Never set `border-radius`. Never use a blurred shadow.
