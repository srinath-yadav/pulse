# Pulse API

FastAPI backend for Pulse. It serves client project data, writes AI status reports, runs the Ask Pulse agent, and searches project documents with RAG.

For what Pulse does and how to run the whole app, see the [root README](../README.md).

## Run it

```bash
docker compose up -d db              # from the repo root: PostgreSQL with pgvector
cd backend
cp .env.example .env
uv sync
uv run python -m app.rag.ingest      # index the sample documents
uv run uvicorn app.main:app --reload
```

Interactive API docs: http://localhost:8000/docs

## Configuration

Settings come from environment variables or `backend/.env`, validated by `app/config.py`.

| Variable              | Default                                         | Purpose                                       |
| --------------------- | ----------------------------------------------- | --------------------------------------------- |
| `LLM_PROVIDER`        | `offline`                                       | `offline`, `openai_compatible` or `anthropic` |
| `LLM_MODEL`           | `claude-haiku-5-5`                              | Model name for the chosen provider            |
| `LLM_BASE_URL`        | Groq's URL                                      | Base URL for any OpenAI-compatible API        |
| `LLM_API_KEY`         | none                                            | Key for the OpenAI-compatible API             |
| `ANTHROPIC_API_KEY`   | none                                            | Key for Anthropic                             |
| `LLM_TIMEOUT_SECONDS` | `30`                                            | Timeout for each LLM call                     |
| `DATABASE_URL`        | `postgresql://pulse:pulse@localhost:5433/pulse` | Postgres with pgvector                        |

Never commit `.env`. Only `.env.example` belongs in git.

## Endpoints

| Method | Path                                    | Notes                                                                                               |
| ------ | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| GET    | `/health`                               | Health check                                                                                        |
| GET    | `/projects`                             | All projects with open, blocked and done counts                                                     |
| GET    | `/projects/{key}`                       | One project with its issues. Returns `404` if the key is unknown                                    |
| POST   | `/projects/{key}/report`                | AI status report. Returns `502` if the LLM fails or replies with invalid data                       |
| GET    | `/projects/{key}/docs/search?q=&limit=` | Semantic search over one project's documents. Returns `503` if the database is down                 |
| POST   | `/ask`                                  | Ask Pulse. Body: `{"question": "...", "project_key": "HLX"}`. Returns `503` without an LLM provider |

## Code layout

```
app/
├── main.py                  App setup, CORS, logging, routers
├── config.py                Settings (pydantic-settings)
├── models.py                Pydantic models for every request and response
├── routers/
│   ├── projects.py          Projects and AI reports
│   ├── ask.py               Ask Pulse agent
│   └── docs.py              Document search
├── services/
│   ├── jira_service.py      Project data (sample JSON behind one interface)
│   ├── report_service.py    Report generators: offline, Anthropic, OpenAI-compatible
│   ├── agent_service.py     Agent loop: tool calls, step limit, retries, citations
│   └── agent_tools.py       Read-only tools and their JSON schemas
├── rag/
│   ├── parsing.py           One parser per file type, all returning a Document
│   ├── chunking.py          Section-based chunks with overlapping windows
│   ├── embeddings.py        Local embedding model (fastembed)
│   ├── db.py                Connection and schema (pgvector, HNSW index)
│   ├── ingest.py            Parse, chunk, embed and store every document
│   └── search.py            Vector search with a per-project filter
└── data/
    ├── sample_issues.json   Jira-style issues for three made-up clients
    └── docs/<PROJECT_KEY>/  Project documents to index
```

## Design notes

- **Interfaces over providers.** Routes depend on `ReportGenerator` and `JiraService`, not on a specific LLM or data source. Switching from Groq to Claude, or from sample data to Jira, doesn't touch the routes.
- **Validated LLM output.** Reports are forced into a JSON schema with tool use, then validated with Pydantic before they leave the API.
- **Read-only agent.** The agent can only call functions on an allow-list in `agent_tools.py`, and none of them write anything. Bad tool calls return an error to the model instead of crashing.
- **Bounded agent loop.** At most 5 steps. On the last step the tools are removed so the model must answer. Malformed tool calls get a retry.
- **Blocking work stays off the event loop.** The search endpoint is a plain `def`, and the agent runs tools through `asyncio.to_thread`, because embedding and database calls block.
- **Per-project access control in RAG.** The project filter runs inside the SQL query, so one client's documents never appear in another client's answers.
- **Honest "no answer".** Search results below a similarity threshold (`MIN_SCORE` in `agent_tools.py`) are dropped, and the agent says when the documents don't cover a question.

## Common tasks

**Add a document:** put the file in `app/data/docs/<PROJECT_KEY>/` and run `uv run python -m app.rag.ingest` again. The ingest rebuilds the index in one transaction and lists any files it skipped.

**Support a new file type:** write a parser in `rag/parsing.py` that returns a `Document`, then add it to `PARSERS`. Chunking, embedding and search need no changes.

**Add an LLM provider:** for an OpenAI-compatible API, only `.env` changes. For anything else, write a class with an async `generate(project)` method in `report_service.py`, and add a branch to `get_report_generator()`.

**Give the agent a new tool:** add a read-only function to `agent_tools.py`, register it in `TOOLS`, and describe it in `TOOL_SCHEMAS`. The description is what the model uses to decide when to call it.

## Logs

Every LLM call and tool call is logged to the terminal:

```
report provider=openai_compatible project=HLX model=... input_tokens=... output_tokens=... latency_ms=...
agent tool=search_documents args={"query": "..."} ok=True
agent done steps=3 tools=['find_attention_issues', 'search_documents'] latency_ms=...
```

Warnings include `finish_reason` when a reply comes back empty or malformed, which shows why the model stopped.
