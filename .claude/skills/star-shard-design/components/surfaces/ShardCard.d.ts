import * as React from 'react';

/**
 * One of the four shards of a reading, styled as a file in a file manager.
 * Starts face down; flipping all four unlocks the reading.
 *
 * @startingPoint section="Surfaces" subtitle="A reading shard as a pretend file" viewport="700x210"
 */
export interface ShardCardProps {
  kind?: 'house' | 'mirror' | 'moon' | 'hearth';
  title?: string;
  body?: string;
  /** Fake byte size in the title strip — flavour only. */
  size?: string;
  revealed?: boolean;
  onReveal?: () => void;
  style?: React.CSSProperties;
}

export declare function ShardCard(props: ShardCardProps): React.JSX.Element;
