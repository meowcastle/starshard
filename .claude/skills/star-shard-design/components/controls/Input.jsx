import React from 'react';

export function Input({ label, id, hint, style, ...rest }) {
  const auto = React.useId();
  const inputId = id || auto;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontFamily: 'var(--font-retro)',
            fontSize: 'var(--text-2xs)',
            letterSpacing: 'var(--tracking-eyebrow)',
            textTransform: 'uppercase',
            color: 'var(--ink-muted)',
          }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        style={{
          background: 'var(--white)',
          borderWidth: 'var(--bevel)',
          borderStyle: 'solid',
          borderColor: 'var(--edge-dark) var(--edge-light) var(--edge-light) var(--edge-dark)',
          borderRadius: 'var(--radius-none)',
          padding: '10px 12px',
          minHeight: 'var(--tap-min)',
          width: '100%',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--teal-900)',
          ...style,
        }}
        {...rest}
      />
      {hint && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>{hint}</div>
      )}
    </div>
  );
}
