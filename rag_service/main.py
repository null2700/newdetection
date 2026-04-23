"""
RAG Service — Standalone Microservice
Runs on port 8001. Does NOT touch the existing backend on port 8000.
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import query_router, upload_router

app = FastAPI(
    title="RAG Intelligence Service",
    description="Retrieval-Augmented Generation microservice for the News Bias Detection Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(query_router.router, prefix="/rag", tags=["RAG Query"])
app.include_router(upload_router.router, prefix="/rag", tags=["RAG Upload"])


@app.get("/rag/health")
def health_check():
    return {"status": "ok", "service": "rag_service", "port": 8001}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
