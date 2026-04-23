"""
Simple in-memory LRU cache for repeated RAG queries.
Avoids re-running embeddings + LLM calls for the same question.
"""

import hashlib
import time
from collections import OrderedDict
from typing import Optional

CACHE_TTL     = 300   # seconds (5 minutes)
CACHE_MAX_SIZE = 200  # max entries


class QueryCache:
    def __init__(self, max_size: int = CACHE_MAX_SIZE, ttl: int = CACHE_TTL):
        self.max_size = max_size
        self.ttl = ttl
        self._store: OrderedDict[str, dict] = OrderedDict()

    @staticmethod
    def _make_key(query: str, top_k: int) -> str:
        raw = f"{query.strip().lower()}|k={top_k}"
        return hashlib.md5(raw.encode()).hexdigest()

    def get(self, query: str, top_k: int) -> Optional[dict]:
        key = self._make_key(query, top_k)
        entry = self._store.get(key)
        if entry is None:
            return None
        if time.time() - entry["ts"] > self.ttl:
            del self._store[key]
            return None
        # LRU: move to end
        self._store.move_to_end(key)
        return entry["data"]

    def set(self, query: str, top_k: int, data: dict):
        key = self._make_key(query, top_k)
        if key in self._store:
            self._store.move_to_end(key)
        else:
            if len(self._store) >= self.max_size:
                self._store.popitem(last=False)   # evict oldest
        self._store[key] = {"ts": time.time(), "data": data}

    def stats(self) -> dict:
        return {"size": len(self._store), "max_size": self.max_size, "ttl": self.ttl}


# Module-level singleton
_cache = QueryCache()


def get_cache() -> QueryCache:
    return _cache
