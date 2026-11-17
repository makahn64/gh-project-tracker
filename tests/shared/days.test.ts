import { MAX_SPAN, MIN_SPAN, lastNDays, localDay, zoomIn, zoomOut } from '../../shared/days';

test('lastNDays returns 14 local dates oldest first ending today', () => {
  const d = lastNDays(new Date(2026, 9, 23, 9, 0), 14);
  expect(d).toHaveLength(14);
  expect(d[0]).toBe('2026-10-10');
  expect(d[13]).toBe('2026-10-23');
});

test('lastNDays crosses a month boundary', () => {
  const d = lastNDays(new Date(2026, 10, 3, 9, 0), 5);
  expect(d).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03']);
});

test('localDay uses local time zone', () => {
  const iso = new Date(2026, 9, 22, 23, 30).toISOString();
  expect(localDay(iso)).toBe('2026-10-22');
});

test('zoom steps a week at a time between 2 and 13 weeks', () => {
  expect(zoomOut(14)).toBe(21);
  expect(zoomOut(MAX_SPAN)).toBe(MAX_SPAN);
  expect(zoomIn(21)).toBe(14);
  expect(zoomIn(MIN_SPAN)).toBe(MIN_SPAN);
  expect(MIN_SPAN).toBe(14);
  expect(MAX_SPAN).toBe(91);
});
