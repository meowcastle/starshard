import * as React from 'react';

/**
 * Button — Star Shard v2.0 (current direction).
 * No bevel, no press-translate. `primary` reads as a filled parchment
 * glow. Amber is deliberately never used here — amber is reserved for
 * "tonight" only, never a generic UI action.
 */
export interface ButtonProps {
  variant?: "primary" | "secondary" | "tertiary";
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}

export declare const Button: React.ComponentType<ButtonProps>;
