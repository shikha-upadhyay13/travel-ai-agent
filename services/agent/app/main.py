from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.config import get_logger, CORS_ORIGINS
from app.api.chat import router as chat_router
from app.api.health import router as health_router
from app.api.bookings import router as bookings_router
from app.api.stream import router as stream_router
from app.api.actions import router as actions_router

log = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting Travel AI Agent...")

    # Initialize database
    from app.db.database import init_db
    init_db()

    # Initialize RAG pipeline
    from app.rag.knowledge_base.rag_pipeline import RAGPipeline
    app.state.rag = RAGPipeline()

    log.info("Server ready")
    yield
    log.info("Shutting down")


app = FastAPI(title="Travel AI Agent", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(health_router)
app.include_router(bookings_router)
app.include_router(stream_router)
app.include_router(actions_router)

frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")

if os.path.isdir(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

    @app.get("/")
    def serve_frontend():
        return FileResponse(os.path.join(frontend_dir, "index.html"))
else:
    @app.get("/")
    def root():
        return {"message": "Travel AI Backend Running"}
