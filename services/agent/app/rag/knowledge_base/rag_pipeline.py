import os
import httpx
from app.rag.knowledge_base.vector_store import VectorStore
from app.config import OLLAMA_URL, OLLAMA_MODEL, LLM_TIMEOUT, get_logger

log = get_logger(__name__)


class RAGPipeline:
    def __init__(self):
        self.vector_store = VectorStore()
        self.kb_dir = os.path.dirname(__file__)
        self._load_knowledge_base()

    def _load_knowledge_base(self):
        chunks = []
        seen = set()

        for filename in sorted(os.listdir(self.kb_dir)):
            if not filename.endswith(".txt"):
                continue
            filepath = os.path.join(self.kb_dir, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            for chunk in content.split("\n\n"):
                chunk = chunk.strip()
                if chunk and chunk not in seen:
                    seen.add(chunk)
                    chunks.append(chunk)

        if chunks:
            self.vector_store.build_index(chunks)
            log.info("RAG knowledge base loaded: %d unique chunks indexed", len(chunks))
        else:
            log.warning("No knowledge base chunks found")

    def reload(self):
        """Hot-reload the knowledge base without restarting the server."""
        log.info("Reloading knowledge base...")
        self._load_knowledge_base()
        log.info("Knowledge base reloaded successfully")

    async def answer_query(self, question: str) -> str:
        if self.vector_store.index is None:
            return "Knowledge base is not available at the moment."

        results = self.vector_store.search(question, top_k=3)

        if not results:
            return "I don't have specific information about that in my knowledge base. Could you try rephrasing your question, or ask about flights, trains, or bus travel in India?"

        context = "\n\n".join(results)

        prompt = (
            "You are a helpful Indian travel assistant. Answer the user's question "
            "based ONLY on the context provided below. Be specific and cite relevant details.\n"
            "If the context doesn't contain relevant information, say so honestly.\n"
            "Keep your answer concise (2-4 sentences).\n\n"
            f"Context:\n{context}\n\n"
            f"Question: {question}\n\n"
            "Answer:"
        )

        try:
            async with httpx.AsyncClient(timeout=float(LLM_TIMEOUT)) as client:
                response = await client.post(
                    OLLAMA_URL,
                    json={
                        "model": OLLAMA_MODEL,
                        "prompt": prompt,
                        "stream": False,
                        "options": {"temperature": 0.3}
                    }
                )

            result = response.json()
            return result.get("response", "Sorry, I couldn't generate an answer.").strip()

        except httpx.TimeoutException:
            log.error("Ollama timed out during RAG answer generation")
            return "The request took too long. Please try again."
        except Exception as e:
            log.error("RAG answer_query failed: %s", e)
            return "Sorry, I couldn't process your question right now."
