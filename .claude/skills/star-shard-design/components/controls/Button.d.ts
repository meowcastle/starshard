import * as React from 'react';

/**
 * Primary action control. Bevelled, square, hard shadow; presses by
 * translating 2px into the page.
 *
 * @startingPoint section="Controls" subtitle="Bevelled action button, three variants" viewport="700x160"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = pink-500 fill, secondary = teal-200, tertiary = transparent. */
  variant?: 'primary' | 'secondary' | 'tertiary';
  children?: React.ReactNode;
}

export declare function Button(props: ButtonProps): React.JSX.Element;
