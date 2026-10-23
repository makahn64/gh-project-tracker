// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketTable } from '../../web/components/TicketTable';
import { api } from '../../web/api';
import { mk } from '../shared/fixtures';

vi.mock('../../web/api', () => ({
  api: { getData: vi.fn(), setPriority: vi.fn(), editLabels: vi.fn(), setMilestone: vi.fn() },
}));
const m = vi.mocked(api);
beforeEach(() => vi.resetAllMocks());

const props = { labels: ['AI', 'WEB', 'bug'], milestones: ['Beta'] };
const row = (n: number) => screen.getByRole('row', { name: new RegExp(`^#${n}\\b`) });

test('rows are sorted P0, P1, P2, then no priority, and closed tickets are left out', () => {
  render(<TicketTable {...props} issues={[
    mk({ number: 1 }), mk({ number: 2, priority: 'P2' }), mk({ number: 3, priority: 'P0' }),
    mk({ number: 4, priority: 'P1' }), mk({ number: 5, closedLocal: new Date() }),
  ]} />);
  const order = screen.getAllByRole('row').slice(1).map((r) => r.getAttribute('aria-label'));
  expect(order).toEqual(['#3', '#4', '#2', '#1']);
  expect(screen.getByRole('heading', { name: 'Remaining tickets · 4' })).toBeInTheDocument();
});

test('title and description show, and title links to GitHub in a new tab', () => {
  render(<TicketTable {...props} issues={[mk({ number: 7, title: 'Fix map', bodyPreview: 'The map is slow', url: 'https://gh/7' })]} />);
  const link = screen.getByRole('link', { name: 'Fix map' });
  expect(link).toHaveAttribute('href', 'https://gh/7');
  expect(link).toHaveAttribute('target', '_blank');
  expect(screen.getByText('The map is slow')).toBeInTheDocument();
});

test('changing priority saves right away and disables the control while saving', async () => {
  let resolve!: (v: { projectItemId: string }) => void;
  m.setPriority.mockReturnValue(new Promise((r) => { resolve = r; }));
  render(<TicketTable {...props} issues={[mk({ number: 405 })]} />);
  const select = within(row(405)).getByLabelText('Priority for #405');
  await userEvent.selectOptions(select, 'P1');
  expect(m.setPriority).toHaveBeenCalledWith(405, 'P1', null);
  expect(select).toBeDisabled();
  resolve({ projectItemId: 'ITEM' });
  await vi.waitFor(() => expect(select).not.toBeDisabled());
  expect(select).toHaveDisplayValue('P1');
});

test('a later priority change reuses the board item id from the first save', async () => {
  m.setPriority.mockResolvedValueOnce({ projectItemId: 'NEW' }).mockResolvedValueOnce({ projectItemId: 'NEW' });
  render(<TicketTable {...props} issues={[mk({ number: 405 })]} />);
  const select = within(row(405)).getByLabelText('Priority for #405');
  await userEvent.selectOptions(select, 'P1');
  await vi.waitFor(() => expect(select).not.toBeDisabled());
  await userEvent.selectOptions(select, 'P0');
  expect(m.setPriority).toHaveBeenLastCalledWith(405, 'P0', 'NEW');
});

test('a rejected priority save reverts and shows the error on the row', async () => {
  m.setPriority.mockRejectedValue(new Error('Resource not accessible'));
  render(<TicketTable {...props} issues={[mk({ number: 405, priority: 'P2', projectItemId: 'I' })]} />);
  const select = within(row(405)).getByLabelText('Priority for #405');
  await userEvent.selectOptions(select, 'P0');
  expect(await within(row(405)).findByText('Resource not accessible')).toBeInTheDocument();
  expect(select).toHaveDisplayValue('P2');
});

test('removing a label saves, and a failure puts the chip back', async () => {
  m.editLabels.mockRejectedValueOnce(new Error('nope'));
  render(<TicketTable {...props} issues={[mk({ number: 12, labels: ['bug', 'WEB'] })]} />);
  await userEvent.click(within(row(12)).getByRole('button', { name: 'Remove bug' }));
  expect(m.editLabels).toHaveBeenCalledWith(12, [], ['bug']);
  expect(await within(row(12)).findByText('nope')).toBeInTheDocument();
  expect(within(row(12)).getByText('bug')).toBeInTheDocument();
});

test('adding a label from the picker saves it', async () => {
  m.editLabels.mockResolvedValue({ labels: ['WEB', 'AI'] });
  render(<TicketTable {...props} issues={[mk({ number: 12, labels: ['WEB'] })]} />);
  await userEvent.click(within(row(12)).getByRole('button', { name: 'Add label' }));
  await userEvent.type(within(row(12)).getByPlaceholderText('Filter labels…'), 'a');
  expect(within(row(12)).queryByLabelText('bug')).not.toBeInTheDocument();
  await userEvent.click(within(row(12)).getByLabelText('AI'));
  expect(m.editLabels).toHaveBeenCalledWith(12, ['AI'], []);
  expect(await within(row(12)).findByRole('button', { name: 'Remove AI' })).toBeInTheDocument();
});

test('clearing the milestone saves null and the row stays', async () => {
  m.setMilestone.mockResolvedValue({ milestone: null });
  render(<TicketTable {...props} issues={[mk({ number: 12, milestone: 'Beta' })]} />);
  await userEvent.selectOptions(within(row(12)).getByLabelText('Milestone for #12'), '—');
  expect(m.setMilestone).toHaveBeenCalledWith(12, null);
  await vi.waitFor(() => expect(within(row(12)).getByLabelText('Milestone for #12')).not.toBeDisabled());
  expect(row(12)).toBeInTheDocument();
});

test('a saved edit is still shown after the table is rebuilt from the same data', async () => {
  m.setPriority.mockResolvedValue({ projectItemId: 'NEW' });
  m.setMilestone.mockResolvedValue({ milestone: null });
  m.editLabels.mockResolvedValue({ labels: [] });
  const issue = mk({ number: 9, milestone: 'Beta', labels: ['bug'] });
  const { unmount } = render(<TicketTable {...props} issues={[issue]} />);
  await userEvent.selectOptions(within(row(9)).getByLabelText('Priority for #9'), 'P1');
  await vi.waitFor(() => expect(within(row(9)).getByLabelText('Priority for #9')).not.toBeDisabled());
  await userEvent.selectOptions(within(row(9)).getByLabelText('Milestone for #9'), '—');
  await vi.waitFor(() => expect(within(row(9)).getByLabelText('Milestone for #9')).not.toBeDisabled());
  await userEvent.click(within(row(9)).getByRole('button', { name: 'Remove bug' }));
  await vi.waitFor(() => expect(within(row(9)).queryByText('bug')).not.toBeInTheDocument());
  unmount();

  render(<TicketTable {...props} issues={[issue]} />);
  expect(within(row(9)).getByLabelText('Priority for #9')).toHaveDisplayValue('P1');
  expect(within(row(9)).getByLabelText('Milestone for #9')).toHaveDisplayValue('—');
  expect(within(row(9)).queryByText('bug')).not.toBeInTheDocument();
});
