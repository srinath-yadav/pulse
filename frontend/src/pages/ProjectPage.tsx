import { useState } from "react";
import { AskPulse } from "../components/AskPulse";
import { HealthBadge } from "../components/HealthBadge";
import { Icon } from "../components/Icon";
import { IssueBoard } from "../components/IssueBoard";
import { IssueDrawer } from "../components/IssueDrawer";
import { IssueTable } from "../components/IssueTable";
import { ReportPanel } from "../components/ReportPanel";
import { StatusBar } from "../components/StatusBar";
import { progress, projectHealth } from "../lib/health";
import type { Project } from "../types";

interface Props {
  project: Project;
  issueKey: string | null;
  onSelectIssue: (key: string | null) => void;
  onBack: () => void;
}

export function ProjectPage({
  project,
  issueKey,
  onSelectIssue,
  onBack,
}: Props) {
  const [view, setView] = useState<"list" | "board">("list");

  const points = project.issues.reduce((n, i) => n + (i.story_points ?? 0), 0);
  const donePoints = project.issues
    .filter((i) => i.status === "Done")
    .reduce((n, i) => n + (i.story_points ?? 0), 0);
  const selected = project.issues.find((i) => i.key === issueKey) ?? null;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <button className="back" onClick={onBack}>
            Back to all clients
          </button>
          <div className="title-row">
            <h1>{project.client}</h1>
            <HealthBadge health={projectHealth(project)} />
          </div>
          <p className="muted">
            {project.name}, {progress(project)}% of issues delivered
          </p>
        </div>
      </header>

      <section className="card">
        <div className="card-head">
          <h2>Where the work stands</h2>
          <span className="muted small">
            {donePoints} of {points} story points done
          </span>
        </div>
        <StatusBar issues={project.issues} />
      </section>

      <div className="split">
        <section className="card">
          <div className="card-head">
            <h2>Issues</h2>
            <div className="toggle" role="group" aria-label="View">
              <button
                className={view === "list" ? "active" : ""}
                aria-pressed={view === "list"}
                onClick={() => setView("list")}>
                <Icon name="list" size={14} /> List
              </button>
              <button
                className={view === "board" ? "active" : ""}
                aria-pressed={view === "board"}
                onClick={() => setView("board")}>
                <Icon name="board" size={14} /> Board
              </button>
            </div>
          </div>
          {view === "list" ?
            <IssueTable issues={project.issues} onSelect={onSelectIssue} />
          : <IssueBoard issues={project.issues} onSelect={onSelectIssue} />}
        </section>

        <div className="side">
          <ReportPanel key={project.key} projectKey={project.key} />
          <AskPulse
            key={project.key}
            client={project.client}
            projectKey={project.key}
          />
        </div>
      </div>

      {selected && (
        <IssueDrawer
          issue={selected}
          project={project}
          onClose={() => onSelectIssue(null)}
        />
      )}
    </div>
  );
}
