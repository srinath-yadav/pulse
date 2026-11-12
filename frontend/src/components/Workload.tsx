import type { Issue } from "../types";

// Open issues per person. One measure, one colour; the number is written on each row.
export function Workload({ issues, title = "Team workload" }: { issues: Issue[]; title?: string }) {
  const open = issues.filter((i) => i.status !== "Done");
  const byPerson = new Map<string, { count: number; blocked: number }>();
  for (const i of open) {
    const name = i.assignee ?? "Unassigned";
    const row = byPerson.get(name) ?? { count: 0, blocked: 0 };
    row.count += 1;
    if (i.status === "Blocked") row.blocked += 1;
    byPerson.set(name, row);
  }
  const rows = [...byPerson.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => (a.name === "Unassigned" ? 1 : b.name === "Unassigned" ? -1 : b.count - a.count));
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <section className="card">
      <div className="card-head">
        <h2>{title}</h2>
        <span className="muted small">Open issues per person</span>
      </div>
      {rows.length === 0 ? (
        <p className="empty">No open work.</p>
      ) : (
        <ul className="workload">
          {rows.map((r) => (
            <li key={r.name} className="workload-row"
              title={`${r.name}: ${r.count} open${r.blocked ? `, ${r.blocked} blocked` : ""}`}>
              <span className={`workload-name ${r.name === "Unassigned" ? "muted" : ""}`}>{r.name}</span>
              <span className="workload-track">
                <span className={`workload-bar ${r.name === "Unassigned" ? "is-unassigned" : ""}`}
                  style={{ width: `${(r.count / max) * 100}%` }} />
              </span>
              <span className="workload-n">{r.count}</span>
              <span className="workload-note">{r.blocked > 0 ? `${r.blocked} blocked` : ""}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
