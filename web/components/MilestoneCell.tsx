import type { Issue } from '../../shared/types';
import { api } from '../api';
import { useSave } from '../useSave';

export function MilestoneCell({ issue, milestones }: { issue: Issue; milestones: string[] }) {
  const { value, busy, error, set } = useSave<string | null>(issue.milestone, async (next) => {
    const { milestone } = await api.setMilestone(issue.number, next);
    issue.milestone = milestone;
    return milestone;
  });
  // Keep showing a milestone the ticket has even if it's closed and not in the list.
  const options = value && !milestones.includes(value) ? [...milestones, value] : milestones;

  return (
    <>
      <select
        aria-label={`Milestone for #${issue.number}`}
        value={value ?? ''}
        disabled={busy}
        onChange={(e) => set(e.target.value || null)}
      >
        <option value="">—</option>
        {options.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      {error && <p className="row-error">{error}</p>}
    </>
  );
}
