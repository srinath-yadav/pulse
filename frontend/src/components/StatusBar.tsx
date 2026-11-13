import { useState } from "react";
import { STATUSES, STATUS_KEY, STATUS_LABEL } from "../lib/status";
import type { Issue, IssueStatus } from "../types";

// Parts of a whole: one segmented bar, with the counts written in the legend.
// Hover or focus a segment to see its size and the issues inside it.
export function StatusBar({ issues }: { issues: Issue[] }) {
  const [active, setActive] = useState<IssueStatus | null>(null);

  const total = issues.length;
  const totalPts = issues.reduce((n, i) => n + (i.story_points ?? 0), 0);
  const groups = STATUSES.map((status) => {
    const list = issues
      .filter((i) => i.status === status)
      .sort((a, b) => b.days_open - a.days_open);
    return {
      status,
      n: list.length,
      pts: list.reduce((n, i) => n + (i.story_points ?? 0), 0),
      list,
    };
  });
  const visible = groups.filter((g) => g.n > 0);

  return (
    <div className="statusbar">
      <div className="segments" onMouseLeave={() => setActive(null)}>
        {visible.map((g, index) => (
          <button
            key={g.status}
            type="button"
            className={`segment fill-${STATUS_KEY[g.status]} ${active && active !== g.status ? "is-dim" : ""}`}
            style={{ flexGrow: g.n }}
            onMouseEnter={() => setActive(g.status)}
            onFocus={() => setActive(g.status)}
            onBlur={() => setActive(null)}
            aria-label={`${STATUS_LABEL[g.status]}: ${g.n} of ${total} issues, ${g.pts} story points`}>
            {active === g.status && (
              <span
                className={`tip ${index >= visible.length / 2 ? "tip-right" : ""}`}
                role="tooltip">
                <span className="tip-meta">
                  <span className={`dot dot-${STATUS_KEY[g.status]}`} />
                  <strong>{STATUS_LABEL[g.status]}</strong>
                </span>
                <span className="tip-title">
                  {g.n} of {total} issues, {g.pts} of {totalPts} points (
                  {Math.round((g.n / total) * 100)}%)
                </span>
                {g.list.slice(0, 4).map((i) => (
                  <span key={i.key} className="tip-row">
                    <span className="tip-key">{i.key}</span> {i.summary}
                  </span>
                ))}
                {g.n > 4 && <span className="tip-key">and {g.n - 4} more</span>}
              </span>
            )}
          </button>
        ))}
      </div>
      <StatusLegend counts={groups.map(({ status, n }) => ({ status, n }))} />
    </div>
  );
}

export function StatusLegend({
  counts,
}: {
  counts?: Array<{ status: Issue["status"]; n: number }>;
}) {
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
