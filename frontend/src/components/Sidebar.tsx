import { projectHealth } from "../lib/health";
import type { Project } from "../types";
import { HealthShape } from "./HealthBadge";
import { Icon, type IconName } from "./Icon";

interface Props {
  projects: Project[];
  activeKey: string | null;
  onNavigate: (key: string | null) => void;
}

const SOON: Array<{ label: string; icon: IconName }> = [
  { label: "Reports", icon: "reports" },
  { label: "Connections", icon: "plug" },
  { label: "Settings", icon: "settings" },
];

export function Sidebar({ projects, activeKey, onNavigate }: Props) {
  return (
    <nav className="sidebar" aria-label="Workspace">
      <div className="brand">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <rect width="28" height="28" rx="8" className="brand-tile" />
          <path d="M5 15h4.5l2.5-7 4 13 2.5-6H23" className="brand-line" strokeWidth="2.3"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="brand-name">Pulse</span>
      </div>

      <div className="nav-group">
        <button className={`nav-item ${activeKey === null ? "active" : ""}`}
          aria-current={activeKey === null ? "page" : undefined} onClick={() => onNavigate(null)}>
          <Icon name="home" /><span className="nav-label">Overview</span>
        </button>
        {SOON.map((n) => (
          <button key={n.label} className="nav-item" disabled title="Coming soon">
            <Icon name={n.icon} /><span className="nav-label">{n.label}</span><span className="soon">Soon</span>
          </button>
        ))}
      </div>

      <div className="nav-group">
        <span className="nav-heading">Clients</span>
        {projects.map((p) => {
          const active = activeKey === p.key;
          const open = p.issues.filter((i) => i.status !== "Done").length;
          return (
            <button key={p.key} className={`nav-item ${active ? "active" : ""}`}
              aria-current={active ? "page" : undefined} onClick={() => onNavigate(p.key)}>
              <HealthShape health={projectHealth(p)} />
              <span className="nav-label">{p.client}</span>
              <span className="count" title={`${open} open issues`}>{open}</span>
            </button>
          );
        })}
      </div>

      <div className="user-card">
        <span className="avatar">SY</span>
        <div className="user-meta">
          <span className="user-name">Srinath</span>
          <span className="user-plan">Free plan, {projects.length} of 3 clients</span>
        </div>
      </div>
    </nav>
  );
}
