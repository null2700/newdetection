"""
LLM Client — pluggable, supports:
  - OpenAI GPT-3.5 / GPT-4 (if OPENAI_API_KEY is set)
  - Ollama local models (if OLLAMA_BASE_URL is set, e.g. llama3)
  - Simple echo fallback (no config needed — for testing)
"""

import os
from typing import List

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL   = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "")   # e.g. http://localhost:11434
OLLAMA_MODEL    = os.getenv("OLLAMA_MODEL", "llama3")

SYSTEM_PROMPT = """You are an intelligent news bias analysis assistant.
You help users understand news bias, media framing, and political perspectives.
Answer clearly and factually. If you do not know something, say so.
Base your answers on the retrieved context documents provided below."""


def build_prompt(query: str, context_chunks: List[str]) -> List[dict]:
    """Build the messages list for an LLM chat completion."""
    context_block = "\n\n---\n\n".join(context_chunks)
    user_message = (
        f"Context from retrieved documents:\n\n{context_block}\n\n"
        f"---\n\nUser question: {query}"
    )
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user",   "content": user_message},
    ]


async def generate_response(query: str, context_chunks: List[str]) -> dict:
    """
    Tries backends in order:
      1. OpenAI (if API key present)
      2. Ollama (if OLLAMA_BASE_URL present)
      3. Echo fallback
    Returns: {"answer": str, "model": str, "context_used": int}
    """
    messages = build_prompt(query, context_chunks)

    if OPENAI_API_KEY:
        return await _call_openai(messages, context_chunks)

    if OLLAMA_BASE_URL:
        return await _call_ollama(messages, context_chunks)

    return _echo_fallback(query, context_chunks)


# ── OpenAI ────────────────────────────────────────────────────────────────────

async def _call_openai(messages: list, context_chunks: List[str]) -> dict:
    try:
        import openai
        client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)
        response = await client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=messages,
            max_tokens=800,
            temperature=0.3,
        )
        answer = response.choices[0].message.content.strip()
        return {"answer": answer, "model": f"openai/{OPENAI_MODEL}", "context_used": len(context_chunks)}
    except Exception as e:
        return {"answer": f"[OpenAI error: {e}]", "model": "openai/error", "context_used": 0}


# ── Ollama (local) ────────────────────────────────────────────────────────────

async def _call_ollama(messages: list, context_chunks: List[str]) -> dict:
    try:
        import httpx
        payload = {"model": OLLAMA_MODEL, "messages": messages, "stream": False}
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
            resp.raise_for_status()
            data = resp.json()
            answer = data["message"]["content"].strip()
        return {"answer": answer, "model": f"ollama/{OLLAMA_MODEL}", "context_used": len(context_chunks)}
    except Exception as e:
        return {"answer": f"[Ollama error: {e}]", "model": "ollama/error", "context_used": 0}


# ── Echo fallback (no LLM key needed) ────────────────────────────────────────

def _echo_fallback(query: str, context_chunks: List[str]) -> dict:
    """
    When no LLM is configured, return the retrieved context directly.
    Still useful for testing the RAG retrieval pipeline.
    """
    if not context_chunks:
        answer = "No relevant documents found in the knowledge base. Please upload some documents first."
    else:
        answer = (
            "⚠️ No LLM configured (set OPENAI_API_KEY or OLLAMA_BASE_URL in rag_service/.env).\n\n"
            "Here is what was retrieved from the knowledge base:\n\n"
            + "\n\n---\n\n".join(context_chunks[:3])
        )
    return {"answer": answer, "model": "echo/fallback", "context_used": len(context_chunks)}
