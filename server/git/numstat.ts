import picomatch from 'picomatch';
import type { DayLines } from '../../shared/types';
import { localDay } from '../../shared/days';

/** For a rename line, the path after the rename. */
function newPath(path: string): string {
  if (path.includes('{')) return path.replace(/\{[^{}]*? => ([^{}]*)\}/g, '$1').replace(/\/\//g, '/');
  const arrow = path.indexOf(' => ');
  return arrow === -1 ? path : path.slice(arrow + 4);
}

/** Per-day line totals from `git log --numstat --format=__C__%cI`. */
export function parseNumstat(log: string, excludeGlobs: string[], days: string[]): DayLines[] {
  const excluded = picomatch(excludeGlobs, { dot: true });
  const totals = new Map(days.map((d) => [d, { added: 0, removed: 0 }]));
  let current: { added: number; removed: number } | undefined;
  for (const line of log.split('\n')) {
    if (line.startsWith('__C__')) {
      current = totals.get(localDay(line.slice(5)));
      continue;
    }
    if (!current || !line) continue;
    const [added, removed, path] = line.split('\t');
    if (added === '-' || path === undefined || excluded(newPath(path))) continue;
    current.added += Number(added);
    current.removed += Number(removed);
  }
  return days.map((date) => ({ date, ...totals.get(date)! }));
}
