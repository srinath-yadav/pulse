"""Local, open-source embeddings. No API key, and the text never leaves the machine."""
from functools import lru_cache

import numpy as np
from fastembed import TextEmbedding

EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"
EMBEDDING_DIM = 384  # must match VECTOR(384) in the database


@lru_cache  # load the model once (first call downloads it, about 100 MB)
def _model() -> TextEmbedding:
    return TextEmbedding(model_name=EMBEDDING_MODEL)


def embed_passages(texts: list[str]) -> list[np.ndarray]:
    """Embed document chunks for storage."""
    return list(_model().passage_embed(texts))


def embed_query(text: str) -> np.ndarray:
    """Embed a search question. Use the same model as the passages, or the vectors won't match."""
    return next(iter(_model().query_embed(text)))
