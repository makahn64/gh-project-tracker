import { createApp } from '../../server/app';
import { cfg, meta } from './fixtures';
import { fakeFetch } from './fakeFetch';

function appWith(responses: Parameters<typeof fakeFetch>[0]) {
  const f = fakeFetch(responses);
  const app = createApp({
    cfg, token: 'tok', fetchFn: f.fn,
    fetchIssues: async () => [], fetchMeta: async () => meta, readLines: async () => [],
  });
  const put = (path: string, body: object) =>
    app.request(path, { method: 'PUT', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
  return { put, calls: f.calls };
}

describe('priority', () => {
  test('ticket not on the board is added first, then the field is set', async () => {
    const { put, calls } = appWith([
      { json: { data: { repository: { issue: { id: 'ISSUE_NODE' } } } } },
      { json: { data: { addProjectV2ItemById: { item: { id: 'NEW_ITEM' } } } } },
      { json: { data: { updateProjectV2ItemFieldValue: { projectV2Item: { id: 'NEW_ITEM' } } } } },
    ]);
    const res = await put('/api/issues/405/priority', { priority: 'P1', projectItemId: null });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ projectItemId: 'NEW_ITEM' });
    expect(calls[1].body.variables).toEqual({ projectId: 'PROJ', contentId: 'ISSUE_NODE' });
    expect(calls[2].body.query).toContain('updateProjectV2ItemFieldValue');
    expect(calls[2].body.variables).toMatchObject({ itemId: 'NEW_ITEM', fieldId: 'FIELD', optionId: 'o1' });
  });

  test('clearing priority uses the clear mutation', async () => {
    const { put, calls } = appWith([
      { json: { data: { clearProjectV2ItemFieldValue: { projectV2Item: { id: 'ITEM' } } } } },
    ]);
    const res = await put('/api/issues/405/priority', { priority: null, projectItemId: 'ITEM' });
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(1);
    expect(calls[0].body.query).toContain('clearProjectV2ItemFieldValue');
  });

  test('unknown priority is rejected without calling GitHub', async () => {
    const { put, calls } = appWith([]);
    const res = await put('/api/issues/67/priority', { priority: 'P3', projectItemId: 'ITEM' });
    expect(res.status).toBe(400);
    expect(calls).toHaveLength(0);
  });
});

describe('labels', () => {
  test('adds and removes, returning the final list', async () => {
    const { put, calls } = appWith([
      { json: [{ name: 'bug' }, { name: 'WEB' }] },
      { json: [{ name: 'WEB' }] },
    ]);
    const res = await put('/api/issues/12/labels', { add: ['WEB'], remove: ['bug'] });
    expect(await res.json()).toEqual({ labels: ['WEB'] });
    expect(calls[0]).toMatchObject({ method: 'POST', url: 'https://api.github.com/repos/acme/widgets/issues/12/labels', body: { labels: ['WEB'] } });
    expect(calls[1]).toMatchObject({ method: 'DELETE', url: 'https://api.github.com/repos/acme/widgets/issues/12/labels/bug' });
  });

  test('unknown label is rejected', async () => {
    const { put } = appWith([]);
    expect((await put('/api/issues/12/labels', { add: ['NOPE'], remove: [] })).status).toBe(400);
  });

  test('GitHub refusal comes back as 502 with its message', async () => {
    const { put } = appWith([{ status: 403, json: { message: 'Resource not accessible' } }]);
    const res = await put('/api/issues/12/labels', { add: ['WEB'], remove: [] });
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'Resource not accessible' });
  });
});

describe('milestone', () => {
  test('sets by milestone number', async () => {
    const { put, calls } = appWith([{ json: { milestone: { title: 'Beta' } } }]);
    const res = await put('/api/issues/12/milestone', { milestone: 'Beta' });
    expect(await res.json()).toEqual({ milestone: 'Beta' });
    expect(calls[0]).toMatchObject({ method: 'PATCH', body: { milestone: 1 } });
  });

  test('null removes the milestone', async () => {
    const { put, calls } = appWith([{ json: { milestone: null } }]);
    const res = await put('/api/issues/12/milestone', { milestone: null });
    expect(await res.json()).toEqual({ milestone: null });
    expect(calls[0].body).toEqual({ milestone: null });
  });

  test('unknown milestone is rejected', async () => {
    const { put } = appWith([]);
    expect((await put('/api/issues/12/milestone', { milestone: 'Gamma' })).status).toBe(400);
  });
});
