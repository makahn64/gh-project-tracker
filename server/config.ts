import { existsSync, readFileSync } from 'node:fs';

export interface TrackerConfig {
  owner: string;
  repo: string;
  branch: string;
  projectOwner: string;
  projectNumber: number;
  defaultMilestone: string;
  priorityField: string;
  excludeGlobs: string[];
  port: number;
}

const KEYS: (keyof TrackerConfig)[] = [
  'owner', 'repo', 'branch', 'projectOwner', 'projectNumber',
  'defaultMilestone', 'priorityField', 'excludeGlobs', 'port',
];

export function loadConfig(path: string): TrackerConfig {
  if (!existsSync(path)) {
    throw new Error(`No ${path} found. Create one from the example: cp tracker.config.example.json tracker.config.json`);
  }
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  const missing = KEYS.filter((k) => raw[k] === undefined);
  if (missing.length) throw new Error(`${path} is missing: ${missing.join(', ')}`);
  return raw as TrackerConfig;
}
