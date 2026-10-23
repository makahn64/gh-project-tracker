import { useState } from 'react';
import type { Issue } from '../../shared/types';
import { api } from '../api';
import { useSave } from '../useSave';

export function LabelsCell({ issue, labels }: { issue: Issue; labels: string[] }) {
  const { value, busy, error, set } = useSave<string[]>(issue.labels, async (next, prev) => {
    const add = next.filter((l) => !prev.includes(l));
    const remove = prev.filter((l) => !next.includes(l));
    const saved = (await api.editLabels(issue.number, add, remove)).labels;
    issue.labels = saved;
    return saved;
  });
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const shown = labels.filter((l) => l.toLowerCase().includes(filter.toLowerCase()));

  const toggle = (label: string) =>
    set(value.includes(label) ? value.filter((l) => l !== label) : [...value, label]);

  return (
    <>
      <div className="chips">
        {value.map((l) => (
          <span className="chip" key={l}>
            {l}
            <button aria-label={`Remove ${l}`} disabled={busy} onClick={() => toggle(l)}>×</button>
          </span>
        ))}
        <button className="add-label" aria-label="Add label" aria-expanded={open} onClick={() => setOpen(!open)}>
          + add
        </button>
      </div>
      {open && (
        <div className="picker">
          <input
            placeholder="Filter labels…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
            autoFocus
          />
          {shown.map((l) => (
            <label key={l}>
              <input type="checkbox" checked={value.includes(l)} disabled={busy} onChange={() => toggle(l)} />
              {l}
            </label>
          ))}
        </div>
      )}
      {error && <p className="row-error">{error}</p>}
    </>
  );
}
