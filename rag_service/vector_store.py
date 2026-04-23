"""
Vector Store — wraps FAISS for document embedding storage and retrieval.
Uses sentence-transformers locally (no API key needed).
"""

import os
import pickle
import numpy as np
from typing import List, Tuple
from sentence_transformers import SentenceTransformer

# Lazy-load FAISS to avoid import errors if not installed
try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    print("[RAG] WARNING: faiss-cpu not installed. Install it: pip install faiss-cpu")

VECTOR_STORE_PATH = os.path.join(os.path.dirname(__file__), "..", "rag_data", "faiss_index.pkl")
EMBEDDING_MODEL = "all-MiniLM-L6-v2"   # Small, fast, 384-dim — runs fully locally


class VectorStore:
    def __init__(self):
        self.model = SentenceTransformer(EMBEDDING_MODEL)
        self.dim = 384
        self.index = None
        self.chunks: List[dict] = []   # [{text, source, metadata}]
        self._load_or_init()

    # ── Persistence ──────────────────────────────────────────────────────────

    def _load_or_init(self):
        os.makedirs(os.path.dirname(VECTOR_STORE_PATH), exist_ok=True)
        if os.path.exists(VECTOR_STORE_PATH):
            try:
                with open(VECTOR_STORE_PATH, "rb") as f:
                    state = pickle.load(f)
                self.chunks = state["chunks"]
                if FAISS_AVAILABLE:
                    self.index = faiss.deserialize_index(state["faiss_bytes"])
                print(f"[RAG] Loaded {len(self.chunks)} chunks from disk.")
            except Exception as e:
                print(f"[RAG] Could not load store, reinitialising: {e}")
                self._init_index()
        else:
            self._init_index()

    def _save(self):
        os.makedirs(os.path.dirname(VECTOR_STORE_PATH), exist_ok=True)
        state = {"chunks": self.chunks}
        if FAISS_AVAILABLE and self.index is not None:
            state["faiss_bytes"] = faiss.serialize_index(self.index)
        with open(VECTOR_STORE_PATH, "wb") as f:
            pickle.dump(state, f)

    def _init_index(self):
        if FAISS_AVAILABLE:
            self.index = faiss.IndexFlatL2(self.dim)
        self.chunks = []

    # ── Ingestion ─────────────────────────────────────────────────────────────

    def add_chunks(self, chunks: List[dict]):
        """
        chunks: list of { "text": str, "source": str, "metadata": dict }
        """
        texts = [c["text"] for c in chunks]
        embeddings = self.model.encode(texts, convert_to_numpy=True).astype(np.float32)

        if FAISS_AVAILABLE:
            if self.index is None:
                self._init_index()
            self.index.add(embeddings)
        
        self.chunks.extend(chunks)
        self._save()
        return len(chunks)

    # ── Retrieval ─────────────────────────────────────────────────────────────

    def query(self, query_text: str, top_k: int = 5) -> List[Tuple[dict, float]]:
        """Returns list of (chunk_dict, distance_score) tuples."""
        if not self.chunks:
            return []

        query_vec = self.model.encode([query_text], convert_to_numpy=True).astype(np.float32)

        if FAISS_AVAILABLE and self.index is not None and self.index.ntotal > 0:
            k = min(top_k, self.index.ntotal)
            distances, indices = self.index.search(query_vec, k)
            results = []
            for dist, idx in zip(distances[0], indices[0]):
                if idx < len(self.chunks):
                    results.append((self.chunks[idx], float(dist)))
            return results
        else:
            # Fallback: cosine similarity without FAISS
            all_texts = [c["text"] for c in self.chunks]
            embeddings = self.model.encode(all_texts, convert_to_numpy=True).astype(np.float32)
            sims = np.dot(embeddings, query_vec.T).flatten()
            top_indices = np.argsort(sims)[::-1][:top_k]
            return [(self.chunks[i], float(sims[i])) for i in top_indices]

    def total_chunks(self) -> int:
        return len(self.chunks)


# Singleton — loaded once when the service starts
_store_instance: VectorStore = None


def get_vector_store() -> VectorStore:
    global _store_instance
    if _store_instance is None:
        _store_instance = VectorStore()
    return _store_instance
