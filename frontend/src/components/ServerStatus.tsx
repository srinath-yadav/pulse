import { useEffect, useState } from "react";
import { Icon } from "./Icon";

// Full-page state shown while the API wakes up or when it can't be reached.
// The pulse line is the brand mark: it beats while waking and goes flat when down.

const AUTO_RETRY_SECONDS = 30;

type Props = {
  mode: "waking" | "down";
  slow?: boolean;
  onRetry?: () => void;
};

export function ServerStatus({ mode, slow = false, onRetry }: Props) {
  const down = mode === "down";

  return (
    <div className={`server-status ${down ? "is-down" : "is-waking"}`}>
      <div
        className="server-card"
        role={down ? "alert" : "status"}
        aria-live="polite">
        <PulseLine down={down} />

        {down ?
          <>
            <span className="server-badge">
              <i /> Service unavailable
            </span>
            <h2>Pulse can't reach its server right now</h2>
            <p>
              The dashboard is fine, but the service behind it isn't responding.
              It's usually back within a minute or two. Your data is safe.
            </p>
            {onRetry && <AutoRetry onRetry={onRetry} />}
            {import.meta.env.DEV && (
              <p className="dev-hint">
                Dev: start the API with{" "}
                <code>uv run uvicorn app.main:app --reload --port 8000</code>
              </p>
            )}
          </>
        : <>
            <h2>{slow ? "Waking up the server…" : "Loading your clients…"}</h2>
            <p className={slow ? "" : "is-hidden"}>
              Pulse runs on a free server that sleeps when nobody is using it.
              The first visit can take up to a minute.
            </p>
          </>
        }
      </div>
    </div>
  );
}

function PulseLine({ down }: { down: boolean }) {
  // A heartbeat when alive, a flat line with one weak blip when down
  const d =
    down ?
      "M2 40 H150 l6 -5 6 5 H318"
    : "M2 40 H96 l10 -22 14 46 14 -52 12 40 8 -12 H318";
  return (
    <svg className="pulse-line" viewBox="0 0 320 80" aria-hidden="true">
      <path className="pulse-track" d="M2 40 H318" />
      <path className="pulse-trace" d={d} pathLength={1} />
      {down && <circle className="pulse-dot" cx="318" cy="40" r="4" />}
    </svg>
  );
}

function AutoRetry({ onRetry }: { onRetry: () => void }) {
  const [left, setLeft] = useState(AUTO_RETRY_SECONDS);

  useEffect(() => {
    if (left <= 0) {
      onRetry();
      return;
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, onRetry]);

  return (
    <div className="server-actions">
      <button className="btn btn-primary" onClick={onRetry}>
        <Icon name="sync" /> Try again now
      </button>
      <span className="server-countdown">Checking again in {left}s</span>
    </div>
  );
}
