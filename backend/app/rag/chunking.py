"""Split parsed documents into chunks small enough to search precisely."""
from dataclasses import dataclass

from app.rag.parsing import Document

MAX_CHARS = 800  # roughly 150-200 words: one focused idea per chunk
OVERLAP = 120    # repeated between long-section windows so no sentence is cut off from its context


@dataclass
class Chunk:
    source: str   # file path, used for citations, e.g. HLX/weekly-sync-2026-11-10.md
    heading: str  # "Document title > Section"
    content: str  # the text that gets embedded and returned


def chunk_document(doc: Document) -> list[Chunk]:
    """One chunk per section; long sections are split into overlapping windows.

    Each chunk starts with its document title and section heading, so a chunk like
    "Still blocked..." still says which client and topic it belongs to.
    """
    chunks: list[Chunk] = []
    for section in doc.sections:
        body = section.text.strip()
        if not body:
            continue
        heading = f"{doc.title} > {section.heading}"
        for window in _windows(body):
            chunks.append(Chunk(source=doc.source, heading=heading, content=f"{heading}\n{window}"))
    return chunks


def _windows(body: str) -> list[str]:
    if len(body) <= MAX_CHARS:
        return [body]
    windows, start = [], 0
    while start < len(body):
        end = min(start + MAX_CHARS, len(body))
        if end < len(body):  # end on a word boundary
            end = body.rfind(" ", start, end) if " " in body[start:end] else end
        windows.append(body[start:end].strip())
        if end >= len(body):
            break
        # step back by OVERLAP characters, then forward to the next word start
        back = body.find(" ", max(end - OVERLAP, start + 1))
        start = back + 1 if 0 <= back < end else end
    return windows
