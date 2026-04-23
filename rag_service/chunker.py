"""
Document chunker — handles PDFs, plain text, and raw strings.
Splits into overlapping chunks for better retrieval quality.
"""

import re
import io
from typing import List, Optional

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False
    print("[RAG] PyMuPDF not installed. PDF support disabled. Run: pip install pymupdf")

CHUNK_SIZE = 500      # characters per chunk
CHUNK_OVERLAP = 100   # overlap to preserve context at boundaries


def chunk_text(text: str, source: str = "manual", metadata: Optional[dict] = None) -> List[dict]:
    """Split a long string into overlapping chunks."""
    text = _clean(text)
    chunks = []
    start = 0
    meta = metadata or {}

    while start < len(text):
        end = start + CHUNK_SIZE
        chunk_text = text[start:end].strip()
        if chunk_text:
            chunks.append({
                "text": chunk_text,
                "source": source,
                "metadata": {**meta, "start_char": start, "end_char": end}
            })
        start += CHUNK_SIZE - CHUNK_OVERLAP

    return chunks


def chunk_pdf(pdf_bytes: bytes, filename: str = "uploaded.pdf") -> List[dict]:
    """Extract text from PDF bytes and chunk it."""
    if not PYMUPDF_AVAILABLE:
        raise RuntimeError("PyMuPDF is not installed. Run: pip install pymupdf")

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    all_chunks = []

    for page_num, page in enumerate(doc):
        page_text = page.get_text("text")
        if not page_text.strip():
            continue
        page_chunks = chunk_text(
            page_text,
            source=filename,
            metadata={"page": page_num + 1}
        )
        all_chunks.extend(page_chunks)

    doc.close()
    return all_chunks


def chunk_news_articles(articles: List[dict]) -> List[dict]:
    """
    Convert a list of news article dicts (from the existing /unbiased-news endpoint)
    into chunks for the RAG store.
    Expected keys per article: title, content/description, url, source
    """
    all_chunks = []
    for art in articles:
        title = art.get("title", "")
        content = art.get("content") or art.get("description") or ""
        url = art.get("url", "")
        source = art.get("source", "unknown")
        full_text = f"Title: {title}\n\n{content}"
        chunks = chunk_text(full_text, source=source, metadata={"url": url, "title": title})
        all_chunks.extend(chunks)
    return all_chunks


# ── Private helpers ───────────────────────────────────────────────────────────

def _clean(text: str) -> str:
    """Remove excess whitespace and control characters."""
    text = re.sub(r'\r\n|\r', '\n', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)
    return text.strip()
