import { fetchIssues } from '../../server/github/issues';
import { graphql } from '../../server/github/graphql';
import { fetchMeta } from '../../server/github/meta';
import type { TrackerConfig } from '../../server/config';
import { fakeFetch } from './fakeFetch';

const cfg: TrackerConfig = {
  owner: 'acme', repo: 'r', branch: 'development', projectOwner: 'acme', projectNumber: 1,
  defaultMilestone: 'Beta', priorityField: 'Priority', excludeGlobs: [], port: 5174,
};

function node(number: number, extra: object = {}) {
  return {
    number, title: `T${number}`, url: `https://x/${number}`, body: '**hi**', state: 'OPEN', stateReason: null,
    createdAt: '2026-10-01T00:00:00Z', closedAt: null,
    labels: { nodes: [{ name: 'WEB' }] }, milestone: { title: 'Beta' },
    projectItems: { nodes: [] }, ...extra,
  };
}

function page(nodes: object[], hasNextPage: boolean, endCursor: string | null) {
  return { json: { data: { repository: { issues: { pageInfo: { hasNextPage, endCursor }, nodes } } } } };
}

test('fetchIssues follows pagination until the last page', async () => {
  const p1 = Array.from({ length: 100 }, (_, i) => node(i + 1));
  const p2 = Array.from({ length: 30 }, (_, i) => node(i + 101));
  const f = fakeFetch([page(p1, true, 'CUR1'), page(p2, false, null)]);
  const issues = await fetchIssues(cfg, 'tok', f.fn);
  expect(issues).toHaveLength(130);
  expect(f.calls[0].body.variables.after).toBeNull();
  expect(f.calls[1].body.variables.after).toBe('CUR1');
  expect(issues[0]).toMatchObject({ number: 1, bodyPreview: 'hi', labels: ['WEB'], milestone: 'Beta' });
});

test('priority comes from the configured board only', async () => {
  const onBoard = node(1, { projectItems: { nodes: [
    { id: 'ITEM1', project: { number: 1, owner: { login: 'acme' } }, fieldValueByName: { name: 'P1' } },
  ] } });
  const otherBoard = node(2, { projectItems: { nodes: [
    { id: 'ITEM2', project: { number: 9, owner: { login: 'acme' } }, fieldValueByName: { name: 'P0' } },
  ] } });
  const onBoardNoPriority = node(3, { projectItems: { nodes: [
    { id: 'ITEM3', project: { number: 1, owner: { login: 'acme' } }, fieldValueByName: null },
  ] } });
  const f = fakeFetch([page([onBoard, otherBoard, onBoardNoPriority], false, null)]);
  const [a, b, c] = await fetchIssues(cfg, 'tok', f.fn);
  expect(a).toMatchObject({ priority: 'P1', projectItemId: 'ITEM1' });
  expect(b).toMatchObject({ priority: null, projectItemId: null });
  expect(c).toMatchObject({ priority: null, projectItemId: 'ITEM3' });
});

test('graphql rejects with the first GraphQL error message', async () => {
  const f = fakeFetch([{ json: { errors: [{ message: 'Bad credentials' }] } }]);
  await expect(graphql('tok', 'query{x}', {}, f.fn)).rejects.toThrow(/Bad credentials/);
});

test('graphql rejects on HTTP error status', async () => {
  const f = fakeFetch([{ status: 401, json: { message: 'Requires authentication' } }]);
  await expect(graphql('tok', 'query{x}', {}, f.fn)).rejects.toThrow(/Requires authentication/);
});

test('graphql sends the token as a bearer header', async () => {
  let auth = '';
  const fn = (async (_u: string, init: RequestInit) => {
    auth = new Headers(init.headers).get('authorization') ?? '';
    return new Response(JSON.stringify({ data: {} }));
  }) as unknown as typeof fetch;
  await graphql('tok', 'query{x}', {}, fn);
  expect(auth).toBe('Bearer tok');
});

test('fetchMeta returns labels, open milestones and board priority ids', async () => {
  const f = fakeFetch([{ json: { data: {
    repository: {
      labels: { nodes: [{ name: 'WEB' }, { name: 'AI' }] },
      milestones: { nodes: [{ title: 'Beta', number: 1 }] },
    },
    user: { projectV2: { id: 'PROJ', field: { id: 'FIELD', options: [
      { id: 'o0', name: 'P0' }, { id: 'o1', name: 'P1' }, { id: 'o2', name: 'P2' },
    ] } } },
  } } }]);
  expect(await fetchMeta(cfg, 'tok', f.fn)).toEqual({
    labels: ['AI', 'WEB'], milestones: ['Beta'], milestoneNumbers: { Beta: 1 },
    projectId: 'PROJ', fieldId: 'FIELD', options: { P0: 'o0', P1: 'o1', P2: 'o2' },
  });
});

function metaResponse(user: unknown) {
  return { json: { data: {
    repository: { labels: { nodes: [] }, milestones: { nodes: [] } },
    user,
  } } };
}

test('fetchMeta explains a board it cannot find', async () => {
  const f = fakeFetch([metaResponse(null)]);
  await expect(fetchMeta(cfg, 'tok', f.fn)).rejects.toThrow(/project board #1 owned by acme/i);
  const g = fakeFetch([metaResponse({ projectV2: null })]);
  await expect(fetchMeta(cfg, 'tok', g.fn)).rejects.toThrow(/project board #1 owned by acme/i);
});

test('fetchMeta explains a priority field that is not single-select', async () => {
  const f = fakeFetch([metaResponse({ projectV2: { id: 'P', field: {} } })]);
  await expect(fetchMeta(cfg, 'tok', f.fn)).rejects.toThrow(/single-select field named "Priority"/);
});

test('fetchMeta names missing priority options', async () => {
  const f = fakeFetch([metaResponse({ projectV2: { id: 'P', field: { id: 'F', options: [{ id: 'o0', name: 'P0' }] } } })]);
  await expect(fetchMeta(cfg, 'tok', f.fn)).rejects.toThrow(/missing options: P1, P2/);
});
