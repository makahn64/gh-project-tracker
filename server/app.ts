import { Hono } from 'hono';
import type { TrackerConfig } from './config';
import type { Meta } from './github/meta';
import type { DayLines, Issue, Priority, TrackerData } from '../shared/types';
import { PRIORITIES } from '../shared/types';
import { editLabels, setMilestone, setPriority } from './github/edits';
import { MAX_SPAN, lastNDays } from '../shared/days';

export interface AppDeps {
  cfg: TrackerConfig;
  token: string;
  fetchIssues: (cfg: TrackerConfig, token: string) => Promise<Issue[]>;
  fetchMeta: (cfg: TrackerConfig, token: string) => Promise<Meta>;
  readLines: (cfg: TrackerConfig, token: string, days: string[]) => Promise<DayLines[]>;
  now?: () => Date;
  fetchFn?: typeof fetch;
}

export function createApp(deps: AppDeps) {
  const { cfg, token } = deps;
  const now = deps.now ?? (() => new Date());
  let meta: Meta | undefined;

  const app = new Hono();

  app.onError((err, c) => c.json({ error: err.message }, 502));

  app.get('/api/data', async (c) => {
    const days = lastNDays(now(), MAX_SPAN);
    const [issues, fresh, lines] = await Promise.all([
      deps.fetchIssues(cfg, token),
      deps.fetchMeta(cfg, token),
      deps.readLines(cfg, token, days),
    ]);
    meta = fresh;
    const data: TrackerData = {
      issues, lines, days,
      labels: meta.labels,
      milestones: meta.milestones,
      defaultMilestone: meta.milestones.includes(cfg.defaultMilestone) ? cfg.defaultMilestone : null,
      repoName: `${cfg.owner}/${cfg.repo}`,
      branch: cfg.branch,
    };
    return c.json(data);
  });

  const getMeta = async () => (meta ??= await deps.fetchMeta(cfg, token));
  const issueNumber = (raw: string) => {
    const n = Number(raw);
    return Number.isInteger(n) && n > 0 ? n : null;
  };

  app.put('/api/issues/:n/priority', async (c) => {
    const n = issueNumber(c.req.param('n'));
    const { priority, projectItemId } = await c.req.json<{ priority: Priority | null; projectItemId: string | null }>();
    if (!n || (priority !== null && !PRIORITIES.includes(priority))) return c.json({ error: 'Unknown priority' }, 400);
    return c.json(await setPriority(token, cfg, await getMeta(), n, projectItemId ?? null, priority, deps.fetchFn));
  });

  app.put('/api/issues/:n/labels', async (c) => {
    const n = issueNumber(c.req.param('n'));
    const { add = [], remove = [] } = await c.req.json<{ add?: string[]; remove?: string[] }>();
    const known = (await getMeta()).labels;
    const unknown = add.filter((l) => !known.includes(l));
    if (!n || unknown.length) return c.json({ error: `Unknown label: ${unknown.join(', ')}` }, 400);
    return c.json({ labels: await editLabels(token, cfg, n, add, remove, deps.fetchFn) });
  });

  app.put('/api/issues/:n/milestone', async (c) => {
    const n = issueNumber(c.req.param('n'));
    const { milestone } = await c.req.json<{ milestone: string | null }>();
    const m = await getMeta();
    if (!n || (milestone !== null && !m.milestones.includes(milestone))) return c.json({ error: 'Unknown milestone' }, 400);
    return c.json({ milestone: await setMilestone(token, cfg, m, n, milestone, deps.fetchFn) });
  });

  return app;
}
