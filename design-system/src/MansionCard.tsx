import type { ReactNode } from 'react';
import './MansionCard.css';

export interface MansionCardProps {
  /** Roman-numeral position, e.g. "IX". */
  numeral: string;
  /** Total count, e.g. "XXVIII" — rendered as "{numeral} OF {total}". */
  total: string;
  /** Mansion name, e.g. "Al-Ṭarf". */
  name: string;
  /** Short epithet, e.g. '"the glance"'. */
  epithet?: string;
  /** Art slot — an <img> or illustration. Renders an empty inset window when omitted. */
  art?: ReactNode;
  footerLeft?: string;
  footerRight?: string;
}

/**
 * The tarot/mansion card — card context (teal-900 field, cream ink, 16px
 * radius, butter-200 numeral). One of 28. Must survive a 100px thumbnail:
 * the numeral is the element that stays legible at that size.
 */
export function MansionCard({ numeral, total, name, epithet, art, footerLeft, footerRight }: MansionCardProps) {
  return (
    <div className="ss-mcard" data-context="card">
      <span className="ss-mcard__eyebrow">
        {numeral} OF {total}
      </span>
      <h3 className="ss-mcard__name">{name}</h3>
      {epithet && <p className="ss-mcard__epithet">{epithet}</p>}
      <div className="ss-mcard__art">{art}</div>
      <span className="ss-mcard__numeral">{numeral}</span>
      {(footerLeft || footerRight) && (
        <div className="ss-mcard__footer">
          <span>{footerLeft}</span>
          <span>{footerRight}</span>
        </div>
      )}
    </div>
  );
}
