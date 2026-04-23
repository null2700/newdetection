import sys
import os
import re
import requests
import json
from fastapi import FastAPI, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from sqlalchemy.orm import Session

# Database and Auth setup
from backend import models, schemas, auth
from backend.database import engine, get_db, Base
# Add parent directory to path so we can import news_bias_filter
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from news_bias_filter import fetch_news, preprocess_text, predict_bias, explain_bias

import dashboard_user

# Load config
load_dotenv()
API_KEY = os.getenv("NEWS_API_KEY")

app = FastAPI(title="Bias Detection API - Production Ready")

app.include_router(dashboard_user.router)

@app.on_event("startup")
def startup():
    try:
        print("Connecting to database and creating tables...")
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully or already exist.")
    except Exception as e:
        print(f"Error creating tables: {e}")

# Enable CORS (so frontend can connect)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/auth/signup")
def signup(user: schemas.UserCreate, response: Response, db: Session = Depends(get_db)):
    try:
        db_user = db.query(models.User).filter(models.User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed_password = auth.get_password_hash(user.password)
        new_user = models.User(email=user.email, name=user.name, hashed_password=hashed_password)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Initialize gamification row
        new_gamification = models.Gamification(user_id=new_user.id)
        db.add(new_gamification)
        db.commit()
        
        access_token = auth.create_access_token(data={"sub": user.email})
        response.set_cookie(key="access_token", value=f"Bearer {access_token}", httponly=True, samesite="lax")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {"id": new_user.id, "email": new_user.email, "name": new_user.name}
        }
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/login")
def login(user: schemas.UserLogin, response: Response, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = auth.create_access_token(data={"sub": user.email})
    response.set_cookie(key="access_token", value=f"Bearer {access_token}", httponly=True, samesite="lax")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": db_user.id, "email": db_user.email, "name": db_user.name}
    }

@app.get("/auth/me", response_model=schemas.UserResponse)
def auth_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.get("/me", response_model=schemas.UserResponse)
def me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@app.post("/auth/logout")
def auth_logout(response: Response):
    response.delete_cookie("access_token")
    return {"status": "success"}

@app.get("/user/stats")
def user_stats(current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.gamification:
        return {"reading_streak": 0, "points": 0}
    return {"reading_streak": current_user.gamification.reading_streak, "points": current_user.gamification.points}

@app.get("/unbiased-news")
def get_news():
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API key is not configured in .env.")
    articles = fetch_news(API_KEY)
    return {"articles": articles}

@app.post("/analyze")
@app.post("/analyze-text")
def analyze_article(req: schemas.AnalyzeRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_optional_user)):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
        
    cleaned_text = preprocess_text(req.text)
    bias_types, confidence = predict_bias(cleaned_text)
    highlighted_text = explain_bias(req.text)    
    
    biases = []
    for b in bias_types:
        biases.append({
            "type": b.replace("_", " ").title(),
            "example": f"Detected pattern related to {b.replace('_', ' ')}",
            "score": confidence
        })
        
    political_bias = "neutral"
    if "ideology_bias" in bias_types:
        political_bias = "center"
        
    html_text = req.text
    for item in highlighted_text:
        word = item["word"]
        if len(word) > 3:
            html_text = html_text.replace(word, f"<mark class='bias-highlight'>{word}</mark>")
            
    analysis_result = {
        "political_bias": political_bias,
        "confidence": confidence,
        "text": req.text,
        "highlighted": html_text,
        "biases": biases
    }
    
    db_article = models.Article(
        text=req.text,
        analysis_json=json.dumps(analysis_result),
        user_id=current_user.id if current_user else None
    )
    db.add(db_article)
    
    # Update gamification points and history
    if current_user and current_user.gamification:
        current_user.gamification.points += 10
        current_user.gamification.reading_streak += 1
        
    db.commit()
    db.refresh(db_article)
    
    return analysis_result

@app.get("/article-detail")
def get_article_detail(url: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_optional_user)):
    try:
        response = requests.get(url, timeout=5)
        text = re.sub(r'<style.*?</style>', '', response.text, flags=re.DOTALL)
        text = re.sub(r'<script.*?</script>', '', text, flags=re.DOTALL)
        text = re.sub(r'<[^>]+>', ' ', text)
        words = text.split()
        start = len(words) // 4
        text = " ".join(words[start:start+200])
        if not text.strip():
            text = "No content could be extracted."
    except Exception:
        text = f"Content for {url}"
    
    return analyze_article(schemas.AnalyzeRequest(text=text), db, current_user)

@app.get("/articles")
def get_articles(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    articles = db.query(models.Article).filter(models.Article.user_id == current_user.id).all()
    result = []
    for art in articles:
        result.append({
            "id": art.id,
            "text": art.text,
            "analysis": json.loads(art.analysis_json) if art.analysis_json else {}
        })
    return result

@app.post("/feedback")
def submit_feedback(req: schemas.FeedbackRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_optional_user)):
    user_id = current_user.id if current_user else None
    
    # Check if feedback already exists to update it
    db_feedback = db.query(models.Feedback).filter(
        models.Feedback.article_id == req.article_id,
        models.Feedback.user_id == user_id
    ).first()
    
    if db_feedback:
        db_feedback.feedback = req.feedback
    else:
        db_feedback = models.Feedback(
            article_id=req.article_id, 
            feedback=req.feedback,
            user_id=user_id
        )
        db.add(db_feedback)
        
        # Reward points for giving feedback
        if current_user and current_user.gamification:
            current_user.gamification.points += 5
            
    db.commit()
    return {"message": "Feedback received successfully.", "status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
