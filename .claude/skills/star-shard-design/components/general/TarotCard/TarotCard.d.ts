import * as React from 'react';

/**
 * TarotCard — Star Shard v2.0 (current direction), renamed in spirit
 * to a "station card": one of the 28 real lunar mansions, not a tarot
 * conceit. Plain numeral 1-28 (not roman numerals), no foil/rare
 * treatment, no card-context color inversion — both retired.
 */
export interface TarotCardProps {
  /** 1-28, the mansion's position. */
  numeral?: number;
  name?: string;
  /** The mansion's epithet, e.g. "the empty district". */
  epithet?: string;
  /** URL of the commissioned mansion art. Falls back to a ☾ placeholder. */
  art?: string;
  faceDown?: boolean;
  width?: number;
  onFlip?: () => void;
  style?: React.CSSProperties;
}

export declare const TarotCard: React.ComponentType<TarotCardProps>;
