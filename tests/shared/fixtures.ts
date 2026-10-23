import type { Issue } from '../../shared/types';

let n = 1000;
/** Build an Issue with sensible defaults; closedAt given as a local Date. */
export function mk(p: Partial<Issue> & { closedLocal?: Date } = {}): Issue {
  const { closedLocal, ...rest } = p;
  const closed = closedLocal !== undefined || p.state === 'CLOSED';
  return {
    number: n++,
    title: 't',
    url: 'u',
    bodyPreview: '',
    state: closed ? 'CLOSED' : 'OPEN',
    stateReason: closed ? 'COMPLETED' : null,
    createdAt: new Date(2026, 0, 1).toISOString(),
    closedAt: closedLocal ? closedLocal.toISOString() : null,
    labels: [],
    milestone: null,
    priority: null,
    projectItemId: null,
    ...rest,
  };
}
