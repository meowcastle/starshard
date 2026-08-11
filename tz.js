// Star Shard — historical timezone + DST resolution for a birth moment.
// Uses the IANA rules the platform ships, so pre-1970 and pre-DST-reform dates
// resolve correctly rather than assuming today's offset.
//
// OWNER: Claude Code. Do not edit from Claude Design.

/** UTC offset in hours (may be fractional) for `tz` at the given wall time. */
export function offsetFor(tz, y, m, d, hh, mm) {
  const get = t => {
    const v = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' })
      .formatToParts(t).find(p => p.type === 'timeZoneName').value;
    if (v === 'GMT' || v === 'UTC') return 0;
    const mt = v.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    return mt ? (mt[1] === '-' ? -1 : 1) * (+mt[2] + (+(mt[3] || 0)) / 60) : 0;
  };
  // First pass treats the wall time as UT to pick a candidate offset, second
  // pass re-resolves at the corrected instant.
  let off = get(new Date(Date.UTC(y, m - 1, d, hh, mm)));
  off = get(new Date(Date.UTC(y, m - 1, d, hh, mm) - off * 3600e3));
  return off;
}

/** { off, dst } — dst true when the offset exceeds that zone's winter standard. */
export function dstInfo(tz, y, m, d, hh, mm) {
  const off = offsetFor(tz, y, m, d, hh, mm);
  const std = Math.min(offsetFor(tz, y, 1, 15, 12, 0), offsetFor(tz, y, 7, 15, 12, 0));
  return { off, dst: off > std };
}
