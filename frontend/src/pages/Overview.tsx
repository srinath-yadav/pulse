import { HealthBadge, HealthShape } from "../components/HealthBadge";
import { Icon } from "../components/Icon";
import { PulseStrip } from "../components/PulseStrip";
import { StatusLegend } from "../components/StatusBar";
import { Workload } from "../components/Workload";
import { greeting, isOpen, isStale, projectHealth } from "../lib/health";
import type { Issue, Project } from "../types";

interface Props {
  projects: Project[];
  onOpen: (client: string, issue?: string) => void;
}

type Attention = { project: Project; issue: Issue; reason: "blocked" | "stale" };

// The headline is the finding, written from the data
function headline(projects: Project[], attention: Attention[]) {
  const blocked = projects.filter((p) => projectHealth(p) === "blocked").length;
  const risk = projects.filter((p) => projectHealth(p) === "risk").length;
  const worst = attention.find((a) => a.reason === "blocked") ?? attention[0];

  const title =
    blocked > 0 ? `${blocked} of ${projects.length} clients are blocked`
    : risk > 0 ? `${risk} of ${projects.length} clients have work going stale`
    : "Every client is on track";

  const detail = worst
    ? `The longest wait is ${worst.issue.key} at ${worst.project.client}, ${worst.reason === "blocked" ? "blocked" : "open"} for ${worst.issue.days_open} days.`
    : "Nothing is blocked and nothing has been open longer than a week.";

  return { title, detail };
}

export function Overview({ projects, onOpen }: Props) {
  const all = projects.flatMap((p) => p.issues);
  const maxAge = Math.max(1, ...all.map((i) => i.days_open));

  // Blocked issues first, then stale ones, oldest first
  const attention: Attention[] = projects
    .flatMap((project) =>
      project.issues
        .filter((i) => i.status === "Blocked" || isStale(i))
        .map((issue) => ({ project, issue, reason: issue.status === "Blocked" ? ("blocked" as const) : ("stale" as const) })),
    )
    .sort((a, b) => (a.reason === b.reason ? b.issue.days_open - a.issue.days_open : a.reason === "blocked" ? -1 : 1));

  const { title, detail } = headline(projects, attention);

  return (
    <div className="page">
      <header className="hero">
        <p className="hero-hello">{greeting()}, Srinath</p>
        <h1>{title}</h1>
        <p className="hero-detail">{detail}</p>
      </header>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Client pulse</h2>
            <p className="muted small">One bar per issue. Taller bars have been open longer.</p>
          </div>
          <StatusLegend />
        </div>
        <div className="pulse-rows">
          {projects.map((p) => {
            const open = p.issues.filter(isOpen).length;
            const blocked = p.issues.filter((i) => i.status === "Blocked").length;
            return (
              <div key={p.key} className="pulse-row">
                <button className="pulse-name" onClick={() => onOpen(p.key)}>
                  <span className="strong">{p.client}</span>
                  <span className="muted small">{p.name}</span>
                </button>
                <PulseStrip issues={p.issues} maxAge={maxAge} onPick={(i) => onOpen(p.key, i.key)} />
                <div className="pulse-nums">
                  <span><b>{open}</b> open</span>
                  <span className={blocked ? "tone-blocked" : "muted"}><b>{blocked}</b> blocked</span>
                </div>
                <HealthBadge health={projectHealth(p)} />
              </div>
            );
          })}
        </div>
      </section>

      <div className="duo">
        <section className="card">
          <div className="card-head">
            <h2>Needs your attention</h2>
            <span className="muted small">Blocked, or open a week or more</span>
          </div>
          {attention.length === 0 ? (
            <p className="empty">All clear. Nothing is blocked or stale.</p>
          ) : (
            <ul className="attention">
              {attention.map(({ project, issue, reason }) => (
                <li key={issue.key}>
                  <button className="attention-row" onClick={() => onOpen(project.key, issue.key)}>
                    <span className={`attention-icon is-${reason}`}>
                      <HealthShape health={reason === "blocked" ? "blocked" : "risk"} size={11} />
                    </span>
                    <span className="attention-text">
                      <span className="attention-title">{issue.summary}</span>
                      <span className="muted small">{project.client}, {issue.key}{issue.assignee ? `, ${issue.assignee}` : ", unassigned"}</span>
                    </span>
                    <span className={`attention-why ${reason === "blocked" ? "tone-blocked" : "tone-risk"}`}>
                      {reason === "blocked" ? "Blocked" : "Stale"} {issue.days_open} days
                    </span>
                    <span className="muted"><Icon name="chevron" /></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Workload issues={all} />
      </div>
    </div>
  );
}
