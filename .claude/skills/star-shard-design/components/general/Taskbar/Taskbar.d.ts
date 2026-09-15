import * as React from 'react';

/**
 * Taskbar — Star Shard v2.0 (current direction), renamed in spirit to
 * the real tab bar: exactly three destinations (shard / tonight /
 * chart), navigation only, never actions. Replaces the retired
 * Windows-95 desktop taskbar concept, which doesn't exist in a
 * phone-first single-page app.
 */
export interface TaskbarProps {
  /** Leftmost item — in practice the first of the three tab destinations. */
  start: React.ReactNode;
  /** Remaining tab items. */
  children?: React.ReactNode;
  /** Rightmost content, if any. */
  trailing?: React.ReactNode;
}

export declare const Taskbar: React.ComponentType<TaskbarProps>;
