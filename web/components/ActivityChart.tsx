import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DayLines } from '../../shared/types';
import { axis, grid, shortDate, tooltip } from './chartTheme';

type Mode = 'lines' | 'tickets';
const fmt = new Intl.NumberFormat('en-US');

export function ActivityChart({ lines, closed, rangeLabel }: {
  lines: DayLines[];
  closed: { date: string; count: number }[];
  rangeLabel: string;
}) {
  const [mode, setMode] = useState<Mode>('lines');
  const lineData = lines.map((d) => ({ date: shortDate(d.date), added: d.added, removed: -d.removed }));
  const ticketData = closed.map((d) => ({ date: shortDate(d.date), closed: d.count }));

  return (
    <section className="panel" aria-labelledby="activity-title">
      <div className="chart-head">
        <h2 className="label" id="activity-title">Daily activity · {rangeLabel}</h2>
        <div className="toggle" role="group" aria-label="Activity measure">
          <button aria-pressed={mode === 'lines'} onClick={() => setMode('lines')}>Lines</button>
          <button aria-pressed={mode === 'tickets'} onClick={() => setMode('tickets')}>Tickets</button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        {mode === 'lines' ? (
          <BarChart data={lineData} stackOffset="sign">
            <CartesianGrid {...grid} />
            <XAxis dataKey="date" {...axis} />
            <YAxis {...axis} tickFormatter={(v: number) => fmt.format(Math.abs(v))} width={56} />
            <Tooltip {...tooltip} formatter={(v) => fmt.format(Math.abs(Number(v)))} />
            <ReferenceLine y={0} stroke="var(--border-strong)" />
            <Bar isAnimationActive={false} dataKey="added" name="Added" stackId="l" fill="var(--added)" radius={[3, 3, 0, 0]} />
            <Bar isAnimationActive={false} dataKey="removed" name="Removed" stackId="l" fill="var(--removed)" radius={[0, 0, 3, 3]} />
          </BarChart>
        ) : (
          <BarChart data={ticketData}>
            <CartesianGrid {...grid} />
            <XAxis dataKey="date" {...axis} />
            <YAxis {...axis} allowDecimals={false} width={56} />
            <Tooltip {...tooltip} />
            <Bar isAnimationActive={false} dataKey="closed" name="Tickets closed" fill="var(--accent)" radius={[3, 3, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
      <p className="muted chart-note">
        {mode === 'lines'
          ? 'Green: lines added · red: lines removed. Lock files and generated files are skipped.'
          : 'Tickets closed as completed, whole repo.'}
      </p>
    </section>
  );
}
