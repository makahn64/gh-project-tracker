import { createApp, type AppDeps } from '../../server/app';
import { cfg, meta } from './fixtures';

const issue = {
  number: 1, title: 't', url: 'u', bodyPreview: '', state: 'OPEN' as const, stateReason: null,
  createdAt: '2026-10-01T00:00:00Z', closedAt: null, labels: [], milestone: 'Beta', priority: null, projectItemId: null,
};

function deps(over: Partial<AppDeps> = {}): AppDeps {
  return {
    cfg, token: 'SECRET_TOKEN',
    fetchIssues: async () => [issue],
    fetchMeta: async () => meta,
    readLines: async (_c, _t, days) => days.map((date) => ({ date, added: 1, removed: 0 })),
    now: () => new Date(2026, 9, 23, 12),
    ...over,
  };
}

test('GET /api/data returns issues, 14 days, lines and meta', async () => {
  const res = await createApp(deps()).request('/api/data');
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.issues).toHaveLength(1);
  expect(body.days).toHaveLength(14);
  expect(body.days[13]).toBe('2026-10-23');
  expect(body.lines).toHaveLength(14);
  expect(body).toMatchObject({
    labels: ['AI', 'WEB'], milestones: ['Beta'], defaultMilestone: 'Beta',
    repoName: 'acme/widgets', branch: 'development',
  });
});

test('default milestone is null when it is not an open milestone', async () => {
  const res = await createApp(deps({ fetchMeta: async () => ({ ...meta, milestones: [] }) })).request('/api/data');
  expect((await res.json()).defaultMilestone).toBeNull();
});

test('a GitHub failure returns 502 with the message', async () => {
  const res = await createApp(deps({ fetchIssues: async () => { throw new Error('rate limited'); } })).request('/api/data');
  expect(res.status).toBe(502);
  expect(await res.json()).toEqual({ error: 'rate limited' });
});

test('the token never appears in a response', async () => {
  const res = await createApp(deps()).request('/api/data');
  expect(await res.text()).not.toContain('SECRET_TOKEN');
});
