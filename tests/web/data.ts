import type { TrackerData } from '../../shared/types';
import { mk } from '../shared/fixtures';

export function trackerData(over: Partial<TrackerData> = {}): TrackerData {
  const closed = new Date(2026, 9, 22, 12);
  const issues = [
    ...Array.from({ length: 6 }, () => mk({ milestone: 'Beta', closedLocal: closed, labels: ['WEB'] })),
    ...Array.from({ length: 32 }, () => mk({ milestone: 'Beta', labels: ['WEB'] })),
    mk({ milestone: null }),
    mk({ milestone: null, closedLocal: closed }),
  ];
  const days = ['2026-10-21', '2026-10-22', '2026-10-23'];
  return {
    issues, days,
    lines: [
      { date: '2026-10-21', added: 8000, removed: 3000 },
      { date: '2026-10-22', added: 412, removed: 105 },
      { date: '2026-10-23', added: 0, removed: 0 },
    ],
    labels: ['AI', 'WEB', 'bug'], milestones: ['Beta'], defaultMilestone: 'Beta',
    repoName: 'acme/widgets', branch: 'development',
    ...over,
  };
}
