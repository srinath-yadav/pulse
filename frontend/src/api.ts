import type {
  AskResponse,
  Project,
  ProjectReport,
  ProjectSummary,
} from "./types";

// Dev: Vite proxies /api to FastAPI. Production: VITE_API_URL is the backend's address.
const BASE = import.meta.env.VITE_API_URL ?? "/api";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Long enough for an AI answer, short enough that a dead server doesn't hang the UI
const TIMEOUT_MS = { data: 25_000, ai: 60_000 };

async function request<T>(
  path: string,
  init?: RequestInit,
  timeoutMs = TIMEOUT_MS.data,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
      ...init,
    });
  } catch {
    // Server down, asleep, blocked by CORS or timed out: status 0 means "no response"
    throw new ApiError(0, "No response from the server");
  }
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
    request<ProjectReport>(
      `/projects/${key}/report`,
      { method: "POST" },
      TIMEOUT_MS.ai,
    ),

  ask: (question: string, projectKey?: string) =>
    request<AskResponse>(
      "/ask",
      {
        method: "POST",
        body: JSON.stringify({ question, project_key: projectKey ?? null }),
      },
      TIMEOUT_MS.ai,
    ),
};
