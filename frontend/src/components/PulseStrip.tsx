import { useMemo, useState } from "react";
import { STATUS_KEY, STATUS_LABEL, triageRank } from "../lib/status";
import type { Issue } from "../types";

interface Props {
  issues: Issue[];
  maxAge: number; // shared across clients so heights compare between rows
  onPick?: (issue: Issue) => void;
}

// One bar per issue. Height = days open, colour = status.
// Blocked work sits on the left, so trouble reads first.
export function PulseStrip({ issues, maxAge, onPick }: Props) {
  const [hover, setHover] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...issues].sort((a, b) => triageRank(a.status) - triageRank(b.status) || b.days_open - a.days_open),
    [issues],
  );

  return (
    <div className="pulse" onMouseLeave={() => setHover(null)}>
      {sorted.map((issue, index) => {
        const height = 16 + 84 * (issue.days_open / Math.max(1, maxAge));
        return (
          <button
            key={issue.key}
            className="tick-hit"
            onMouseEnter={() => setHover(issue.key)}
            onFocus={() => setHover(issue.key)}
            onBlur={() => setHover(null)}
            onClick={() => onPick?.(issue)}
            aria-label={`${issue.key}: ${issue.summary}. ${STATUS_LABEL[issue.status]}, open ${issue.days_open} days`}
          >
            <span
              className={`tick tick-${STATUS_KEY[issue.status]}`}
              style={{ height: `${height}%`, animationDelay: `${index * 25}ms` }}
            />
            {hover === issue.key && (
              <span className={`tip ${index > sorted.length / 2 ? "tip-right" : ""}`} role="tooltip">
                <span className="tip-key">{issue.key}</span>
                <span className="tip-title">{issue.summary}</span>
                <span className="tip-meta">
                  <span className={`dot dot-${STATUS_KEY[issue.status]}`} />
                  {STATUS_LABEL[issue.status]}, open {issue.days_open} {issue.days_open === 1 ? "day" : "days"}
                </span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
