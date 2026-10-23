import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ALL, type TrackerData } from '../shared/types';
import { burndown, byLabel, closedPerDay, inScope, progress } from '../shared/metrics';
import { api } from './api';
import { StatTiles } from './components/StatTiles';
import { ActivityChart } from './components/ActivityChart';
import { Burndown } from './components/Burndown';
import { LabelBars } from './components/LabelBars';
import { TicketTable } from './components/TicketTable';

export function App() {
  const [data, setData] = useState<TrackerData | null>(null);
  const [milestone, setMilestone] = useState<string>(ALL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const latest = useRef(0);

  const load = useCallback(async (first: boolean) => {
    const id = ++latest.current;
    setLoading(true);
    setError(null);
    try {
      const d = await api.getData();
      if (id !== latest.current) return;
      setData(d);
      setError(null);
      // Start on the default milestone, and fall back if the selected one has closed.
      setMilestone((m) => (first || (m !== ALL && !d.milestones.includes(m)) ? d.defaultMilestone ?? ALL : m));
    } catch (e) {
      if (id === latest.current) setError((e as Error).message);
    } finally {
      if (id === latest.current) setLoading(false);
    }
  }, []);

  useEffect(() => { load(true); }, [load]);

  const view = useMemo(() => {
    if (!data) return null;
    const scoped = inScope(data.issues, milestone);
    const closed = closedPerDay(data.issues, data.days);
    return {
      scoped, closed,
      closedTotal: closed.reduce((s, d) => s + d.count, 0),
      scope: progress(scoped),
      burndown: burndown(scoped, data.days),
      labels: byLabel(scoped),
    };
  }, [data, milestone]);

  const scopeLabel = milestone === ALL ? 'All tickets' : milestone;

  return (
    <main className="page">
      <header className="header">
        <div>
          <h1>Project tracker</h1>
          {data && <p className="muted">{data.repoName} · {data.branch}</p>}
        </div>
        <div className="controls">
          <label className="sr-only" htmlFor="milestone">Milestone</label>
          <select id="milestone" value={milestone} onChange={(e) => setMilestone(e.target.value)} disabled={!data}>
            {data?.milestones.map((m) => <option key={m} value={m}>Milestone: {m}</option>)}
            <option value={ALL}>All tickets</option>
          </select>
          <button onClick={() => load(!data)} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
        </div>
      </header>

      {error && <p className="error" role="alert">Couldn't load data: {error}</p>}
      {!data && loading && <p className="muted">Loading…</p>}

      {data && view && (
        <>
          <StatTiles lines={data.lines} closed={view.closedTotal} scope={view.scope} scopeLabel={scopeLabel} />
          <div className="charts">
            <ActivityChart lines={data.lines} closed={view.closed} />
            <Burndown points={view.burndown} scopeLabel={scopeLabel} />
          </div>
          <LabelBars rows={view.labels} scopeLabel={scopeLabel} />
          <TicketTable issues={view.scoped} labels={data.labels} milestones={data.milestones} />
        </>
      )}
    </main>
  );
}
