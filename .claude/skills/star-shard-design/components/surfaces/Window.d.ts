import * as React from 'react';

/**
 * Desktop window chrome. Desktop only — below 1024px the phone flow renders
 * screens instead, and no Window ever mounts.
 *
 * @startingPoint section="Surfaces" subtitle="Win95 window chrome, focused and blurred" viewport="700x220"
 */
export interface WindowProps {
  title?: string;
  /** Unicode glyph shown before the title, e.g. "☾". */
  icon?: string;
  /** Blurred windows drop the gradient bar for flat teal-200. */
  focused?: boolean;
  onMinimize?: () => void;
  onClose?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export declare function Window(props: WindowProps): React.JSX.Element;
