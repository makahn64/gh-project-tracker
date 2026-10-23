import type { TrackerConfig } from '../config';
import type { Priority } from '../../shared/types';
import type { Meta } from './meta';
import { graphql } from './graphql';
import { rest } from './rest';

const ISSUE_ID = `query($owner: String!, $repo: String!, $number: Int!) { repository(owner: $owner, name: $repo) { issue(number: $number) { id } } }`;
const ADD_ITEM = `mutation($projectId: ID!, $contentId: ID!) { addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) { item { id } } }`;
const SET_FIELD = `mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
  updateProjectV2ItemFieldValue(input: { projectId: $projectId, itemId: $itemId, fieldId: $fieldId, value: { singleSelectOptionId: $optionId } }) { projectV2Item { id } } }`;
const CLEAR_FIELD = `mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!) {
  clearProjectV2ItemFieldValue(input: { projectId: $projectId, itemId: $itemId, fieldId: $fieldId }) { projectV2Item { id } } }`;

export async function setPriority(
  token: string, cfg: TrackerConfig, meta: Meta, number: number, projectItemId: string | null,
  p: Priority | null, fetchFn: typeof fetch = fetch,
): Promise<{ projectItemId: string }> {
  let itemId = projectItemId;
  if (!itemId) {
    const { repository } = await graphql<{ repository: { issue: { id: string } } }>(token, ISSUE_ID, { owner: cfg.owner, repo: cfg.repo, number }, fetchFn);
    const added = await graphql<{ addProjectV2ItemById: { item: { id: string } } }>(token, ADD_ITEM, { projectId: meta.projectId, contentId: repository.issue.id }, fetchFn);
    itemId = added.addProjectV2ItemById.item.id;
  }
  const vars = { projectId: meta.projectId, itemId, fieldId: meta.fieldId };
  if (p) await graphql(token, SET_FIELD, { ...vars, optionId: meta.options[p] }, fetchFn);
  else await graphql(token, CLEAR_FIELD, vars, fetchFn);
  return { projectItemId: itemId };
}

export async function editLabels(
  token: string, cfg: TrackerConfig, number: number, add: string[], remove: string[], fetchFn: typeof fetch = fetch,
): Promise<string[]> {
  const base = `/repos/${cfg.owner}/${cfg.repo}/issues/${number}/labels`;
  let labels: { name: string }[] = [];
  if (add.length) labels = await rest(token, 'POST', base, { labels: add }, fetchFn);
  for (const name of remove) labels = await rest(token, 'DELETE', `${base}/${encodeURIComponent(name)}`, undefined, fetchFn);
  return labels.map((l) => l.name);
}

export async function setMilestone(
  token: string, cfg: TrackerConfig, meta: Meta, number: number, title: string | null, fetchFn: typeof fetch = fetch,
): Promise<string | null> {
  const res = await rest<{ milestone: { title: string } | null }>(
    token, 'PATCH', `/repos/${cfg.owner}/${cfg.repo}/issues/${number}`,
    { milestone: title === null ? null : meta.milestoneNumbers[title] }, fetchFn,
  );
  return res.milestone?.title ?? null;
}
