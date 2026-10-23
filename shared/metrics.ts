import { ALL, type Issue, type Priority } from './types';
import { localDay } from './days';

/** Not-planned and duplicate closes are left out of every count. */
export const isCounted = (i: Issue) => i.stateReason !== 'NOT_PLANNED' && i.stateReason !== 'DUPLICATE';

/** Closed counts as done, with or without a reason, unless it's not planned or a duplicate. */
export const isDone = (i: Issue) => i.state === 'CLOSED' && isCounted(i);

const pct = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));

export function inScope(issues: Issue[], milestone: string): Issue[] {
  return milestone === ALL ? issues : issues.filter((i) => i.milestone === milestone);
}

export function closedPerDay(issues: Issue[], days: string[]): { date: string; count: number }[] {
  const counts = new Map(days.map((d) => [d, 0]));
  for (const i of issues) {
    if (!isDone(i) || !i.closedAt) continue;
    const d = localDay(i.closedAt);
    if (counts.has(d)) counts.set(d, counts.get(d)! + 1);
  }
  return days.map((date) => ({ date, count: counts.get(date)! }));
}

export function progress(scoped: Issue[]) {
  const counted = scoped.filter(isCounted);
  const closed = counted.filter(isDone).length;
  const open = counted.filter((i) => i.state === 'OPEN').length;
  return { closed, total: closed + open, open, pct: pct(closed, closed + open) };
}

export function burndown(scoped: Issue[], days: string[]): { date: string; pct: number }[] {
  const counted = scoped.filter(isCounted);
  const closeDays = counted.filter(isDone).map((i) => localDay(i.closedAt!));
  return days.map((date) => ({ date, pct: pct(closeDays.filter((d) => d <= date).length, counted.length) }));
}

export function byLabel(scoped: Issue[]): { label: string; open: number; total: number; pct: number }[] {
  const tally = new Map<string, { open: number; total: number }>();
  for (const i of scoped.filter(isCounted)) {
    for (const label of i.labels) {
      const t = tally.get(label) ?? { open: 0, total: 0 };
      t.total++;
      if (!isDone(i)) t.open++;
      tally.set(label, t);
    }
  }
  return [...tally.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, t]) => ({ label, ...t, pct: pct(t.open, t.total) }));
}

const RANK: Record<Priority, number> = { P0: 0, P1: 1, P2: 2 };
const rank = (p: Priority | null) => (p ? RANK[p] : 3);

export function remaining(scoped: Issue[]): Issue[] {
  return scoped
    .filter((i) => i.state === 'OPEN')
    .sort((a, b) => rank(a.priority) - rank(b.priority) || b.number - a.number);
}
