"""
POST /rag/query
- Accepts a user question
- Retrieves top-k chunks from the vector store
- Passes them to the LLM
- Returns a context-aware answer
"""

import re
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, validator

from vector_store import get_vector_store
from llm_client   import generate_response
from auth_guard   import verify_token
from cache        import get_cache

router = APIRouter()

TOP_K_DEFAULT = 5
TOP_K_MAX     = 10

# ── Schema ────────────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    query: str
    top_k: int = TOP_K_DEFAULT

    @validator("query")
    def query_not_empty(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("query must not be empty")
        if len(v) > 2000:
            raise ValueError("query exceeds maximum length of 2000 characters")
        # Basic sanitation — strip control chars
        v = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', v)
        return v

    @validator("top_k")
    def top_k_in_range(cls, v):
        if v < 1 or v > TOP_K_MAX:
            raise ValueError(f"top_k must be between 1 and {TOP_K_MAX}")
        return v


class QueryResponse(BaseModel):
    answer:        str
    model:         str
    sources:       list
    context_used:  int
    cached:        bool


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/query", response_model=QueryResponse)
async def rag_query(
    req: QueryRequest,
    token_data: dict = Depends(verify_token),
):
    cache = get_cache()

    # Check cache first
    cached = cache.get(req.query, req.top_k)
    if cached:
        cached["cached"] = True
        return cached

    store = get_vector_store()

    if store.total_chunks() == 0:
        raise HTTPException(
            status_code=422,
            detail="Knowledge base is empty. Upload documents via POST /rag/upload first.",
        )

    # Retrieve top-k chunks
    results = store.query(req.query, top_k=req.top_k)

    context_chunks  = [r[0]["text"] for r in results]
    source_metadata = [
        {"source": r[0]["source"], "score": round(r[1], 4), "metadata": r[0].get("metadata", {})}
        for r in results
    ]

    # Generate LLM answer
    llm_result = await generate_response(req.query, context_chunks)

    response_data = {
        "answer":       llm_result["answer"],
        "model":        llm_result["model"],
        "sources":      source_metadata,
        "context_used": llm_result["context_used"],
        "cached":       False,
    }

    # Cache it
    cache.set(req.query, req.top_k, response_data)

    return response_data
