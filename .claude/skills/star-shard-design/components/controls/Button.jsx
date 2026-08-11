import React from 'react';

const VARIANT_FILL = {
  primary: 'var(--action)',
  secondary: 'var(--teal-200)',
  tertiary: 'transparent',
};

export function Button({ variant = 'primary', type = 'button', disabled, onClick, children, style, ...rest }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        minHeight: 'var(--tap-min)',
        padding: '11px 22px',
        background: VARIANT_FILL[variant],
        /* label is always teal-900 — white on these fills fails AA */
        color: 'var(--teal-900)',
        fontFamily: 'var(--font-display)',
        fontWeight: 'var(--weight-heading)',
        fontSize: 'var(--text-sm)',
        borderRadius: 'var(--radius-none)',
        borderWidth: 'var(--bevel)',
        borderStyle: 'solid',
        borderColor: pressed
          ? 'var(--edge-dark) var(--edge-light) var(--edge-light) var(--edge-dark)'
          : 'var(--edge-light) var(--edge-dark) var(--edge-dark) var(--edge-light)',
        boxShadow: pressed ? 'none' : 'var(--shadow-raised)',
        transform: pressed ? 'translate(2px,2px)' : 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
