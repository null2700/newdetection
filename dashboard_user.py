from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
import gcp_storage
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
import os
from typing import List

from database import get_db
import models
import schemas

router = APIRouter()

SECRET_KEY = os.environ.get("JWT_SECRET", "supersecretkey")
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=1440)
    to_encode.update({"exp": int(expire.timestamp())})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user_data(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user_token(token: str = Depends(oauth2_scheme)):
    return get_current_user_data(token)

@router.post("/auth/adaptive/signup")
def signup(user_data: schemas.AdaptiveUserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.AdaptiveUser).filter(
        (models.AdaptiveUser.username == user_data.username) | (models.AdaptiveUser.email == user_data.email)
    ).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    learning_mode = "visual"
    if user_data.age_group in ["graduate", "graduate_advanced"]:
        learning_mode = "analytical"
    elif user_data.age_group == "civil_services_expert":
        learning_mode = "exam_prep"

    hashed_password = get_password_hash(user_data.password)
    
    new_user = models.AdaptiveUser(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        age_group=user_data.age_group,
        education_level=user_data.education_level,
        interest_domain=user_data.interest_domain,
        learning_mode=learning_mode
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    redirect_path = f"/{user_data.education_level}/dashboard"
    if user_data.education_level == "civil_services":
        redirect_path = "/upsc/dashboard"

    token_data = {
        "sub": new_user.username,
        "user_id": new_user.id,
        "education_level": new_user.education_level,
        "age_group": new_user.age_group
    }
    token = create_access_token(token_data)

    return {"access_token": token, "redirect_path": redirect_path}

@router.post("/auth/adaptive/login")
def login(login_data: schemas.AdaptiveUserLogin, db: Session = Depends(get_db)):
    user = db.query(models.AdaptiveUser).filter(models.AdaptiveUser.username == login_data.username).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    redirect_path = f"/{user.education_level}/dashboard"
    if user.education_level == "civil_services":
        redirect_path = "/upsc/dashboard"

    token_data = {
        "sub": user.username,
        "user_id": user.id,
        "education_level": user.education_level,
        "age_group": user.age_group
    }
    token = create_access_token(token_data)

    return {"access_token": token, "redirect_path": redirect_path}

@router.get("/dashboard-data")
def get_dashboard_data(token_data: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    user_id = token_data.get("user_id")
    education_level = token_data.get("education_level")
    age_group = token_data.get("age_group")

    news_items = db.query(models.AdaptiveNewsItem).filter(models.AdaptiveNewsItem.user_id == user_id).order_by(models.AdaptiveNewsItem.created_at.desc()).all()

    if education_level == "school":
        news_list = []
        for n in news_items:
            emoji = "⬜"
            if n.bias_label == "left": emoji = "🔵"
            elif n.bias_label == "right": emoji = "🔴"
            elif n.bias_label == "center": emoji = "⚖️"
            
            news_list.append({
                "title": n.title,
                "emoji_bias": emoji,
                "simple_summary": n.summary_text,
                "what_is_this": "A simple explanation of the news.",
                "bias_label": n.bias_label
            })
        return {"mode": "school", "age": age_group, "news": news_list}

    elif education_level == "graduate":
        news_list = []
        for n in news_items:
            news_list.append({
                "title": n.title,
                "bias_score": n.bias_score,
                "bias_label": n.bias_label,
                "context": n.summary_text,
                "pros": ["Point 1", "Point 2"],
                "cons": ["Point 1", "Point 2"],
                "topic_tags": ["politics", "economy"]
            })
        return {"mode": "graduate", "news": news_list}

    elif education_level == "civil_services":
        news_list = []
        for n in news_items:
            news_list.append({
                "title": n.title,
                "bias_score": n.bias_score,
                "bias_label": n.bias_label,
                "gs_paper_mapping": "GS2: Polity",
                "policy_implications": ["Impl 1", "Impl 2"],
                "essay_points": ["Point 1", "Point 2"],
                "mains_answer_draft": n.summary_text
            })
        return {"mode": "upsc", "news": news_list}

    raise HTTPException(status_code=400, detail="Unknown education level")

@router.post("/news/analyze")
def analyze_news(req: schemas.AdaptiveNewsAnalyzeRequest, token_data: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    user_id = token_data.get("user_id")
    age_group = token_data.get("age_group")
    education_level = token_data.get("education_level")

    # Simple bias detection heuristic for demonstration
    bias_label = "center"
    bias_score = 0.5
    content_lower = req.content.lower()
    if "left" in content_lower or "progressive" in content_lower:
        bias_label = "left"
        bias_score = 0.2
    elif "right" in content_lower or "conservative" in content_lower:
        bias_label = "right"
        bias_score = 0.8

    # Explanation generation
    explanation_dict = {}
    if age_group == "school_beginner":
        emoji = "⬜"
        if bias_label == "left": emoji = "🔵"
        elif bias_label == "right": emoji = "🔴"
        elif bias_label == "center": emoji = "⚖️"
        
        explanation_dict = {
            "summary_text": f"{emoji} This news talks about {req.title}. It is very important to read carefully.",
            "what_is_this": "This means someone is sharing their opinion.",
            "vocabulary_help": [{"word": "important", "definition": "something that matters a lot"}]
        }
    elif age_group == "school_advanced":
        explanation_dict = {
            "summary_text": f"This article is about {req.title}. It presents specific ideas that you should consider. Read multiple sources to get the full picture.",
            "why_bias_happens": "People have different backgrounds and beliefs, which shapes how they tell a story."
        }
    elif age_group in ["graduate", "graduate_advanced"]:
        explanation_dict = {
            "summary_text": f"The article '{req.title}' covers recent developments. Bias score indicates a {bias_label} leaning. It focuses heavily on specific political or economic factors.",
            "pros_of_this_news": ["Highlights important issues", "Provides clear arguments"],
            "cons_of_this_news": ["May omit alternative facts", "Uses strong emotional language"],
            "historical_context": "Similar narratives have historically emerged during periods of political tension.",
            "topic_tags": ["politics", "society", "economy"]
        }
        if age_group == "graduate_advanced":
            explanation_dict["policy_background"] = "This relates to policies enacted in the last decade regarding public welfare."
    elif age_group == "civil_services_expert":
        explanation_dict = {
            "gs_paper_mapping": "GS2: Polity, Governance, IR",
            "policy_implications": ["Impact on federal structure", "Reforms in public administration", "Economic repercussions"],
            "essay_points": ["Democracy and Media", "Role of bias in public perception", "Regulatory frameworks"],
            "mains_answer_draft": "Introduction: The context of the given news highlights recent shifts in governance.\nBody: The arguments suggest an ongoing debate over regulatory measures vs freedom of speech. Key schemes like X and Y are impacted.\nConclusion: The way forward requires a balanced approach ensuring constitutional values under Article 19.",
            "government_schemes_linked": ["Digital India", "RTI Act Frameworks"],
            "constitutional_articles": ["Article 19(1)(a)", "Article 21"]
        }

    summary_val = explanation_dict.get("summary_text", explanation_dict.get("mains_answer_draft", "Analysis complete."))

    news_item = models.AdaptiveNewsItem(
        user_id=user_id,
        title=req.title,
        content=req.content,
        source_url=req.source_url,
        bias_label=bias_label,
        bias_score=bias_score,
        explanation_level=education_level,
        summary_text=summary_val
    )
    db.add(news_item)
    db.commit()
    db.refresh(news_item)

    return {"analysis": explanation_dict, "bias_label": bias_label, "bias_score": bias_score}

@router.get("/upsc/current-affairs")
def get_upsc_current_affairs(token_data: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    if token_data.get("education_level") != "civil_services":
        raise HTTPException(status_code=403, detail="Not authorized for UPSC routes")
    user_id = token_data.get("user_id")
    items = db.query(models.AdaptiveNewsItem).filter(models.AdaptiveNewsItem.user_id == user_id).order_by(models.AdaptiveNewsItem.created_at.desc()).limit(20).all()
    return [{"title": i.title, "gs_paper_mapping": "GS2: Polity", "created_at": i.created_at} for i in items]

@router.get("/upsc/mains-generator")
def get_mains_generator(topic: str, token_data: dict = Depends(get_current_user_token)):
    if token_data.get("education_level") != "civil_services":
        raise HTTPException(status_code=403, detail="Not authorized for UPSC routes")
    return {
        "introduction": f"Introduction to {topic} highlighting recent context and relevance to GS papers.",
        "body": "Key arguments, data points, and scheme references. The core issues revolve around governance, economic impact, and societal shifts.",
        "conclusion": "Way forward includes adopting best practices and strengthening constitutional backing.",
        "word_count": 180,
        "gs_paper": "GS2 / GS3"
    }

@router.post("/news/upload-pdf")
async def upload_pdf(file: UploadFile = File(...), token_data: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    file_bytes = await file.read()
    gcs_url = gcp_storage.upload_pdf_to_gcs(file_bytes, file.filename)
    
    # Store GCS URL in NewsItem.source_url (using AdaptiveNewsItem)
    user_id = token_data.get("user_id")
    news_item = models.AdaptiveNewsItem(
        user_id=user_id,
        title=file.filename,
        content="PDF Uploaded",
        source_url=gcs_url,
        bias_label="center",
        bias_score=0.5,
        explanation_level=token_data.get("education_level", "graduate"),
        summary_text="PDF processing pending."
    )
    db.add(news_item)
    db.commit()
    db.refresh(news_item)
    
    return {"gcs_url": gcs_url, "analysis": {"summary_text": "PDF uploaded and stored successfully."}}
