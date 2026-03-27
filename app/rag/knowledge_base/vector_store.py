# app/rag/knowledge_base/vector_store.py

import faiss
import numpy as np
from app.rag.knowledge_base.embedding_service import embed_text

RELEVANCE_THRESHOLD = 1.5


class VectorStore:
    def __init__(self):
        self.documents = []
        self.index = None

    def build_index(self, docs: list):
        self.documents = docs
        embeddings = np.array([embed_text(doc) for doc in docs]).astype("float32")

        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(embeddings)

    def search(self, query: str, top_k: int = 3):
        query_vector = np.array([embed_text(query)]).astype("float32")
        distances, indices = self.index.search(query_vector, top_k)

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if dist <= RELEVANCE_THRESHOLD:
                results.append(self.documents[idx])

        return results
