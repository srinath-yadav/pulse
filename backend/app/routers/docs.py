import logging

import psycopg
from fastapi import APIRouter, HTTPException, Query

from app.models import DocHit
from app.rag.search import search_docs

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects", tags=["documents"])


# A plain "def" (not async): embedding and the database call block, so FastAPI
# runs this in a worker thread and the event loop stays free for other requests.
@router.get("/{key}/docs/search", response_model=list[DocHit])
def search_project_docs(
    key: str,
    q: str = Query(min_length=2, max_length=300, description="What to search for"),
    limit: int = Query(4, ge=1, le=10),
):
    try:
        return search_docs(q, project_key=key, limit=limit)
    except psycopg.OperationalError:
        logger.exception("Document search failed")
        raise HTTPException(status_code=503, detail="Document search is unavailable. Is the database running?")