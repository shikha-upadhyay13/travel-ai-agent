from fastapi import APIRouter, Request
import httpx
from app.config import OLLAMA_URL

router = APIRouter()


@router.get("/health")
async def health_check(request: Request):
    status = {"api": "running"}

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
    status["rag"] = "ready" if rag and rag.vector_store.index is not None else "not_ready"

    return status
