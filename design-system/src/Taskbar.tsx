import type { ReactNode } from 'react';
import './Taskbar.css';

export interface TaskbarProps {
  /** The "🌙 start" button, or any start-menu trigger. */
  start: ReactNode;
  /** Open-window chips. */
  children?: ReactNode;
  /** Right-aligned content — the account status pill, the clock. */
  trailing?: ReactNode;
}

/**
 * The 46px desktop taskbar. --surface fill, a top --edge-light hairline,
 * Pixelify text-xs throughout.
 */
export function Taskbar({ start, children, trailing }: TaskbarProps) {
  return (
    <div className="ss-taskbar">
      <div className="ss-taskbar__start">{start}</div>
      <div className="ss-taskbar__divider" />
      <div className="ss-taskbar__items">{children}</div>
      {trailing && <div className="ss-taskbar__trailing">{trailing}</div>}
    </div>
  );
}
