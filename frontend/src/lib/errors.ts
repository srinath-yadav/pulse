import { ApiError } from "../api";

// Messages people see when a call fails. Setup hints (ports, .env) only show in dev.
const DEV = import.meta.env.DEV;

export function isOffline(e: unknown): boolean {
  return e instanceof ApiError && (e.status === 0 || e.status >= 500);
}

export function friendlyError(e: unknown, action: "ask" | "report"): string {
  const status = e instanceof ApiError ? e.status : -1;

  if (status === 429) {
    return "You've reached the demo limit for AI requests. Try again in an hour.";
  }
  if (status === 503) {
    return DEV ?
        "No LLM is configured. Set LLM_PROVIDER=openai_compatible and LLM_API_KEY in backend/.env, then restart the API."
      : "The AI features are switched off right now. The dashboard still works.";
  }
  if (status === 0) {
    return DEV ?
        "Can't reach the API. Start it with: uv run uvicorn app.main:app --reload --port 8000"
      : "The server took too long to respond. It may be waking up, so try again in a moment.";
  }
  if (status === 502) {
    return "The AI model didn't return a usable answer. Try again in a moment.";
  }
  return action === "ask" ?
      "Pulse couldn't answer that. Try again in a moment."
    : "Couldn't generate the report. Try again in a moment.";
}
