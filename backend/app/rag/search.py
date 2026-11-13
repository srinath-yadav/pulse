"""Semantic search over the indexed project documents."""
from app.models import DocHit
from app.rag.db import connect
from app.rag.embeddings import embed_query


def search_docs(query: str, project_key: str | None = None, limit: int = 4) -> list[DocHit]:
    """Return the chunks closest in meaning to the query, best first.

    project_key restricts the search to one client's documents. This filter runs inside
    the SQL query, so other clients' chunks are never even read: that is the access control.
    """
    vector = embed_query(query)
    sql = "SELECT source, heading, content, 1 - (embedding <=> %(v)s) AS score FROM doc_chunks"
    params: dict = {"v": vector, "limit": limit}
    if project_key:
        sql += " WHERE project_key = %(project)s"
        params["project"] = project_key.upper()
    sql += " ORDER BY embedding <=> %(v)s LIMIT %(limit)s"  # <=> is cosine distance: smaller = closer

    with connect() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [DocHit(source=s, heading=h, content=c, score=round(float(score), 3)) for s, h, c, score in rows]