import os
import httpx
from app.rag.knowledge_base.vector_store import VectorStore
from app.config import OLLAMA_URL, OLLAMA_MODEL, get_logger

log = get_logger(__name__)


class RAGPipeline:
    def __init__(self):
        self.vector_store = VectorStore()
        self._load_knowledge_base()

    def _load_knowledge_base(self):
        kb_dir = os.path.dirname(__file__)
        chunks = []
        seen = set()

        for filename in sorted(os.listdir(kb_dir)):
            if not filename.endswith(".txt"):
                continue
            filepath = os.path.join(kb_dir, filename)
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

    async def answer_query(self, question: str) -> str:
        if self.vector_store.index is None:
            return "Knowledge base is not available at the moment."

        results = self.vector_store.search(question, top_k=3)
        context = "\n\n".join(results)

        prompt = f"""You are a helpful travel assistant. Answer the user's question based on the context provided.
If the context doesn't contain relevant information, say you don't have that information.

Context:
{context}

Question: {question}

Answer concisely and helpfully:"""

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
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
