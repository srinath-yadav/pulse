import type {
  AskResponse,
  Project,
  ProjectReport,
  ProjectSummary,
} from "./types";

// Vite proxies /api to the FastAPI backend (see vite.config.ts)
// Dev: Vite proxies /api to FastAPI. Production: VITE_API_URL is the backend's address.
const BASE = import.meta.env.VITE_API_URL ?? "/api";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listProjects: () => request<ProjectSummary[]>("/projects"),
  getProject: (key: string) => request<Project>(`/projects/${key}`),

  // Overview needs issue-level data for every project (blocked + stale issues)
  async listProjectDetails(): Promise<Project[]> {
    const summaries = await api.listProjects();
    return Promise.all(summaries.map((s) => api.getProject(s.key)));
  },

  generateReport: (key: string) =>
    request<ProjectReport>(`/projects/${key}/report`, { method: "POST" }),

  ask: (question: string, projectKey?: string) =>
    request<AskResponse>("/ask", {
      method: "POST",
      body: JSON.stringify({ question, project_key: projectKey ?? null }),
    }),
};
