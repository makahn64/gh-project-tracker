import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readLines } from '../../server/git/repoCache';
import { lastNDays } from '../../shared/days';
import type { TrackerConfig } from '../../server/config';

const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8' });

function makeRemote() {
  const dir = mkdtempSync(join(tmpdir(), 'remote-'));
  git(dir, 'init', '-q', '-b', 'development');
  git(dir, 'config', 'user.email', 't@t'); git(dir, 'config', 'user.name', 't');
  writeFileSync(join(dir, 'a.ts'), 'one\ntwo\nthree\n');
  writeFileSync(join(dir, 'pnpm-lock.yaml'), 'x\n'.repeat(500));
  git(dir, 'add', '.'); git(dir, 'commit', '-qm', 'first');
  return dir;
}

const cfg: TrackerConfig = {
  owner: 'o', repo: 'r', branch: 'development', projectOwner: 'o', projectNumber: 1,
  defaultMilestone: 'Beta', priorityField: 'Priority', excludeGlobs: ['**/pnpm-lock.yaml'], port: 0,
};

test('clones once, then fetches new commits, and counts today', async () => {
  const remote = makeRemote();
  const cacheDir = mkdtempSync(join(tmpdir(), 'cache-'));
  const days = lastNDays(new Date(), 3);

  const first = await readLines(cfg, 'tok', days, { cacheDir, remoteUrl: remote });
  expect(first[2]).toEqual({ date: days[2], added: 3, removed: 0 });

  writeFileSync(join(remote, 'a.ts'), 'one\n');
  git(remote, 'commit', '-qam', 'second');
  const second = await readLines(cfg, 'tok', days, { cacheDir, remoteUrl: remote });
  expect(second[2]).toEqual({ date: days[2], added: 3, removed: 2 });
});

test('the cached clone does not store the token', async () => {
  const remote = makeRemote();
  const cacheDir = mkdtempSync(join(tmpdir(), 'cache-'));
  await readLines(cfg, 'SECRET_TOKEN', lastNDays(new Date(), 1), { cacheDir, remoteUrl: remote });
  const config = execFileSync('git', ['config', '--list'], { cwd: join(cacheDir, 'o__r.git'), encoding: 'utf8' });
  expect(config).not.toContain('SECRET_TOKEN');
});

test('a failing git command does not leak the token in its error', async () => {
  const cacheDir = mkdtempSync(join(tmpdir(), 'cache-'));
  const token = 'SECRET_TOKEN';
  const encoded = Buffer.from(`x-access-token:${token}`).toString('base64');
  const err = await readLines(cfg, token, lastNDays(new Date(), 1), { cacheDir, remoteUrl: '/nonexistent/repo' })
    .catch((e: Error) => e);
  expect(err).toBeInstanceOf(Error);
  expect((err as Error).message).not.toContain(encoded);
  expect((err as Error).message).not.toContain(token);
});

test('two loads at once on a fresh cache both succeed', async () => {
  const remote = makeRemote();
  const cacheDir = mkdtempSync(join(tmpdir(), 'cache-'));
  const days = lastNDays(new Date(), 1);
  const [a, b] = await Promise.all([
    readLines(cfg, 'tok', days, { cacheDir, remoteUrl: remote }),
    readLines(cfg, 'tok', days, { cacheDir, remoteUrl: remote }),
  ]);
  expect(a[0].added).toBe(3);
  expect(b[0].added).toBe(3);
});

test('a commit behind an older-dated commit is still counted', async () => {
  const remote = makeRemote();
  const old = new Date(Date.now() - 30 * 86400_000).toISOString();
  writeFileSync(join(remote, 'b.ts'), 'x\n');
  git(remote, 'add', '.');
  execFileSync('git', ['commit', '-qm', 'old-dated'], { cwd: remote, env: { ...process.env, GIT_COMMITTER_DATE: old, GIT_AUTHOR_DATE: old } });
  const cacheDir = mkdtempSync(join(tmpdir(), 'cache-'));
  const r = await readLines(cfg, 'tok', lastNDays(new Date(), 1), { cacheDir, remoteUrl: remote });
  expect(r[0].added).toBe(3);
});
