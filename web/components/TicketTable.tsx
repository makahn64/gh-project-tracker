import { useMemo } from 'react';
import type { Issue } from '../../shared/types';
import { remaining } from '../../shared/metrics';
import { PriorityCell } from './PriorityCell';
import { LabelsCell } from './LabelsCell';
import { MilestoneCell } from './MilestoneCell';

/**
 * Rows come from the issues as loaded; edits don't re-sort or remove rows,
 * so nothing jumps mid-triage. Refresh rebuilds the list. Each cell writes a
 * saved value back onto its loaded issue, so a rebuilt table (e.g. after
 * switching milestone) shows it without a refetch.
 */
export function TicketTable({ issues, labels, milestones }: { issues: Issue[]; labels: string[]; milestones: string[] }) {
  const rows = useMemo(() => remaining(issues), [issues]);

  return (
    <section className="panel" aria-labelledby="table-title">
      <h2 className="label" id="table-title">Remaining tickets · {rows.length}</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Ticket</th>
              <th>Priority</th>
              <th>Labels</th>
              <th>Milestone</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.number} aria-label={`#${i.number}`}>
                <td><a href={i.url} target="_blank" rel="noreferrer">{i.number}</a></td>
                <td>
                  <a className="ticket-title" href={i.url} target="_blank" rel="noreferrer">{i.title}</a>
                  {i.bodyPreview && <p className="ticket-body">{i.bodyPreview}</p>}
                </td>
                <td><PriorityCell issue={i} /></td>
                <td><LabelsCell issue={i} labels={labels} /></td>
                <td><MilestoneCell issue={i} milestones={milestones} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
