import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Primary = pink-500 fill, the default call to action. Secondary = teal-200. Tertiary = transparent, still bevelled. */
  variant?: 'primary' | 'secondary' | 'tertiary';
  children: ReactNode;
}

/**
 * Star Shard's raised-bevel button. Label is always teal-900 (never white —
 * white on pink-500/teal-500 fails WCAG at 2.55:1 / 2.23:1). Inverts to an
 * inset bevel on :active. 44×44 minimum on phone, 32×32 on desktop.
 */
export function Button({ variant = 'primary', className, children, ...rest }: ButtonProps) {
  const variantClass = variant !== 'primary' ? ` ss-button--${variant}` : '';
  return (
    <button
      className={`ss-button ss-focusable${variantClass}${className ? ` ${className}` : ''}`}
      {...rest}
    >
      {children}
    </button>
  );
}
