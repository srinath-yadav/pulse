import type { IssueStatus } from "../types";

// Triage order: what needs a decision first
export const STATUSES: IssueStatus[] = ["Blocked", "In Progress", "To Do", "Done"];
// Workflow order: used by the board
export const WORKFLOW: IssueStatus[] = ["To Do", "In Progress", "Blocked", "Done"];

export const STATUS_KEY: Record<IssueStatus, "blocked" | "progress" | "todo" | "done"> = {
  Blocked: "blocked",
  "In Progress": "progress",
  "To Do": "todo",
  Done: "done",
};

export const STATUS_LABEL: Record<IssueStatus, string> = {
  Blocked: "Blocked",
  "In Progress": "In progress",
  "To Do": "To do",
  Done: "Done",
};

export const triageRank = (s: IssueStatus) => STATUSES.indexOf(s);
