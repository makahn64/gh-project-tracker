import { ALL } from '../../shared/types';
import { burndown, byLabel, closedPerDay, inScope, progress, remaining } from '../../shared/metrics';
import { mk } from './fixtures';

const days = ['2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23'];

describe('closedPerDay', () => {
  test('counts a late-evening local close on the local day', () => {
    const r = closedPerDay([mk({ closedLocal: new Date(2026, 9, 22, 23, 30) })], days);
    expect(r).toEqual([
      { date: '2026-10-20', count: 0 },
      { date: '2026-10-21', count: 0 },
      { date: '2026-10-22', count: 1 },
      { date: '2026-10-23', count: 0 },
    ]);
  });

  test('ignores not-planned and duplicate closes', () => {
    const when = new Date(2026, 9, 21, 12);
    const r = closedPerDay([
      mk({ closedLocal: when, stateReason: 'NOT_PLANNED' }),
      mk({ closedLocal: when, stateReason: 'DUPLICATE' }),
    ], days);
    expect(r.every((d) => d.count === 0)).toBe(true);
  });
});

describe('progress', () => {
  test('counts completed against counted tickets only', () => {
    const c = new Date(2026, 9, 21);
    const r = progress([
      mk({ closedLocal: c }), mk({ closedLocal: c }), mk({ closedLocal: c }),
      mk(), mk({ closedLocal: c, stateReason: 'NOT_PLANNED' }),
    ]);
    expect(r).toEqual({ closed: 3, total: 4, open: 1, pct: 75 });
  });

  test('empty scope is zero, not NaN', () => {
    expect(progress([])).toEqual({ closed: 0, total: 0, open: 0, pct: 0 });
  });
});

describe('burndown', () => {
  test('pct done as of the end of each day', () => {
    const r = burndown([mk({ closedLocal: new Date(2026, 9, 22, 10) }), mk()], days);
    expect(r.map((p) => p.pct)).toEqual([0, 0, 50, 50]);
  });

  test('ticket closed before the window counts as done from day one', () => {
    const r = burndown([mk({ closedLocal: new Date(2026, 8, 1) }), mk()], days);
    expect(r.map((p) => p.pct)).toEqual([50, 50, 50, 50]);
  });

  test('empty scope is all zeros', () => {
    expect(burndown([], days).map((p) => p.pct)).toEqual([0, 0, 0, 0]);
  });
});

describe('byLabel', () => {
  test('pct of each label still open, sorted by label', () => {
    const r = byLabel([
      mk({ labels: ['WEB', 'API'] }),
      mk({ labels: ['WEB'], closedLocal: new Date(2026, 9, 21) }),
    ]);
    expect(r).toEqual([
      { label: 'API', open: 1, total: 1, pct: 100 },
      { label: 'WEB', open: 1, total: 2, pct: 50 },
    ]);
  });

  test('omits a label whose only ticket is not counted', () => {
    const r = byLabel([mk({ labels: ['TEST'], closedLocal: new Date(2026, 9, 21), stateReason: 'NOT_PLANNED' })]);
    expect(r).toEqual([]);
  });
});

test('remaining sorts P0, P1, P2, then no priority, newest first within a level', () => {
  const issues = [
    mk({ number: 1, priority: null }), mk({ number: 2, priority: 'P2' }),
    mk({ number: 3, priority: 'P0' }), mk({ number: 4, priority: null }),
    mk({ number: 5, priority: 'P1' }), mk({ number: 6, closedLocal: new Date(2026, 9, 21) }),
  ];
  expect(remaining(issues).map((i) => i.number)).toEqual([3, 5, 2, 4, 1]);
});

test('inScope filters by milestone, ALL returns everything', () => {
  const issues = [mk({ milestone: 'Beta' }), mk({ milestone: null })];
  expect(inScope(issues, ALL)).toHaveLength(2);
  expect(inScope(issues, 'Beta')).toEqual([issues[0]]);
});

describe('closed with no reason counts as done', () => {
  const when = new Date(2026, 9, 22, 12);
  const noReason = () => mk({ closedLocal: when, stateReason: null });

  test('in progress', () => {
    expect(progress([noReason(), mk()])).toEqual({ closed: 1, total: 2, open: 1, pct: 50 });
  });

  test('in tickets closed per day', () => {
    expect(closedPerDay([noReason()], days).find((d) => d.date === '2026-10-22')!.count).toBe(1);
  });

  test('in the burndown', () => {
    expect(burndown([noReason()], days).map((p) => p.pct)).toEqual([0, 0, 100, 100]);
  });

  test('in the by-label chart', () => {
    expect(byLabel([mk({ closedLocal: when, stateReason: null, labels: ['WEB'] })])).toEqual([
      { label: 'WEB', open: 0, total: 1, pct: 0 },
    ]);
  });
});
