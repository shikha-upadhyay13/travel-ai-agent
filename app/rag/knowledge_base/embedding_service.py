# app/rag/knowledge_base/embedding_service.py

from app.config import get_logger

log = get_logger(__name__)

_model = None


def _get_model():
    global _model
    if _model is None:
        log.info("Loading sentence-transformer model (first use)...")
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        log.info("Model loaded successfully")
    return _model


def embed_text(text: str):
    return _get_model().encode(text)
