import { AuthError, getToken } from '../../server/auth';

const runner = (token: string, status: string) => (_cmd: string, args: string[]) =>
  args[1] === 'token' ? { stdout: token, stderr: '' } : { stdout: '', stderr: status };

test('missing login tells the user to run gh auth login', () => {
  expect(() => getToken(runner('', ''))).toThrow(AuthError);
  expect(() => getToken(runner('', ''))).toThrow(/gh auth login/);
});

test('token without project scope tells the user to add it', () => {
  expect(() => getToken(runner('gho_x', "Token scopes: 'repo', 'read:org'"))).toThrow(/gh auth refresh -s project/);
});

test('token with project scope is returned', () => {
  expect(getToken(runner('gho_x\n', "Token scopes: 'project', 'repo'"))).toBe('gho_x');
});

test('stderr noise from gh does not end up in the token', () => {
  const run = (_c: string, args: string[]) => args[1] === 'token'
    ? { stdout: 'gho_x\n', stderr: 'A new release of gh is available\n' }
    : { stdout: '', stderr: "Token scopes: 'project', 'repo'" };
  expect(getToken(run)).toBe('gho_x');
});
