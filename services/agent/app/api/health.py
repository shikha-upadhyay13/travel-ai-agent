from fastapi import APIRouter, Request
import httpx
from app.config import OLLAMA_URL, OLLAMA_MODEL, get_logger

log = get_logger(__name__)
router = APIRouter()


@router.get("/health")
async def health_check(request: Request):
    status = {
        "api": "running",
        "model": OLLAMA_MODEL,
    }

    # Check Ollama
    try:
        ollama_base = OLLAMA_URL.replace("/api/generate", "")
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(ollama_base)
        status["ollama"] = "connected" if resp.status_code == 200 else "error"
    except Exception:
        status["ollama"] = "disconnected"

    # Check RAG
    rag = getattr(request.app.state, "rag", None)
    if rag and rag.vector_store.index is not None:
        status["rag"] = "ready"
        status["rag_chunks"] = len(rag.vector_store.documents)
    else:
        status["rag"] = "not_ready"

    # Overall status
    status["healthy"] = status["ollama"] == "connected" and status["rag"] == "ready"

    return status
