import * as React from 'react';

/**
 * ShardCard — Star Shard v2.0 (current direction).
 * A reading/finding panel: eyebrow, title, body. The retired
 * kind="house"|"mirror"|"moon"|"hearth" enum belonged to the old
 * four-shard system and is not carried forward — pass your own
 * eyebrow string instead of a fixed taxonomy.
 */
export interface ShardCardProps {
  /** Small muted label above the title, e.g. "colocation" or "your moon". */
  eyebrow?: string;
  title?: string;
  body?: string;
  revealed?: boolean;
  onReveal?: () => void;
  style?: React.CSSProperties;
}

export declare const ShardCard: React.ComponentType<ShardCardProps>;
