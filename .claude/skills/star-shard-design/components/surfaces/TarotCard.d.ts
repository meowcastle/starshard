import * as React from 'react';

/**
 * One of the 28 lunar mansions as a collectible card. Always renders in
 * card context — cream ink on the brand's dark teal.
 *
 * @startingPoint section="Surfaces" subtitle="Mansion card: face, rare, and back" viewport="700x330"
 */
export interface TarotCardProps {
  /** Roman numeral I–XXVIII. */
  numeral?: string;
  name?: string;
  /** Short translated epithet, e.g. "the glance". */
  epithet?: string;
  /** URL of the commissioned mansion art. Falls back to a ☾ placeholder. */
  art?: string;
  /** Gold foil treatment for a rare pull. */
  rare?: boolean;
  faceDown?: boolean;
  width?: number;
  onFlip?: () => void;
  style?: React.CSSProperties;
}

export declare function TarotCard(props: TarotCardProps): React.JSX.Element;
