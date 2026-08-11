import type { InputHTMLAttributes } from 'react';
import './Input.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Pixelify uppercase label above the field. Omit for an unlabelled input. */
  label?: string;
  id?: string;
}

/**
 * Star Shard's inset-bevel text input. White fill, teal-900 text, a Pixelify
 * uppercase label above. Grows to 56px tall with a 3px bevel under 1024px —
 * the retro bevel needs to survive a high-DPI phone screen at arm's length.
 */
export function Input({ label, id, className, ...rest }: InputProps) {
  const input = (
    <input id={id} className={`ss-input ss-focusable${className ? ` ${className}` : ''}`} {...rest} />
  );
  if (!label) return input;
  return (
    <label className="ss-field" htmlFor={id}>
      <span className="ss-field__label">{label}</span>
      {input}
    </label>
  );
}
