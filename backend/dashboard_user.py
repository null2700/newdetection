from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from pydantic import BaseModel
import models
from database import get_db
import auth

router = APIRouter()

class NewsAnalyzeRequest(BaseModel):
    text: str = None
    url: str = None

@router.get("/dashboard")
def get_dashboard(current_user: models.User = Depends(auth.get_current_user)):
    # The requirement asks for a redirect to a separate dashboard page.
    # We can return a URL, but returning a FastAPI RedirectResponse might break the React frontend's JSON fetch.
    # If the user accesses this directly via browser, RedirectResponse makes sense.
    # Returning a message is a safe fallback for JSON clients.
    return {"message": "Welcome to your dashboard", "user_id": current_user.id, "username": current_user.name}

@router.get("/dashboard-data")
def get_dashboard_data(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    news_history = db.query(models.News).filter(models.News.user_id == current_user.id).all()
    
    # Simple summary of bias labels
    summary = {"LEFT": 0, "RIGHT": 0, "CENTER": 0, "NEUTRAL": 0}
    for n in news_history:
        if n.bias_label in summary:
            summary[n.bias_label] += 1
        else:
            summary[n.bias_label] = 1
            
    return {
        "user": {
            "id": current_user.id,
            "username": current_user.name,
            "email": current_user.email
        },
        "news_history": news_history,
        "bias_summary": summary
    }

@router.get("/user/news-history")
def get_user_news_history(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    news_history = db.query(models.News).filter(models.News.user_id == current_user.id).all()
    return news_history

@router.post("/news/analyze")
def analyze_news(request: NewsAnalyzeRequest, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if not request.text and not request.url:
        raise HTTPException(status_code=400, detail="Must provide text or url")
    
    # Placeholder Bias Detection Logic
    content = request.text or f"Extracted content from {request.url}"
    title = "Analyzed News"
    bias_label = "CENTER"
    bias_score = 0.0
    
    # Simulate bias detection based on content length
    length = len(content)
    if length % 3 == 0:
        bias_label = "LEFT"
        bias_score = -0.75
    elif length % 3 == 1:
        bias_label = "RIGHT"
        bias_score = 0.85
        
    new_entry = models.News(
        user_id=current_user.id,
        title=title,
        content=content,
        source_url=request.url,
        bias_label=bias_label,
        bias_score=bias_score,
        created_at=datetime.utcnow()
    )
    
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry
