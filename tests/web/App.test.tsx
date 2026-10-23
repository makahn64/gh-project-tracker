// @vitest-environment jsdom
import { StrictMode } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../web/App';
import { api } from '../../web/api';
import { trackerData } from './data';

vi.mock('../../web/api', () => ({
  api: { getData: vi.fn(), setPriority: vi.fn(), editLabels: vi.fn(), setMilestone: vi.fn() },
}));
const getData = vi.mocked(api.getData);

beforeEach(() => getData.mockReset());

test('shows loading, then the three tiles for the default milestone', async () => {
  getData.mockResolvedValue(trackerData());
  render(<App />);
  expect(screen.getByText('Loading…')).toBeInTheDocument();
  const progress = await screen.findByRole('region', { name: 'Beta progress' });
  expect(within(progress).getByText('16% done')).toBeInTheDocument();
  expect(within(progress).getByText('6 of 38 tickets closed · 32 open')).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Lines changed · 14d' })).toHaveTextContent('+8,412 / −3,105');
  expect(screen.getByRole('region', { name: 'Tickets closed · 14d' })).toHaveTextContent('7');
});

test('switching to All tickets updates progress without refetching', async () => {
  getData.mockResolvedValue(trackerData());
  render(<App />);
  await screen.findByRole('region', { name: 'Beta progress' });
  await userEvent.selectOptions(screen.getByLabelText('Milestone'), 'All tickets');
  const progress = screen.getByRole('region', { name: 'All tickets progress' });
  expect(progress).toHaveTextContent('7 of 40 tickets closed · 33 open');
  expect(getData).toHaveBeenCalledTimes(1);
});

test('a load error is shown and Refresh retries', async () => {
  getData.mockRejectedValueOnce(new Error('rate limited')).mockResolvedValueOnce(trackerData());
  render(<App />);
  expect(await screen.findByText(/rate limited/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  expect(await screen.findByRole('region', { name: 'Beta progress' })).toBeInTheDocument();
});

test('no default milestone starts on All tickets', async () => {
  getData.mockResolvedValue(trackerData({ defaultMilestone: null }));
  render(<App />);
  expect(await screen.findByRole('region', { name: 'All tickets progress' })).toBeInTheDocument();
  expect(screen.getByLabelText('Milestone')).toHaveDisplayValue('All tickets');
});

test('an older load failing after a newer one succeeded shows no error', async () => {
  let rejectFirst!: (e: Error) => void;
  getData
    .mockReturnValueOnce(new Promise((_, rej) => { rejectFirst = rej; }))
    .mockResolvedValueOnce(trackerData());
  render(<StrictMode><App /></StrictMode>);
  await screen.findByRole('region', { name: 'Beta progress' });
  rejectFirst(new Error('git fetch failed'));
  await new Promise((r) => setTimeout(r, 0));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('after refresh, a milestone that closed falls back to All tickets', async () => {
  getData
    .mockResolvedValueOnce(trackerData())
    .mockResolvedValueOnce(trackerData({ milestones: [], defaultMilestone: null }));
  render(<App />);
  await screen.findByRole('region', { name: 'Beta progress' });
  await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  expect(await screen.findByRole('region', { name: 'All tickets progress' })).toBeInTheDocument();
  expect(screen.getByLabelText('Milestone')).toHaveDisplayValue('All tickets');
});
