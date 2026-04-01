# app/api/actions.py — Dynamic quick actions and KB management

from fastapi import APIRouter, Request
from app.config import get_logger

log = get_logger(__name__)
router = APIRouter()

# Dynamic quick actions that can be updated without redeploying
QUICK_ACTIONS = [
    {"label": "Book a Flight", "message": "Book a flight from Delhi to Mumbai", "icon": "plane"},
    {"label": "Book a Train", "message": "Book a train from Bangalore to Chennai", "icon": "train"},
    {"label": "Book a Bus", "message": "Book a bus from Hyderabad to Bangalore", "icon": "bus"},
    {"label": "Baggage Rules", "message": "What is the cabin baggage limit for domestic flights?", "icon": "luggage"},
    {"label": "IRCTC Help", "message": "How do I book tatkal tickets on IRCTC?", "icon": "help"},
    {"label": "Cancellation Policy", "message": "What is the cancellation policy for train tickets?", "icon": "cancel"},
]


@router.get("/quick-actions")
def get_quick_actions():
    """Return dynamic quick action suggestions."""
    return {"actions": QUICK_ACTIONS}


@router.post("/admin/reload-kb")
async def reload_knowledge_base(request: Request):
    """Hot-reload the knowledge base without restarting the server."""
    rag = getattr(request.app.state, "rag", None)
    if not rag:
        return {"status": "error", "message": "RAG pipeline not initialized"}

    try:
        rag.reload()
        chunk_count = len(rag.vector_store.documents)
        return {
            "status": "success",
            "message": f"Knowledge base reloaded with {chunk_count} chunks"
        }
    except Exception as e:
        log.error("KB reload failed: %s", e)
        return {"status": "error", "message": str(e)}


@router.get("/admin/kb-stats")
async def kb_stats(request: Request):
    """Get knowledge base statistics."""
    rag = getattr(request.app.state, "rag", None)
    if not rag:
        return {"status": "not_initialized"}

    return {
        "status": "ready" if rag.vector_store.index is not None else "not_ready",
        "total_chunks": len(rag.vector_store.documents),
        "sample_chunks": rag.vector_store.documents[:3] if rag.vector_store.documents else [],
    }
