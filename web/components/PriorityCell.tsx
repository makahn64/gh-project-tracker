import { useMemo } from 'react';
import type { Issue, Priority } from '../../shared/types';
import { PRIORITIES } from '../../shared/types';
import { api } from '../api';
import { useSave } from '../useSave';

interface State { priority: Priority | null; itemId: string | null }

export function PriorityCell({ issue }: { issue: Issue }) {
  const initial = useMemo(() => ({ priority: issue.priority, itemId: issue.projectItemId }), [issue]);
  const { value, busy, error, set } = useSave<State>(initial, async (next, prev) => {
    // The first save may add the ticket to the board, which gives it an item id.
    const { projectItemId } = await api.setPriority(issue.number, next.priority, prev.itemId);
    Object.assign(issue, { priority: next.priority, projectItemId });
    return { priority: next.priority, itemId: projectItemId };
  });

  return (
    <>
      <select
        aria-label={`Priority for #${issue.number}`}
        value={value.priority ?? ''}
        disabled={busy}
        onChange={(e) => set({ ...value, priority: (e.target.value || null) as Priority | null })}
      >
        <option value="">—</option>
        {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      {error && <p className="row-error">{error}</p>}
    </>
  );
}
