import type { Meta } from '../../server/github/meta';
import type { TrackerConfig } from '../../server/config';

export const cfg: TrackerConfig = {
  owner: 'acme', repo: 'widgets', branch: 'development', projectOwner: 'acme',
  projectNumber: 1, defaultMilestone: 'Beta', priorityField: 'Priority', excludeGlobs: [], port: 0,
};

export const meta: Meta = {
  labels: ['AI', 'WEB'], milestones: ['Beta'], milestoneNumbers: { Beta: 1 },
  projectId: 'PROJ', fieldId: 'FIELD', options: { P0: 'o0', P1: 'o1', P2: 'o2' },
};

