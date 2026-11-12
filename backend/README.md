# Pulse API

FastAPI backend for Pulse, a dashboard that brings Jira projects from several clients into one view and writes AI status reports for project managers.

## Stack

- Python 3.12, FastAPI, Pydantic v2, managed with uv
- Anthropic Claude for AI reports (structured output through tool use)
- Sample Jira data for now, behind a `JiraService` interface so the real Jira REST API can replace it

## Run it

```bash
cp .env.example .env        # choose offline or anthropic
uv sync
uv run uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs

## Endpoints

| Method | Path                     | What it does                                        |
| ------ | ------------------------ | --------------------------------------------------- |
| GET    | `/health`                | Health check                                        |
| GET    | `/projects`              | All client projects with issue counts               |
| GET    | `/projects/{key}`        | One project with its issues                         |
| POST   | `/projects/{key}/report` | AI status report: summary, blockers, risk, estimate |

## How the AI report works

The router depends on a `ReportGenerator` interface, chosen by `LLM_PROVIDER`:

- `offline` builds the report from simple rules. No API key needed, and useful in tests.
- `anthropic` sends the project's issues to Claude and forces a reply in the `ProjectReport` JSON schema. The reply is validated with Pydantic before it reaches the UI.

Guardrails: issue text is passed as data inside `<issues>` tags with an instruction to ignore instructions inside it, output size is capped by the schema, the SDK retries rate limits, and every call logs token usage and latency.
