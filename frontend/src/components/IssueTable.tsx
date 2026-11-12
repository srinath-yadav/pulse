import { useMemo, useState } from "react";
import { STALE_DAYS } from "../lib/health";
import { STATUSES, STATUS_KEY, STATUS_LABEL, triageRank } from "../lib/status";
import type { Issue, IssueStatus } from "../types";

type Filter = IssueStatus | "All";

export function IssueTable({ issues, onSelect }: { issues: Issue[]; onSelect: (key: string) => void }) {
  const [filter, setFilter] = useState<Filter>("All");

  // Blocked first, then oldest first: what a PM needs to look at
  const visible = useMemo(() => {
    const list = filter === "All" ? issues : issues.filter((i) => i.status === filter);
    return [...list].sort((a, b) => triageRank(a.status) - triageRank(b.status) || b.days_open - a.days_open);
  }, [issues, filter]);

  const filters: Filter[] = ["All", ...STATUSES];
  const countFor = (f: Filter) => (f === "All" ? issues.length : issues.filter((i) => i.status === f).length);

  return (
    <>
      <div className="tabs" role="tablist" aria-label="Filter issues">
        {filters.map((f) => (
          <button key={f} role="tab" aria-selected={filter === f}
            className={filter === f ? "tab active" : "tab"} onClick={() => setFilter(f)}>
            {f === "All" ? "All" : STATUS_LABEL[f]} <span className="tab-count">{countFor(f)}</span>
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Issue</th><th>Status</th><th>Priority</th><th>Assignee</th>
              <th className="num">Points</th><th className="num">Age</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((i) => (
              <tr key={i.key} className="row-link" tabIndex={0}
                onClick={() => onSelect(i.key)}
                onKeyDown={(e) => e.key === "Enter" && onSelect(i.key)}>
                <td>
                  <div className="issue-cell">
                    <span className="issue-key">{i.key}</span>
                    <span className="issue-title">{i.summary}</span>
                  </div>
                </td>
                <td><span className={`status status-${STATUS_KEY[i.status]}`}>{STATUS_LABEL[i.status]}</span></td>
                <td><span className={`prio prio-${i.priority.toLowerCase()}`}>{i.priority}</span></td>
                <td>
                  {i.assignee
                    ? <span className="assignee"><span className="mini-avatar">{i.assignee[0]}</span>{i.assignee}</span>
                    : <span className="muted">Unassigned</span>}
                </td>
                <td className="num">{i.story_points ?? "–"}</td>
                <td className={`num ${i.status !== "Done" && i.days_open >= STALE_DAYS ? "tone-risk strong" : ""}`}>{i.days_open}d</td>
              </tr>
            ))}
            {visible.length === 0 && <tr><td colSpan={6} className="empty">No issues with this status.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
