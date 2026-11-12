import { useState } from "react";
import { api, ApiError } from "../api";
import type { ProjectReport } from "../types";
import { Icon } from "./Icon";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; report: ProjectReport; at: Date }
  | { kind: "error"; message: string };

export function ReportPanel({ projectKey }: { projectKey: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function generate() {
    setState({ kind: "loading" });
    try {
      const report = await api.generateReport(projectKey);
      setState({ kind: "ready", report, at: new Date() });
    } catch (e) {
      const notBuilt = e instanceof ApiError && (e.status === 404 || e.status === 405);
      setState({
        kind: "error",
        message: notBuilt
          ? "The report endpoint isn't live yet. It arrives in Step 3 (LLM report)."
          : "Couldn't generate the report. Check the backend is running.",
      });
    }
  }

  return (
    <section className="card ai-card">
      <div className="card-head">
        <h2 className="ai-title"><Icon name="sparkle" /> AI status report</h2>
        {state.kind === "ready" && (
          <span className="muted small">
            Generated {state.at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {state.kind === "idle" && (
        <div className="ai-empty">
          <p>Pulse reads every issue in this project and writes a status update: progress, blockers and delivery risk.</p>
          <button className="btn btn-primary" onClick={generate}>
            <Icon name="sparkle" /> Generate report
          </button>
        </div>
      )}

      {state.kind === "loading" && (
        <div className="ai-loading" aria-live="polite">
          <span className="muted small">Reading issues and drafting…</span>
          <div className="skeleton"><div /><div /><div className="short" /></div>
        </div>
      )}

      {state.kind === "error" && (
        <div className="ai-empty">
          <p className="error-text">{state.message}</p>
          <button className="btn btn-ghost" onClick={generate}>Try again</button>
        </div>
      )}

      {state.kind === "ready" && (
        <div className="ai-body">
          <div className="ai-meta">
            <span className={`risk risk-${state.report.risk_level}`}>{state.report.risk_level} risk</span>
            <span className="muted small">
              <Icon name="clock" size={13} /> ~{state.report.est_completion_days} days to done
            </span>
          </div>
          <p className="ai-summary">{state.report.summary}</p>
          {state.report.blockers.length > 0 && (
            <div>
              <span className="label">Blockers</span>
              <ul className="ai-list">
                {state.report.blockers.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </div>
          )}
          <div className="ai-actions">
            <button className="btn btn-primary" disabled title="Coming soon">Share with client</button>
            <button className="btn btn-ghost" onClick={generate}>Regenerate</button>
          </div>
          <p className="muted small">AI-generated from Jira data. Review before sharing.</p>
        </div>
      )}
    </section>
  );
}
