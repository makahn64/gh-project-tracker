import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfig } from '../../server/config';

const full = {
  owner: 'o', repo: 'r', branch: 'development', projectOwner: 'o', projectNumber: 1,
  defaultMilestone: 'Beta', priorityField: 'Priority', excludeGlobs: ['**/*.lock'], port: 5174,
};

function write(obj: object) {
  const p = join(mkdtempSync(join(tmpdir(), 'cfg-')), 'tracker.config.json');
  writeFileSync(p, JSON.stringify(obj));
  return p;
}

test('loadConfig reads a complete config', () => {
  expect(loadConfig(write(full))).toEqual(full);
});

test('loadConfig throws naming a missing key', () => {
  const { branch, ...rest } = full;
  expect(() => loadConfig(write(rest))).toThrow(/branch/);
});

test('example config file is valid', () => {
  expect(loadConfig('tracker.config.example.json').branch).toBe('main');
});

test('a missing config file says to copy the example', () => {
  expect(() => loadConfig(join(tmpdir(), 'nope', 'tracker.config.json'))).toThrow(/cp tracker.config.example.json tracker.config.json/);
});
