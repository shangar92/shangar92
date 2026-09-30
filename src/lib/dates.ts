// Date helpers, ported from the Day Off web app.
//
// Dates are "YYYY-MM-DD" strings in LOCAL time. toISOString() is never used for
// them: it converts to UTC, which in Kurdistan (UTC+3) moves a local midnight
// back to the previous calendar day.

export function isoLocal(d: Date) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function parseLocalDate(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** One day either side of an ISO date. */
export function shiftIso(s: string, n: number) {
  const d = parseLocalDate(s);
  d.setDate(d.getDate() + n);
  return isoLocal(d);
}

/** A complete, plausible date, not one still being typed. */
export function isRealDate(v: unknown) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v || ''))) return false;
  const y = Number(String(v).slice(0, 4));
  return y >= 1900 && y <= 2200;
}

/** 2026-10-18 -> 18/10/2026, the way the web app prints dates. */
export function dmy(iso?: string | null) {
  if (!iso) return '—';
  const p = String(iso).split('-');
  return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
}

export function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export function r3(n: number) {
  return Math.round(n * 1000) / 1000;
}

export function uid(p = 'x') {
  return p + '_' + Math.random().toString(36).slice(2, 8);
}
