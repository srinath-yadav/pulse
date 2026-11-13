"""A small in-memory rate limiter for the endpoints that call the LLM.

The public demo uses a free LLM quota, so one visitor must not be able to use it all up.
In-memory is fine for a single server; several servers would need a shared store like Redis.
"""
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

WINDOW_SECONDS = 3600
MAX_REQUESTS = 20  # per visitor per hour, across all AI endpoints

_hits: dict[str, deque[float]] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    # Behind a hosting proxy the real visitor IP is the first address in X-Forwarded-For
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def limit_ai_requests(request: Request) -> None:
    """FastAPI dependency: raises 429 when a visitor goes over the limit."""
    now = time.monotonic()
    hits = _hits[_client_ip(request)]
    while hits and now - hits[0] > WINDOW_SECONDS:
        hits.popleft()
    if len(hits) >= MAX_REQUESTS:
        retry_after = int(WINDOW_SECONDS - (now - hits[0])) + 1
        raise HTTPException(
            status_code=429,
            detail="You've reached the demo limit for AI requests. Try again later.",
            headers={"Retry-After": str(retry_after)},
        )
    hits.append(now)