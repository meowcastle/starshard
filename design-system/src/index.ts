// Star Shard Design System — implements DESIGN-SYSTEM.md v1.0.
// For Claude Design's canvas via /design-sync. The live site runs on the
// dc-runtime template and does not import this package at runtime — Code
// hand-translates Design's comps into the site's markup either way.

import './tokens.css';

export { Window } from './Window';
export type { WindowProps } from './Window';

export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Input } from './Input';
export type { InputProps } from './Input';

export { Taskbar } from './Taskbar';
export type { TaskbarProps } from './Taskbar';

export { ShardCard } from './ShardCard';
export type { ShardCardProps, ShardVariant } from './ShardCard';

export { MansionCard } from './MansionCard';
export type { MansionCardProps } from './MansionCard';
