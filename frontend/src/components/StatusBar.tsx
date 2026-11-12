import { STATUSES, STATUS_KEY, STATUS_LABEL } from "../lib/status";
import type { Issue } from "../types";

// Parts of a whole: one segmented bar, with the counts written in the legend
export function StatusBar({ issues }: { issues: Issue[] }) {
  const counts = STATUSES.map((s) => ({ status: s, n: issues.filter((i) => i.status === s).length }));

  return (
    <div className="statusbar">
      <div className="segments" role="img"
        aria-label={counts.map((c) => `${c.n} ${STATUS_LABEL[c.status]}`).join(", ")}>
        {counts.filter((c) => c.n > 0).map((c) => (
          <span key={c.status} className={`segment fill-${STATUS_KEY[c.status]}`}
            style={{ flexGrow: c.n }} title={`${STATUS_LABEL[c.status]}: ${c.n}`} />
        ))}
      </div>
      <StatusLegend counts={counts} />
    </div>
  );
}

export function StatusLegend({ counts }: { counts?: Array<{ status: Issue["status"]; n: number }> }) {
  const items = counts ?? STATUSES.map((status) => ({ status, n: -1 }));
  return (
    <ul className="legend">
      {items.map((c) => (
        <li key={c.status}>
          <span className={`dot dot-${STATUS_KEY[c.status]}`} />
          {STATUS_LABEL[c.status]}
          {c.n >= 0 && <span className="legend-n">{c.n}</span>}
        </li>
      ))}
    </ul>
  );
}
