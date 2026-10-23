import type { TrackerConfig } from '../config';
import type { Priority } from '../../shared/types';
import { PRIORITIES } from '../../shared/types';
import { graphql } from './graphql';

export interface Meta {
  labels: string[];
  milestones: string[];
  milestoneNumbers: Record<string, number>;
  projectId: string;
  fieldId: string;
  options: Record<Priority, string>;
}

const QUERY = `
query($owner: String!, $repo: String!, $projectOwner: String!, $number: Int!, $field: String!) {
  repository(owner: $owner, name: $repo) {
    labels(first: 100) { nodes { name } }
    milestones(first: 100, states: OPEN) { nodes { title number } }
  }
  user(login: $projectOwner) {
    projectV2(number: $number) {
      id
      field(name: $field) { ... on ProjectV2SingleSelectField { id options { id name } } }
    }
  }
}`;

interface Data {
  repository: { labels: { nodes: { name: string }[] }; milestones: { nodes: { title: string; number: number }[] } };
  user: { projectV2: { id: string; field: { id?: string; options?: { id: string; name: string }[] } | null } | null } | null;
}

export async function fetchMeta(cfg: TrackerConfig, token: string, fetchFn: typeof fetch = fetch): Promise<Meta> {
  const d = await graphql<Data>(token, QUERY, {
    owner: cfg.owner, repo: cfg.repo, projectOwner: cfg.projectOwner, number: cfg.projectNumber, field: cfg.priorityField,
  }, fetchFn);
  const project = d.user?.projectV2;
  if (!project) {
    throw new Error(`Can't find project board #${cfg.projectNumber} owned by ${cfg.projectOwner}. Check projectOwner and projectNumber in tracker.config.json (only boards owned by a user account are supported).`);
  }
  const field = project.field;
  if (!field?.id || !field.options) throw new Error(`Project board has no single-select field named "${cfg.priorityField}"`);
  const options = {} as Record<Priority, string>;
  for (const o of field.options) if (PRIORITIES.includes(o.name as Priority)) options[o.name as Priority] = o.id;
  const missing = PRIORITIES.filter((p) => !options[p]);
  if (missing.length) throw new Error(`The "${cfg.priorityField}" field is missing options: ${missing.join(', ')}`);
  const ms = d.repository.milestones.nodes;
  return {
    labels: d.repository.labels.nodes.map((l) => l.name).sort((a, b) => a.localeCompare(b)),
    milestones: ms.map((m) => m.title),
    milestoneNumbers: Object.fromEntries(ms.map((m) => [m.title, m.number])),
    projectId: project.id,
    fieldId: field.id,
    options,
  };
}
