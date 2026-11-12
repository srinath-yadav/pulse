// Mirrors the Pydantic models in backend/app/models.py

export type IssueStatus = "To Do" | "In Progress" | "Blocked" | "Done";
export type IssuePriority = "Low" | "Medium" | "High" | "Critical";

export interface Issue {
  key: string;
  summary: string;
  status: IssueStatus;
  priority: IssuePriority;
  assignee: string | null;
  story_points: number | null;
  days_open: number;
}

export interface Project {
  key: string;
  name: string;
  client: string;
  issues: Issue[];
}

export interface ProjectSummary {
  key: string;
  name: string;
  client: string;
  total_issues: number;
  blocked: number;
  done: number;
}

// Shape of the AI report we will build in Step 3 (backend: POST /projects/{key}/report)
export interface ProjectReport {
  summary: string;
  blockers: string[];
  risk_level: "low" | "medium" | "high";
  est_completion_days: number;
}
