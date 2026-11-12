import type { Issue, Project } from "../types";

export type Health = "on" | "risk" | "blocked";

// Days an open issue can sit before Pulse flags it as stale
export const STALE_DAYS = 7;

export const isOpen = (i: Issue) => i.status !== "Done";
export const isStale = (i: Issue) => isOpen(i) && i.days_open >= STALE_DAYS;

export function projectHealth(p: Project): Health {
  if (p.issues.some((i) => i.status === "Blocked")) return "blocked";
  if (p.issues.some(isStale)) return "risk";
  return "on";
}

export function progress(p: Project) {
  const done = p.issues.filter((i) => i.status === "Done").length;
  return p.issues.length ? Math.round((done / p.issues.length) * 100) : 0;
}

// Each status has its own shape as well as colour, so it reads without colour too
export const HEALTH: Record<Health, { label: string; shape: string }> = {
  on: { label: "On track", shape: "M6 1a5 5 0 1 1 0 10A5 5 0 0 1 6 1z" },
  risk: { label: "At risk", shape: "M6 1l5 10H1z" },
  blocked: { label: "Blocked", shape: "M1.5 1.5h9v9h-9z" },
};

export function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
