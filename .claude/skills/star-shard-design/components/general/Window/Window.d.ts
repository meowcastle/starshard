import * as React from 'react';

/**
 * Window — Star Shard v2.0 (current direction). The Windows-95 title
 * bar (gradient fill, minimize/close controls) is retired; this is a
 * plain parchment-bordered panel with an optional Cormorant Garamond
 * title line — the live product has no window chrome, every screen is
 * full-bleed.
 */
export interface WindowProps {
  title?: string;
  /** Unicode glyph shown before the title, e.g. "☾". */
  icon?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export declare const Window: React.ComponentType<WindowProps>;
