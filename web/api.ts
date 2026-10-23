import type { Priority, TrackerData } from '../shared/types';

async function call<T>(method: string, path: string, body?: object): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

export const api = {
  getData: () => call<TrackerData>('GET', '/api/data'),
  setPriority: (n: number, priority: Priority | null, projectItemId: string | null) =>
    call<{ projectItemId: string }>('PUT', `/api/issues/${n}/priority`, { priority, projectItemId }),
  editLabels: (n: number, add: string[], remove: string[]) =>
    call<{ labels: string[] }>('PUT', `/api/issues/${n}/labels`, { add, remove }),
  setMilestone: (n: number, milestone: string | null) =>
    call<{ milestone: string | null }>('PUT', `/api/issues/${n}/milestone`, { milestone }),
};
