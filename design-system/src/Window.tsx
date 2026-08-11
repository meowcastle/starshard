import type { ReactNode } from 'react';
import './Window.css';

export interface WindowProps {
  /** Window title, shown uppercase in the title bar. */
  title: string;
  /** Focused windows get the teal-700→pink-700 gradient title bar; blurred windows are flat teal-200. */
  focused?: boolean;
  onMinimize?: () => void;
  onClose?: () => void;
  /** Fixed pixel width, or leave unset to fill its container. */
  width?: number;
  children: ReactNode;
}

/**
 * The desktop-chrome window (≥1024px only — see DESIGN-SYSTEM.md §5.1/5.2:
 * the phone flow has no window furniture at all). Raised bevel, shadow-window,
 * a 26px Pixelify title bar, and 24×24px minimum controls.
 */
export function Window({ title, focused = true, onMinimize, onClose, width, children }: WindowProps) {
  return (
    <div className={`ss-window${focused ? '' : ' ss-window--blurred'}`} style={width ? { width } : undefined}>
      <div className="ss-window__titlebar">
        <span className="ss-window__title">{title}</span>
        <span className="ss-window__controls">
          {onMinimize && (
            <button type="button" className="ss-window__ctl ss-focusable" onClick={onMinimize} aria-label="Minimize">
              _
            </button>
          )}
          {onClose && (
            <button type="button" className="ss-window__ctl ss-focusable" onClick={onClose} aria-label="Close">
              ✕
            </button>
          )}
        </span>
      </div>
      <div className="ss-window__body">{children}</div>
    </div>
  );
}
