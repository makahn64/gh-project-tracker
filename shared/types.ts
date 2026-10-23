export type Priority = 'P0' | 'P1' | 'P2';
export const PRIORITIES: Priority[] = ['P0', 'P1', 'P2'];

export type StateReason = 'COMPLETED' | 'NOT_PLANNED' | 'DUPLICATE' | 'REOPENED' | null;

export interface Issue {
  number: number;
  title: string;
  url: string;
  bodyPreview: string;
  state: 'OPEN' | 'CLOSED';
  stateReason: StateReason;
  createdAt: string;
  closedAt: string | null;
  labels: string[];
  milestone: string | null;
  priority: Priority | null;
  projectItemId: string | null;
}

/** date is a local calendar day, 'YYYY-MM-DD'. */
export interface DayLines {
  date: string;
  added: number;
  removed: number;
}

export interface TrackerData {
  issues: Issue[];
  lines: DayLines[];
  days: string[];
  labels: string[];
  milestones: string[];
  defaultMilestone: string | null;
  repoName: string;
  branch: string;
}

/** Milestone dropdown value meaning "All tickets". */
export const ALL = '__all__';
