from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float, DateTime
from datetime import datetime
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    # Relationships
    gamification = relationship("Gamification", back_populates="user", uselist=False)
    feedbacks = relationship("Feedback", back_populates="user")
    articles = relationship("Article", back_populates="user")
    news = relationship("News", back_populates="user")

class Gamification(Base):
    __tablename__ = "gamification"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    reading_streak = Column(Integer, default=0)
    points = Column(Integer, default=0)
    
    # Relationships
    user = relationship("User", back_populates="gamification")

class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    text = Column(Text)
    analysis_json = Column(Text) # Store the JSON analysis
    
    # Relationships
    user = relationship("User", back_populates="articles")
    feedbacks = relationship("Feedback", back_populates="article")

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("articles.id", ondelete="CASCADE"), index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True) # nullable in case of anonymous
    feedback = Column(Text)
    
    # Relationships
    user = relationship("User", back_populates="feedbacks")
    article = relationship("Article", back_populates="feedbacks")

class News(Base):
    __tablename__ = "news"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title = Column(String, nullable=True)
    content = Column(Text, nullable=False)
    source_url = Column(String, nullable=True)
    bias_label = Column(String) # LEFT / RIGHT / CENTER / NEUTRAL
    bias_score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="news")
