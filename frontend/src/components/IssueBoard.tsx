import { STALE_DAYS } from "../lib/health";
import { STATUS_KEY, STATUS_LABEL, WORKFLOW } from "../lib/status";
import type { Issue } from "../types";

export function IssueBoard({ issues, onSelect }: { issues: Issue[]; onSelect: (key: string) => void }) {
  return (
    <div className="board">
      {WORKFLOW.map((status) => {
        const column = issues.filter((i) => i.status === status).sort((a, b) => b.days_open - a.days_open);
        return (
          <div key={status} className="column">
            <div className="column-head">
              <span className={`dot dot-${STATUS_KEY[status]}`} />
              {STATUS_LABEL[status]}
              <span className="column-n">{column.length}</span>
            </div>
            {column.map((i) => (
              <button key={i.key} className="ticket" onClick={() => onSelect(i.key)}>
                <span className="ticket-top">
                  <span className="issue-key">{i.key}</span>
                  <span className={`age ${status !== "Done" && i.days_open >= STALE_DAYS ? "tone-risk" : ""}`}>{i.days_open}d</span>
                </span>
                <span className="ticket-title">{i.summary}</span>
                <span className="ticket-foot">
                  <span className={`prio prio-${i.priority.toLowerCase()}`}>{i.priority}</span>
                  {i.assignee
                    ? <span className="mini-avatar" title={i.assignee}>{i.assignee[0]}</span>
                    : <span className="muted small">Unassigned</span>}
                </span>
              </button>
            ))}
            {column.length === 0 && <p className="column-empty">Nothing here</p>}
          </div>
        );
      })}
    </div>
  );
}
