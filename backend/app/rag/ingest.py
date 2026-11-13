"""Index every project document into pgvector.

Run from backend/:  uv run python -m app.rag.ingest
Safe to run again: it rebuilds the index from the files.
Files live in data/docs/<PROJECT_KEY>/ and can be .md .txt .pdf .docx .csv or .xlsx.
"""
import logging
from pathlib import Path

from app.rag.chunking import Chunk, chunk_document
from app.rag.db import connect, init_schema
from app.rag.embeddings import embed_passages
from app.rag.parsing import SUPPORTED_EXTENSIONS, UnsupportedFileError, parse_file

logger = logging.getLogger(__name__)

DOCS_DIR = Path(__file__).resolve().parent.parent / "data" / "docs"


def collect_chunks() -> tuple[list[Chunk], list[str], list[str]]:
    """Parse and chunk every file. Returns (chunks, project keys, skipped files)."""
    chunks, keys, skipped = [], [], []
    for path in sorted(p for p in DOCS_DIR.glob("*/*") if p.is_file()):
        source = f"{path.parent.name}/{path.name}"
        if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            skipped.append(f"{source} (unsupported type)")
            continue
        try:
            doc = parse_file(path, source)
        except UnsupportedFileError as e:
            skipped.append(str(e))
            continue
        except Exception as e:  # a broken file must not stop the whole index
            skipped.append(f"{source} (could not parse: {e})")
            continue
        for chunk in chunk_document(doc):
            chunks.append(chunk)
            keys.append(path.parent.name.upper())
    return chunks, keys, skipped


def main() -> None:
    chunks, keys, skipped = collect_chunks()
    for s in skipped:
        print(f"Skipped: {s}")
    files = len({c.source for c in chunks})
    print(f"Embedding {len(chunks)} chunks from {files} files…")
    vectors = embed_passages([c.content for c in chunks])

    with connect() as conn:
        init_schema(conn)
        with conn.transaction():  # all or nothing: never leave a half-built index
            conn.execute("TRUNCATE doc_chunks")
            with conn.cursor() as cur:
                cur.executemany(
                    "INSERT INTO doc_chunks (project_key, source, heading, content, embedding) "
                    "VALUES (%s, %s, %s, %s, %s)",
                    [(k, c.source, c.heading, c.content, v) for k, c, v in zip(keys, chunks, vectors)],
                )
    print(f"Indexed {len(chunks)} chunks.")


if __name__ == "__main__":
    main()
