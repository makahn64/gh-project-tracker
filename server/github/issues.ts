import type { TrackerConfig } from '../config';
import type { Issue, Priority } from '../../shared/types';
import { PRIORITIES } from '../../shared/types';
import { bodyPreview } from '../../shared/bodyPreview';
import { graphql } from './graphql';

const QUERY = `
query($owner: String!, $repo: String!, $after: String, $field: String!) {
  repository(owner: $owner, name: $repo) {
    issues(first: 100, after: $after, orderBy: { field: CREATED_AT, direction: ASC }) {
      pageInfo { hasNextPage endCursor }
      nodes {
        number title url body state stateReason createdAt closedAt
        labels(first: 50) { nodes { name } }
        milestone { title }
        projectItems(first: 20) {
          nodes {
            id
            project { number owner { ... on User { login } ... on Organization { login } } }
            fieldValueByName(name: $field) { ... on ProjectV2ItemFieldSingleSelectValue { name } }
          }
        }
      }
    }
  }
}`;

interface Node {
  number: number; title: string; url: string; body: string | null;
  state: Issue['state']; stateReason: Issue['stateReason'];
  createdAt: string; closedAt: string | null;
  labels: { nodes: { name: string }[] };
  milestone: { title: string } | null;
  projectItems: { nodes: { id: string; project: { number: number; owner: { login: string } }; fieldValueByName: { name: string } | null }[] };
}

interface Page { repository: { issues: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: Node[] } } }

function toIssue(n: Node, cfg: TrackerConfig): Issue {
  const item = n.projectItems.nodes.find(
    (it) => it.project.number === cfg.projectNumber && it.project.owner.login === cfg.projectOwner,
  );
  const value = item?.fieldValueByName?.name;
  return {
    number: n.number,
    title: n.title,
    url: n.url,
    bodyPreview: bodyPreview(n.body),
    state: n.state,
    stateReason: n.stateReason,
    createdAt: n.createdAt,
    closedAt: n.closedAt,
    labels: n.labels.nodes.map((l) => l.name),
    milestone: n.milestone?.title ?? null,
    priority: PRIORITIES.includes(value as Priority) ? (value as Priority) : null,
    projectItemId: item?.id ?? null,
  };
}

export async function fetchIssues(cfg: TrackerConfig, token: string, fetchFn: typeof fetch = fetch): Promise<Issue[]> {
  const issues: Issue[] = [];
  let after: string | null = null;
  do {
    const data: Page = await graphql<Page>(token, QUERY, { owner: cfg.owner, repo: cfg.repo, after, field: cfg.priorityField }, fetchFn);
    const { nodes, pageInfo } = data.repository.issues;
    issues.push(...nodes.map((n) => toIssue(n, cfg)));
    after = pageInfo.hasNextPage ? pageInfo.endCursor : null;
  } while (after);
  return issues;
}
