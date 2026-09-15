import * as React from 'react';

/**
 * Input — Star Shard v2.0 (current direction).
 * The real bottom-border pattern used in the live onboarding forms.
 * Label is lowercase and small — the calm-pass law bans uppercase or
 * letterspaced labels, which is what the retired eyebrow style used.
 */
export interface InputProps {
  /** Lowercase, small, muted — never uppercase/letterspaced. */
  label?: string;
  /** Helper line below the field. */
  hint?: string;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export declare const Input: React.ComponentType<InputProps>;
