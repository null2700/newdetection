"""
POST /rag/upload
- Accepts text, PDFs, or raw database articles.
- Chunks them.
- Adds them to the vector store.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List
from pydantic import BaseModel

from vector_store import get_vector_store
from chunker import chunk_text, chunk_pdf, chunk_news_articles
from auth_guard import verify_token

router = APIRouter()

class SyncArticlesRequest(BaseModel):
    articles: List[dict]

@router.post("/upload/text")
async def upload_text(
    text: str = Form(...),
    source: str = Form("manual"),
    token_data: dict = Depends(verify_token)
):
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text is empty")
    
    chunks = chunk_text(text, source=source)
    store = get_vector_store()
    num_added = store.add_chunks(chunks)
    
    return {"status": "success", "chunks_added": num_added, "total_chunks": store.total_chunks()}

@router.post("/upload/pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    token_data: dict = Depends(verify_token)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        content = await file.read()
        chunks = chunk_pdf(content, filename=file.filename)
        store = get_vector_store()
        num_added = store.add_chunks(chunks)
        return {"status": "success", "chunks_added": num_added, "total_chunks": store.total_chunks()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload/articles")
async def sync_articles(
    req: SyncArticlesRequest,
    token_data: dict = Depends(verify_token)
):
    if not req.articles:
        raise HTTPException(status_code=400, detail="No articles provided")
        
    chunks = chunk_news_articles(req.articles)
    store = get_vector_store()
    num_added = store.add_chunks(chunks)
    
    return {"status": "success", "chunks_added": num_added, "total_chunks": store.total_chunks()}
