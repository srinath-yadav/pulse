import { STALE_DAYS } from "./health";
import type { Issue } from "../types";

export interface Kpi {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone?: "blocked" | "risk" | "good";
  share?: number; // 0..1, drawn as a thin bar under the value
  shareTone?: "done" | "blocked";
}

const points = (list: Issue[]) =>
  list.reduce((n, i) => n + (i.story_points ?? 0), 0);
const pct = (part: number, whole: number) =>
  whole ? Math.round((part / whole) * 100) : 0;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * Delivery KPIs a PM acts on. Measured in story points where size matters,
 * so one big blocked story counts for more than a small one.
 * Works for one project or for every project at once.
 */
export function deliveryKpis(issues: Issue[]): Kpi[] {
  const open = issues.filter((i) => i.status !== "Done");
  const done = issues.filter((i) => i.status === "Done");
  const blocked = issues.filter((i) => i.status === "Blocked");
  const unassigned = open.filter((i) => !i.assignee);
  const urgentUnowned = unassigned.filter(
    (i) => i.priority === "High" || i.priority === "Critical",
  );

  const totalPts = points(issues);
  const openPts = points(open);
  const blockedPts = points(blocked);
  const blockedShare = openPts ? blockedPts / openPts : 0;

  const ages = open.map((i) => i.days_open);
  const avgAge =
    ages.length ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;
  const oldest = ages.length ? Math.max(...ages) : 0;

  return [
    {
      id: "delivered",
      label: "Delivered",
      value: `${pct(points(done), totalPts)}%`,
      detail: `${points(done)} of ${totalPts} story points`,
      share: totalPts ? points(done) / totalPts : 0,
      shareTone: "done",
    },
    {
      id: "open",
      label: "Open work",
      value: `${openPts} pts`,
      detail: `${plural(open.length, "issue")} still open`,
    },
    {
      id: "blocked",
      label: "Blocked work",
      value: `${Math.round(blockedShare * 100)}%`,
      detail:
        blocked.length ?
          `of open points, across ${plural(blocked.length, "issue")}`
        : "Nothing is blocked",
      tone: blocked.length ? "blocked" : "good",
      share: blockedShare,
      shareTone: "blocked",
    },
    {
      id: "age",
      label: "Average age",
      value: `${avgAge.toFixed(1)} days`,
      detail:
        open.length ? `Oldest open issue: ${oldest} days` : "No open issues",
      tone: oldest >= STALE_DAYS ? "risk" : undefined,
    },
    {
      id: "owner",
      label: "Needs an owner",
      value: `${unassigned.length}`,
      detail:
        unassigned.length ?
          urgentUnowned.length ?
            `${urgentUnowned.length} of them high priority`
          : "All low or medium priority"
        : "Every open issue has an owner",
      tone:
        urgentUnowned.length ? "risk"
        : unassigned.length ? undefined
        : "good",
    },
  ];
}
