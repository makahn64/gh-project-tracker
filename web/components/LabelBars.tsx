import type { byLabel } from '../../shared/metrics';

export function LabelBars({ rows, scopeLabel }: { rows: ReturnType<typeof byLabel>; scopeLabel: string }) {
  return (
    <section className="panel" aria-labelledby="labels-title">
      <h2 className="label" id="labels-title">Still open, by label · {scopeLabel}</h2>
      {rows.length === 0 ? (
        <p className="muted chart-note">No labelled tickets in {scopeLabel}</p>
      ) : (
        <div className="label-bars">
          {rows.map((r) => (
            <div key={r.label} style={{ display: 'contents' }}>
              <span>{r.label}</span>
              <div className="bar-track" role="meter" aria-label={`${r.label} still open`}
                aria-valuemin={0} aria-valuemax={100} aria-valuenow={r.pct}>
                <div className="bar-fill" style={{ width: `${r.pct}%` }} />
              </div>
              <span className="muted">{r.pct}% · {r.open} of {r.total}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
