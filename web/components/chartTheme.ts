export const axis = { stroke: 'var(--muted)', fontSize: 12, tickLine: false };
export const grid = { stroke: 'var(--border)', vertical: false };
export const tooltip = {
  contentStyle: { background: 'var(--panel-raised)', border: '1px solid var(--border-strong)', borderRadius: 6 },
  labelStyle: { color: 'var(--text)' },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
};

/** '2026-10-23' → 'Oct 23' */
export function shortDate(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
