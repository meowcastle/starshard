import type { CSSProperties } from 'react';

/**
 * One of the 28 lunar mansions as a collectible card. Always renders in
 * card context — cream ink on the brand's dark teal.
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
  style?: CSSProperties;
}

export function TarotCard({ numeral = 'I', name = '', epithet = '', art, rare = false, faceDown = false, width = 216, onFlip, style }: TarotCardProps) {
  const base: CSSProperties = {
    width,
    aspectRatio: '1080 / 1920',
    borderRadius: 'var(--radius-card)',
    boxShadow: 'var(--shadow-window)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
    padding: '18px 16px',
    cursor: onFlip ? 'pointer' : 'default',
    ...style,
  };

  if (faceDown) {
    return (
      <div
        data-context="card"
        onClick={onFlip}
        style={{
          ...base,
          background: 'var(--surface)',
          border: '1px solid var(--edge-light)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: width * 0.36, color: 'var(--ink-accent)', lineHeight: 1 }}>★</div>
        <div style={{ fontFamily: 'var(--font-retro)', fontSize: 'var(--text-2xs)', letterSpacing: 'var(--tracking-eyebrow)', color: 'var(--ink-muted)' }}>
          TAP TO TURN
        </div>
      </div>
    );
  }

  return (
    <div
      data-context="card"
      onClick={onFlip}
      style={{
        ...base,
        background: rare ? 'var(--foil-surface)' : 'var(--surface)',
        border: rare ? '2px solid var(--foil-edge)' : '1px solid var(--edge-light)',
        color: 'var(--ink)',
      }}
    >
      <div style={{ fontFamily: 'var(--font-retro)', fontSize: 'var(--text-2xs)', letterSpacing: 'var(--tracking-eyebrow)', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
        {numeral} of xxviii
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, lineHeight: 1.15, color: 'var(--ink)' }}>{name}</div>
      {epithet && <div style={{ fontSize: 11, color: 'var(--ink-accent)' }}>{epithet}</div>}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          margin: '6px 0',
          border: '1px solid var(--edge-light)',
          background: 'var(--surface-sunken)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {art
          ? <img src={art} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 38, color: 'var(--ink-muted)' }}>☾</span>}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 44, color: 'var(--ink-warn)', lineHeight: 0.9, textAlign: 'right' }}>
        {numeral}
      </div>
      <div style={{ fontFamily: 'var(--font-retro)', fontSize: 9, letterSpacing: 'var(--tracking-eyebrow)', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
        starshard95 · tag your oshi ♡
      </div>
    </div>
  );
}
