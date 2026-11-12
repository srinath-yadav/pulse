import type { Theme } from "../lib/useTheme";
import { Icon } from "./Icon";

interface Props {
  crumbs: string[];
  syncedAt: Date | null;
  syncing: boolean;
  theme: Theme;
  onSync: () => void;
  onSearch: () => void;
  onToggleTheme: () => void;
}

function ago(d: Date | null) {
  if (!d) return "Not synced yet";
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  return s < 60 ? "Synced just now" : `Synced ${Math.round(s / 60)} min ago`;
}

export function Topbar({ crumbs, syncedAt, syncing, theme, onSync, onSearch, onToggleTheme }: Props) {
  return (
    <div className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <span key={c} className={i === crumbs.length - 1 ? "crumb current" : "crumb"}>
            {i > 0 && <span className="crumb-sep">/</span>}{c}
          </span>
        ))}
      </div>

      <button className="search" type="button" onClick={onSearch}>
        <Icon name="search" />
        <span className="search-text">Search clients, issues or people</span>
        <span className="kbd">⌘K</span>
      </button>

      <span className="muted small sync-text">{syncing ? "Syncing…" : ago(syncedAt)}</span>
      <button className="icon-ghost" onClick={onSync} disabled={syncing} aria-label="Sync now" title="Sync now">
        <span className={syncing ? "spin" : ""}><Icon name="sync" /></span>
      </button>
      <button className="icon-ghost" onClick={onToggleTheme}
        aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        title={theme === "dark" ? "Light theme" : "Dark theme"}>
        <Icon name={theme === "dark" ? "sun" : "moon"} />
      </button>
    </div>
  );
}
