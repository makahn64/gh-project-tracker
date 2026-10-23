import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { axis, grid, shortDate, tooltip } from './chartTheme';

export function Burndown({ points, scopeLabel }: { points: { date: string; pct: number }[]; scopeLabel: string }) {
  const data = points.map((p) => ({ date: shortDate(p.date), pct: p.pct }));
  return (
    <section className="panel" aria-labelledby="burndown-title">
      <div className="chart-head">
        <h2 className="label" id="burndown-title">Burndown · {scopeLabel}</h2>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <CartesianGrid {...grid} />
          <XAxis dataKey="date" {...axis} />
          <YAxis {...axis} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v: number) => `${v}%`} width={56} />
          <Tooltip {...tooltip} formatter={(v) => [`${v}%`, 'Done']} />
          <Line isAnimationActive={false} type="monotone" dataKey="pct" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 2.5 }} />
        </LineChart>
      </ResponsiveContainer>
      <p className="muted chart-note">% of {scopeLabel} tickets closed as of each day.</p>
    </section>
  );
}
