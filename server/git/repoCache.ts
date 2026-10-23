import { execFile } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import type { TrackerConfig } from '../config';
import type { DayLines } from '../../shared/types';
import { parseNumstat } from './numstat';

const exec = promisify(execFile);

interface Options { cacheDir?: string; remoteUrl?: string }

/** Runs git; on failure throws git's own stderr only, never the command line (which holds the auth header). */
async function git(args: string[], cwd?: string): Promise<string> {
  try {
    return (await exec('git', args, { cwd, maxBuffer: 256 * 1024 * 1024 })).stdout;
  } catch (e) {
    const stderr = String((e as { stderr?: string }).stderr ?? '').trim();
    throw new Error(`git ${args.find((a) => !a.startsWith('-') && !a.startsWith('http.')) ?? ''} failed: ${stderr || 'unknown error'}`);
  }
}

/** Auth passed per command so the token never lands in the clone's config. */
const authArgs = (token: string) => [
  '-c', `http.extraHeader=Authorization: Basic ${Buffer.from(`x-access-token:${token}`).toString('base64')}`,
];

/** Bare clone of the repo in the cache dir, created or fetched up to date. Returns its path. */
export async function ensureRepo(cfg: TrackerConfig, token: string, opts: Options = {}): Promise<string> {
  const cacheDir = resolve(opts.cacheDir ?? '.cache');
  const url = opts.remoteUrl ?? `https://github.com/${cfg.owner}/${cfg.repo}.git`;
  const path = join(cacheDir, `${cfg.owner}__${cfg.repo}.git`);
  if (!existsSync(path)) {
    mkdirSync(cacheDir, { recursive: true });
    await git([...authArgs(token), 'clone', '--bare', '--single-branch', '--branch', cfg.branch, url, path]);
  } else {
    await git([...authArgs(token), 'fetch', 'origin', `+${cfg.branch}:${cfg.branch}`], path);
  }
  return path;
}

// One git operation at a time: two clones or fetches into the same bare repo clash.
let queue: Promise<unknown> = Promise.resolve();

export function readLines(cfg: TrackerConfig, token: string, days: string[], opts: Options = {}): Promise<DayLines[]> {
  const run = queue.then(async () => {
    const path = await ensureRepo(cfg, token, opts);
    // --since-as-filter checks every commit; plain --since stops at the first older-dated one.
    const log = await git(['log', cfg.branch, `--since-as-filter=${days[0]}T00:00`, '--no-merges', '--numstat', '--format=__C__%cI'], path);
    return parseNumstat(log, cfg.excludeGlobs, days);
  });
  queue = run.catch(() => {});
  return run;
}
