import * as React from 'react';

/**
 * Single-line text field with an inset bevel — the visual inverse of Button.
 *
 * @startingPoint section="Controls" subtitle="Inset-bevel field with retro label" viewport="700x150"
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Rendered in Pixelify above the field, uppercase. */
  label?: string;
  /** Helper line below the field. */
  hint?: string;
}

export declare function Input(props: InputProps): React.JSX.Element;
