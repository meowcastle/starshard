import React from 'react';

export function Window({ title = 'window', icon, focused = true, onMinimize, onClose, children, style }) {
  return (
    <div
      style={{
        background: 'var(--surface-raised)',
        borderWidth: 'var(--bevel)',
        borderStyle: 'solid',
        borderColor: 'var(--edge-light) var(--edge-dark) var(--edge-dark) var(--edge-light)',
        boxShadow: 'var(--shadow-window)',
        borderRadius: 'var(--radius-none)',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: '5px 7px',
          background: focused
            ? 'linear-gradient(90deg,var(--teal-700),var(--pink-700))'
            : 'var(--teal-200)',
          color: focused ? 'var(--cream)' : 'var(--teal-700)',
          fontFamily: 'var(--font-retro)',
          fontSize: 'var(--text-2xs)',
          letterSpacing: 'var(--tracking-eyebrow)',
          textTransform: 'uppercase',
        }}
      >
        <span style={{ flex: 1 }}>{icon ? icon + ' ' : ''}{title}</span>
        <WinControl label="minimize" onClick={onMinimize}>_</WinControl>
        <WinControl label="close" onClick={onClose}>✕</WinControl>
      </div>
      <div style={{ padding: 'var(--space-5)' }}>{children}</div>
    </div>
  );
}

function WinControl({ label, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        width: 24,
        height: 24,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--cream)',
        borderWidth: 'var(--bevel)',
        borderStyle: 'solid',
        borderColor: 'var(--edge-light) var(--edge-dark) var(--edge-dark) var(--edge-light)',
        color: 'var(--teal-900)',
        fontSize: 11,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
