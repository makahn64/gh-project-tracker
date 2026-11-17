const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar day of a Date, 'YYYY-MM-DD'. */
export function dayOf(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local calendar day of an ISO timestamp. */
export function localDay(iso: string): string {
  return dayOf(new Date(iso));
}

/** The last n local days ending today, oldest first. */
export function lastNDays(now: Date, n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(dayOf(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)));
  }
  return days;
}

/** Chart range in days: starts at 2 weeks, zooms out a week at a time to 13 weeks (~3 months). */
export const MIN_SPAN = 14;
export const MAX_SPAN = 91;
const STEP = 7;
export const zoomOut = (span: number) => Math.min(MAX_SPAN, span + STEP);
export const zoomIn = (span: number) => Math.max(MIN_SPAN, span - STEP);
