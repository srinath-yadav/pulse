import { useCallback, useEffect, useRef, useState } from "react";
import { CommandPalette } from "./components/CommandPalette";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { useTheme } from "./lib/useTheme";
import { Overview } from "./pages/Overview";
import { ProjectPage } from "./pages/ProjectPage";
import type { Project } from "./types";
import { api } from "./api";
import { ServerStatus } from "./components/ServerStatus";
import { isOffline } from "./lib/errors";

// The live API runs on a free server that sleeps when idle and takes up to a minute
// to wake. Keep retrying for that long before showing an error. In dev, fail fast.
const RETRY_EVERY_MS = 5_000;
const WAKE_UP_WINDOW_MS = import.meta.env.DEV ? 0 : 90_000;
const SLOW_AFTER_MS = 4_000;
const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

// Hash routing: #/ = overview, #/clients/HLX = one client, #/clients/HLX/HLX-101 = an issue
function readRoute() {
  const m = window.location.hash.match(
    /^#\/clients\/([A-Za-z0-9]+)(?:\/([A-Za-z0-9-]+))?/,
  );
  return {
    client: m ? m[1].toUpperCase() : null,
    issue: m?.[2]?.toUpperCase() ?? null,
  };
}

export default function App() {
  const { theme, toggle } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [syncing, setSyncing] = useState(false);
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);
  const [route, setRoute] = useState(readRoute);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [slow, setSlow] = useState(false);
  const hasData = useRef(false);

  const load = useCallback(async () => {
    setSyncing(true);
    if (!hasData.current) setStatus("loading");
    const started = Date.now();
    const slowTimer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    try {
      for (;;) {
        try {
          setProjects(await api.listProjectDetails());
          hasData.current = true;
          setSyncedAt(new Date());
          setStatus("ready");
          return;
        } catch (e) {
          // Only a sleeping or unreachable server is worth waiting for
          const waited = Date.now() - started;
          if (!isOffline(e) || waited + RETRY_EVERY_MS > WAKE_UP_WINDOW_MS)
            throw e;
          await sleep(RETRY_EVERY_MS);
        }
      }
    } catch {
      // A failed refresh keeps the data already on screen
      if (!hasData.current) setStatus("error");
    } finally {
      clearTimeout(slowTimer);
      setSlow(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("hashchange", onHash);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const navigate = useCallback((client: string | null, issue?: string) => {
    window.location.hash =
      client ? `/clients/${client}${issue ? `/${issue}` : ""}` : "/";
  }, []);

  const active = projects.find((p) => p.key === route.client) ?? null;
  const crumbs = active ? ["Clients", active.client] : ["Overview"];

  return (
    <div className="shell">
      <Sidebar
        projects={projects}
        activeKey={route.client}
        onNavigate={navigate}
      />
      <main className="content">
        <Topbar
          crumbs={crumbs}
          syncedAt={syncedAt}
          syncing={syncing}
          theme={theme}
          onSync={load}
          onSearch={() => setPaletteOpen(true)}
          onToggleTheme={toggle}
        />

        {status === "loading" && <ServerStatus mode="waking" slow={slow} />}
        {status === "error" && <ServerStatus mode="down" onRetry={load} />}

        {status === "ready" && route.client && !active && (
          <div className="state">
            <h2>No client with the key {route.client}</h2>
            <button className="btn btn-ghost" onClick={() => navigate(null)}>
              Back to overview
            </button>
          </div>
        )}

        {status === "ready" && active && (
          <ProjectPage
            project={active}
            issueKey={route.issue}
            onSelectIssue={(key) => navigate(active.key, key ?? undefined)}
            onBack={() => navigate(null)}
          />
        )}
        {status === "ready" && !route.client && (
          <Overview projects={projects} onOpen={navigate} />
        )}
      </main>

      {paletteOpen && (
        <CommandPalette
          projects={projects}
          onClose={() => setPaletteOpen(false)}
          onNavigate={navigate}
          onToggleTheme={toggle}
        />
      )}
    </div>
  );
}
