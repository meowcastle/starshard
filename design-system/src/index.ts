// Star Shard Design System — implements DESIGN-SYSTEM.md v1.0.
//
// Button, Input, Window, ShardCard, TarotCard are Claude Design's own
// implementations (design/incoming/components/, readme.md's "component
// inventory is otherwise exactly the five families the brand spec's §3-4
// defines"), converted to TypeScript here unchanged in behavior — this
// package exists to wire them into a real buildable package for
// /design-sync, not to reinterpret them. Re-adopt from a future Design
// export rather than hand-editing these five.
//
// Taskbar is not part of Design's component set; it's a spec-compliant
// addition since DESIGN-SYSTEM.md §4 describes one but Design didn't build
// it, and it doesn't conflict with anything Design shipped.
//
// For Claude Design's canvas via /design-sync. The live site runs on the
// dc-runtime template and does not import this package at runtime — Code
// hand-translates Design's comps into the site's markup either way.

import './tokens/index.css';

export { Window } from './Window';
export type { WindowProps } from './Window';

export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Input } from './Input';
export type { InputProps } from './Input';

export { Taskbar } from './Taskbar';
export type { TaskbarProps } from './Taskbar';

export { ShardCard } from './ShardCard';
export type { ShardCardProps, ShardKind } from './ShardCard';

export { TarotCard } from './TarotCard';
export type { TarotCardProps } from './TarotCard';
