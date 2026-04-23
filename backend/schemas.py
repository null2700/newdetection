from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    
    class Config:
        from_attributes = True

class AnalyzeRequest(BaseModel):
    text: str
    
class FeedbackRequest(BaseModel):
    article_id: int
    feedback: str

class Token(BaseModel):
    access_token: str
    token_type: str
