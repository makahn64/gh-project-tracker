import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { loadConfig } from './config';
import { AuthError, getToken } from './auth';
import { createApp } from './app';
import { fetchIssues } from './github/issues';
import { fetchMeta } from './github/meta';
import { readLines } from './git/repoCache';

let cfg: ReturnType<typeof loadConfig>;
try {
  cfg = loadConfig('tracker.config.json');
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}

let token: string;
try {
  token = getToken();
} catch (e) {
  if (e instanceof AuthError) {
    console.error(e.message);
    process.exit(1);
  }
  throw e;
}

const app = createApp({ cfg, token, fetchIssues, fetchMeta, readLines });
app.use('/*', serveStatic({ root: './dist' }));

serve({ fetch: app.fetch, hostname: '127.0.0.1', port: cfg.port }, (info) => {
  console.log(`Project tracker: http://127.0.0.1:${info.port}`);
});
