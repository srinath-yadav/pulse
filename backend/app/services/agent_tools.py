"""Read-only tools the Ask Pulse agent can call.

Each tool is a plain Python function plus a JSON schema that tells the LLM
what the tool does and which arguments it takes.
"""
import json
from collections import Counter
from typing import Any, Callable

from app.services.jira_service import jira_service
from app.rag.search import search_docs

STALE_DAYS = 7


def _issue_dict(project_key: str, i) -> dict[str, Any]:
    return {
        "project": project_key, "key": i.key, "summary": i.summary, "status": i.status,
        "priority": i.priority, "assignee": i.assignee, "days_open": i.days_open,
    }


def list_clients() -> list[dict[str, Any]]:
    return [
        {
            "project_key": p.key, "client": p.client, "project": p.name,
            "open_issues": sum(i.status != "Done" for i in p.issues),
            "blocked": sum(i.status == "Blocked" for i in p.issues),
        }
        for p in jira_service.get_projects()
    ]


def get_project_issues(project_key: str, status: str | None = None) -> dict[str, Any]:
    project = jira_service.get_project(project_key)
    if not project:
        return {"error": f"No project with key {project_key}. Call list_clients to see valid keys."}
    issues = [i for i in project.issues if status is None or i.status == status]
    return {"client": project.client, "issues": [_issue_dict(project.key, i) for i in issues]}


def find_attention_issues(project_key: str | None = None) -> list[dict[str, Any]]:
    """Blocked issues, and open issues older than STALE_DAYS, oldest first."""
    found = []
    for p in jira_service.get_projects():
        if project_key and p.key != project_key.upper():
            continue
        for i in p.issues:
            if i.status == "Blocked" or (i.status != "Done" and i.days_open >= STALE_DAYS):
                found.append({**_issue_dict(p.key, i), "client": p.client,
                              "reason": "blocked" if i.status == "Blocked" else "stale"})
    return sorted(found, key=lambda x: -x["days_open"])


def get_workload(project_key: str | None = None) -> list[dict[str, Any]]:
    """Open issues per person, busiest first."""
    open_count: Counter[str] = Counter()
    blocked_count: Counter[str] = Counter()
    for p in jira_service.get_projects():
        if project_key and p.key != project_key.upper():
            continue
        for i in p.issues:
            if i.status == "Done":
                continue
            name = i.assignee or "Unassigned"
            open_count[name] += 1
            if i.status == "Blocked":
                blocked_count[name] += 1
    return [{"person": n, "open_issues": c, "blocked": blocked_count[n]} for n, c in open_count.most_common()]

def search_documents(query: str, project_key: str | None = None) -> list[dict[str, Any]]:
    """RAG: the project passages closest in meaning to the query, with their source files."""
    hits = search_docs(query, project_key=project_key, limit=4)
    return [{"source": h.source, "section": h.heading, "text": h.content, "score": h.score} for h in hits]

# Name -> function. The LLM can only call what is listed here.
TOOLS: dict[str, Callable[..., Any]] = {
    "list_clients": list_clients,
    "get_project_issues": get_project_issues,
    "find_attention_issues": find_attention_issues,
    "get_workload": get_workload,
        "search_documents": search_documents,
}

_PROJECT_KEY = {"type": "string", "description": "Project key such as HLX. Omit for all clients."}

TOOL_SCHEMAS = [
    {"type": "function", "function": {
        "name": "list_clients",
        "description": "List every client project with its key and counts of open and blocked issues.",
        "parameters": {"type": "object", "properties": {}},
    }},
    {"type": "function", "function": {
        "name": "get_project_issues",
        "description": "Get the issues of one project, optionally filtered by status.",
        "parameters": {"type": "object", "properties": {
            "project_key": {"type": "string", "description": "Project key such as HLX."},
            "status": {"type": "string", "enum": ["To Do", "In Progress", "Blocked", "Done"]},
        }, "required": ["project_key"]},
    }},
    {"type": "function", "function": {
        "name": "find_attention_issues",
        "description": f"Find blocked issues and open issues older than {STALE_DAYS} days, oldest first.",
        "parameters": {"type": "object", "properties": {"project_key": _PROJECT_KEY}},
    }},
    {"type": "function", "function": {
        "name": "get_workload",
        "description": "Count open and blocked issues per person, busiest first.",
        "parameters": {"type": "object", "properties": {"project_key": _PROJECT_KEY}},
    }},
        {"type": "function", "function": {
        "name": "search_documents",
        "description": ("Search project documents (meeting notes, specs, security reviews, spreadsheets) "
                        "for reasons, decisions, dates, contacts and requirements that are not in Jira. "
                        "Returns the most relevant passages with their source file."),
        "parameters": {"type": "object", "properties": {
            "query": {"type": "string", "description": "What to look for, in plain words."},
            "project_key": _PROJECT_KEY,
        }, "required": ["query"]},
    }},
]


def run_tool(name: str, raw_arguments: str | None) -> tuple[Any, bool]:
    """Run one tool call from the LLM. Returns (result, ok). Never raises."""
    if name not in TOOLS:
        return {"error": f"Unknown tool {name}"}, False
    try:
        args = json.loads(raw_arguments or "{}")
        if not isinstance(args, dict):
            raise ValueError("arguments must be a JSON object")
        return TOOLS[name](**args), True
    except Exception as e:  # bad JSON or wrong arguments: tell the model, let it retry
        return {"error": f"Invalid call to {name}: {e}"}, False