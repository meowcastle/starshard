Window chrome for the desktop surface. The gradient title bar is the brand's loudest retro signal — use it only where a window genuinely is a window.

```jsx
<Window title="birthdata.chart" icon="☾" onClose={close}>
  <Input label="your name" />
</Window>
```

- **Desktop only.** Never render Window under 1024px; the phone flow is a separate branch, not a restyled window.
- Focused = teal-700→pink-700 gradient bar. Blurred = flat teal-200 with teal-700 text.
- The 24px controls are the one documented exception to the 44px tap minimum, because they exist only on pointer devices.
