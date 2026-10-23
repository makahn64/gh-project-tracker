import { parseNumstat } from '../../server/git/numstat';

const globs = ['**/pnpm-lock.yaml', '**/*.lock', '**/dist/**'];
const days = ['2026-10-21', '2026-10-22'];
const at = (d: Date) => `__C__${d.toISOString()}`;

test('sums added and removed per local day', () => {
  const log = [
    at(new Date(2026, 9, 21, 10)), '', '10\t2\tsrc/a.ts', '5\t0\tsrc/b.ts',
    at(new Date(2026, 9, 22, 23, 30)), '', '1\t4\tsrc/a.ts',
  ].join('\n');
  expect(parseNumstat(log, globs, days)).toEqual([
    { date: '2026-10-21', added: 15, removed: 2 },
    { date: '2026-10-22', added: 1, removed: 4 },
  ]);
});

test('skips binary files', () => {
  const log = [at(new Date(2026, 9, 21, 10)), '', '-\t-\tlogo.png', '3\t0\tsrc/a.ts'].join('\n');
  expect(parseNumstat(log, globs, days)[0]).toEqual({ date: '2026-10-21', added: 3, removed: 0 });
});

test('skips excluded paths', () => {
  const log = [at(new Date(2026, 9, 21, 10)), '', '5\t2\tpnpm-lock.yaml', '9\t0\tapps/web/dist/a.js', '1\t1\tsrc/a.ts'].join('\n');
  expect(parseNumstat(log, globs, days)[0]).toEqual({ date: '2026-10-21', added: 1, removed: 1 });
});

test('renames are matched on the new path', () => {
  const log = [at(new Date(2026, 9, 21, 10)), '', '3\t1\tsrc/{old => new}/x.ts', '4\t0\told.txt => new.lock'].join('\n');
  expect(parseNumstat(log, globs, days)[0]).toEqual({ date: '2026-10-21', added: 3, removed: 1 });
});

test('commits outside the days are ignored and empty days are zero', () => {
  const log = [at(new Date(2026, 9, 1, 10)), '', '50\t50\tsrc/a.ts'].join('\n');
  expect(parseNumstat(log, globs, days)).toEqual([
    { date: '2026-10-21', added: 0, removed: 0 },
    { date: '2026-10-22', added: 0, removed: 0 },
  ]);
});

test('empty log gives zero days', () => {
  expect(parseNumstat('', globs, days)).toHaveLength(2);
});
