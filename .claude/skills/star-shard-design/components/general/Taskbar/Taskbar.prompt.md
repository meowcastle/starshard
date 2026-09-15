Taskbar from the Star Shard v2.0 design system (current live direction) — despite the legacy name, this is now the real tab bar: exactly three destinations, navigation only, never actions. Use via `window.StarShardDS.Taskbar`.

```jsx
<Taskbar
  start={<span data-active="true">shard</span>}
>
  <span>tonight</span>
  <span>chart</span>
</Taskbar>
```

## Props

```ts
interface TaskbarProps {
  start: React.ReactNode;
  children?: React.ReactNode;
  trailing?: React.ReactNode;
}
```

Never add a fourth destination or repurpose a tab item as an action
button — `UI-PRINCIPLES.md`'s law is explicit that tab bars are
navigation-only.
