import psycopg
from pgvector.psycopg import register_vector

from app.config import get_settings
from app.rag.embeddings import EMBEDDING_DIM


def connect() -> psycopg.Connection:
    conn = psycopg.connect(get_settings().database_url, autocommit=True)
    conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
    register_vector(conn)  # lets psycopg send and receive numpy arrays as pgvector values
    return conn


def init_schema(conn: psycopg.Connection) -> None:
    conn.execute(f"""
        CREATE TABLE IF NOT EXISTS doc_chunks (
            id          BIGSERIAL PRIMARY KEY,
            project_key TEXT NOT NULL,
            source      TEXT NOT NULL,
            heading     TEXT NOT NULL,
            content     TEXT NOT NULL,
            embedding   VECTOR({EMBEDDING_DIM}) NOT NULL
        )
    """)
    # HNSW: approximate nearest-neighbour index for fast cosine search
    conn.execute("""
        CREATE INDEX IF NOT EXISTS doc_chunks_embedding_idx
        ON doc_chunks USING hnsw (embedding vector_cosine_ops)
    """)
    # Plain index for the per-project filter (access control)
    conn.execute("CREATE INDEX IF NOT EXISTS doc_chunks_project_idx ON doc_chunks (project_key)")
