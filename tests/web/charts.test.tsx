// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityChart } from '../../web/components/ActivityChart';
import { Burndown } from '../../web/components/Burndown';
import { LabelBars } from '../../web/components/LabelBars';

beforeAll(() => {
  // Recharts' ResponsiveContainer needs ResizeObserver, which jsdom lacks.
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as never;
});

const lines = [{ date: '2026-10-22', added: 10, removed: 2 }, { date: '2026-10-23', added: 5, removed: 1 }];
const closed = [{ date: '2026-10-22', count: 1 }, { date: '2026-10-23', count: 3 }];

test('activity chart starts on Lines and toggles to Tickets', async () => {
  render(<ActivityChart lines={lines} closed={closed} />);
  const linesBtn = screen.getByRole('button', { name: 'Lines' });
  const ticketsBtn = screen.getByRole('button', { name: 'Tickets' });
  expect(linesBtn).toHaveAttribute('aria-pressed', 'true');
  await userEvent.click(ticketsBtn);
  expect(ticketsBtn).toHaveAttribute('aria-pressed', 'true');
  expect(linesBtn).toHaveAttribute('aria-pressed', 'false');
});

test('burndown title names the milestone', () => {
  render(<Burndown points={[{ date: '2026-10-23', pct: 16 }]} scopeLabel="Beta" />);
  expect(screen.getByRole('heading', { name: 'Burndown · Beta' })).toBeInTheDocument();
});

test('label bars show pct and counts', () => {
  render(<LabelBars rows={[{ label: 'WEB', open: 1, total: 2, pct: 50 }]} scopeLabel="Beta" />);
  expect(screen.getByText('WEB')).toBeInTheDocument();
  expect(screen.getByText('50% · 1 of 2')).toBeInTheDocument();
  expect(screen.getByRole('meter', { name: 'WEB still open' })).toHaveAttribute('aria-valuenow', '50');
});

test('label bars with no rows show an empty message', () => {
  render(<LabelBars rows={[]} scopeLabel="Beta" />);
  expect(screen.getByText('No labelled tickets in Beta')).toBeInTheDocument();
});
