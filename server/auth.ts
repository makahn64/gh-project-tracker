import { spawnSync } from 'node:child_process';

export class AuthError extends Error {}

type Run = (cmd: string, args: string[]) => { stdout: string; stderr: string; missing?: boolean };

const run: Run = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  return { stdout: r.stdout ?? '', stderr: r.stderr ?? '', missing: (r.error as NodeJS.ErrnoException)?.code === 'ENOENT' };
};

/** The gh CLI's token, checked for the project scope the board needs. */
export function getToken(runCmd: Run = run): string {
  const res = runCmd('gh', ['auth', 'token']);
  if (res.missing) throw new AuthError('GitHub CLI (gh) is not installed. Install it from https://cli.github.com, then run: gh auth login');
  const token = res.stdout.trim();
  if (!token || /\s/.test(token)) throw new AuthError('GitHub CLI is not logged in. Run: gh auth login');
  const status = runCmd('gh', ['auth', 'status']);
  if (!/'project'/.test(status.stdout + status.stderr)) {
    throw new AuthError('GitHub CLI login is missing the project scope. Run: gh auth refresh -s project');
  }
  return token;
}
