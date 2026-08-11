import type { ReactNode } from 'react';
import './ShardCard.css';

export type ShardVariant = 'house' | 'mirror' | 'moon' | 'hearth';

/** The four shard accent hues, restated in the new ramp — DESIGN-SYSTEM.md §4. */
const ACCENTS: Record<ShardVariant, string> = {
  house: 'var(--teal-500)',
  mirror: 'var(--pink-700)',
  moon: 'var(--amber-700)',
  hearth: 'var(--pink-500)',
};

export interface ShardCardProps {
  variant: ShardVariant;
  /** File-strip label, e.g. "house.shd". */
  filename: string;
  /** Corner chip, e.g. "4KB". Omit for a face-down card, which shows "???". */
  size?: string;
  /** Face-down shows the gem + filename + "click to open"; face-up shows headline + body. */
  faceDown?: boolean;
  headline?: ReactNode;
  children?: ReactNode;
}

/**
 * One of the four collectible shards. Face-down: gem + filename +
 * "click to open ✦". Face-up: headline + body text. The accent hue is fixed
 * per variant (house teal-500, mirror pink-700, moon amber-700, hearth pink-500).
 */
export function ShardCard({ variant, filename, size, faceDown = false, headline, children }: ShardCardProps) {
  const accent = ACCENTS[variant];
  return (
    <div className="ss-shard">
      <div className="ss-shard__strip" style={{ background: accent }}>
        <span>{filename}</span>
        <span>{faceDown ? '???' : size}</span>
      </div>
      <div className="ss-shard__body">
        {faceDown ? (
          <>
            <span className="ss-shard__gem" style={{ background: accent }} aria-hidden="true" />
            <span className="ss-shard__prompt">click to open ✦</span>
          </>
        ) : (
          <>
            {headline && <p className="ss-shard__headline">{headline}</p>}
            <div className="ss-shard__text">{children}</div>
          </>
        )}
      </div>
    </div>
  );
}
