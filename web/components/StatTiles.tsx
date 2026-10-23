import type { TrackerData } from '../../shared/types';
import type { progress } from '../../shared/metrics';

const fmt = new Intl.NumberFormat('en-US');

function Tile({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel tile" aria-label={title}>
      <h2 className="label">{title}</h2>
      {children}
    </section>
  );
}

export function StatTiles({ lines, closed, scope, scopeLabel }: {
  lines: TrackerData['lines'];
  closed: number;
  scope: ReturnType<typeof progress>;
  scopeLabel: string;
}) {
  const added = lines.reduce((s, d) => s + d.added, 0);
  const removed = lines.reduce((s, d) => s + d.removed, 0);
  return (
    <div className="tiles">
      <Tile title="Lines changed · 14d">
        <p className="big">
          <span className="added">+{fmt.format(added)}</span>
          <span className="muted"> / </span>
          <span className="removed">−{fmt.format(removed)}</span>
        </p>
      </Tile>
      <Tile title="Tickets closed · 14d">
        <p className="big">{closed}</p>
      </Tile>
      <Tile title={`${scopeLabel} progress`}>
        <p className="big">{scope.pct}% done</p>
        <p className="muted">{scope.closed} of {scope.total} tickets closed · {scope.open} open</p>
      </Tile>
    </div>
  );
}
