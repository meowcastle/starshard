import React from 'react';

const KIND = {
  house:  { label: 'placidus houses', file: 'house.shd' },
  mirror: { label: 'the mirror',      file: 'mirror.shd' },
  moon:   { label: 'lunar mansion',   file: 'moon.shd' },
  hearth: { label: 'planetary day',   file: 'hearth.shd' },
};

export function ShardCard({ kind = 'house', title, body, size = '4KB', revealed = true, onReveal, style }) {
  const meta = KIND[kind] || KIND.house;
  return (
    <div
      onClick={revealed ? undefined : onReveal}
      style={{
        background: 'var(--surface-raised)',
        borderWidth: 'var(--bevel)',
        borderStyle: 'solid',
        borderColor: 'var(--edge-light) var(--edge-dark) var(--edge-dark) var(--edge-light)',
        boxShadow: 'var(--shadow-raised)',
        cursor: revealed ? 'default' : 'pointer',
        minHeight: 'var(--tap-min)',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '4px 9px',
          background: 'var(--accent)',
          color: 'var(--teal-900)',
          fontFamily: 'var(--font-retro)',
          fontSize: 'var(--text-2xs)',
          letterSpacing: '.14em',
        }}
      >
        <span>{meta.file}</span>
        <span>{size}</span>
      </div>
      <div style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: 22,
              height: 26,
              background: 'var(--accent)',
              clipPath: 'polygon(50% 0%,100% 30%,82% 100%,18% 100%,0% 30%)',
            }}
          />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>
              {kind} shard
            </div>
            <div style={{ fontFamily: 'var(--font-retro)', fontSize: 'var(--text-2xs)', letterSpacing: 'var(--tracking-eyebrow)', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
              {revealed ? meta.label : 'face down'}
            </div>
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-xs)', margin: '8px 0 4px', color: 'var(--ink)' }}>
          {revealed ? title : 'tap to flip'}
        </div>
        {revealed && body && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', lineHeight: 'var(--leading-normal)' }}>{body}</div>
        )}
      </div>
    </div>
  );
}
