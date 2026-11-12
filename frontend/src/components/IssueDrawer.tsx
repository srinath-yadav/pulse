import { useEffect } from "react";
import { STALE_DAYS } from "../lib/health";
import { STATUS_KEY, STATUS_LABEL } from "../lib/status";
import type { Issue, Project } from "../types";
import { Icon } from "./Icon";

interface Props {
  issue: Issue;
  project: Project;
  onClose: () => void;
}

export function IssueDrawer({ issue, project, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const stale = issue.status !== "Done" && issue.days_open >= STALE_DAYS;
  const teammates = project.issues.filter(
    (i) => i.assignee && i.assignee === issue.assignee && i.key !== issue.key && i.status !== "Done",
  );

  // Plain-language reasons Pulse flags this issue, worked out from the data
  const flags: string[] = [];
  if (issue.status === "Blocked") flags.push(`Blocked for ${issue.days_open} days. Someone needs to unblock it.`);
  else if (stale) flags.push(`Open for ${issue.days_open} days, longer than the ${STALE_DAYS}-day limit.`);
  if (!issue.assignee && issue.status !== "Done") flags.push("Nobody owns this yet.");
  if ((issue.priority === "Critical" || issue.priority === "High") && issue.status === "To Do")
    flags.push(`${issue.priority} priority, but work has not started.`);

  return (
    <div className="overlay overlay-right" onMouseDown={onClose}>
      <aside className="drawer" role="dialog" aria-label={`Issue ${issue.key}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <span className="issue-key">{issue.key}</span>
          <span className={`status status-${STATUS_KEY[issue.status]}`}>{STATUS_LABEL[issue.status]}</span>
          <button className="icon-ghost" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>

        <h2 className="drawer-title">{issue.summary}</h2>
        <p className="muted">{project.client}, {project.name}</p>

        <dl className="fields">
          <div><dt>Priority</dt><dd><span className={`prio prio-${issue.priority.toLowerCase()}`}>{issue.priority}</span></dd></div>
          <div><dt>Assignee</dt><dd>{issue.assignee ?? <span className="muted">Unassigned</span>}</dd></div>
          <div><dt>Story points</dt><dd>{issue.story_points ?? "Not estimated"}</dd></div>
          <div><dt>Open for</dt><dd className={stale ? "tone-risk" : ""}>{issue.days_open} {issue.days_open === 1 ? "day" : "days"}</dd></div>
        </dl>

        {flags.length > 0 && (
          <div className="callout">
            <h3>Why Pulse flags this</h3>
            <ul>{flags.map((f) => <li key={f}>{f}</li>)}</ul>
          </div>
        )}

        {teammates.length > 0 && (
          <div>
            <h3 className="drawer-sub">{issue.assignee} is also working on</h3>
            <ul className="mini-list">
              {teammates.map((t) => (
                <li key={t.key}>
                  <span className={`dot dot-${STATUS_KEY[t.status]}`} />
                  <span className="issue-key">{t.key}</span>
                  <span className="mini-title">{t.summary}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="drawer-foot">
          <button className="btn btn-ghost" disabled title="Available once Jira is connected">
            <Icon name="external" /> Open in Jira
          </button>
          <button className="btn btn-primary" disabled title="Arrives with the agent feature">
            <Icon name="sparkle" /> Draft a nudge
          </button>
        </div>
      </aside>
    </div>
  );
}
