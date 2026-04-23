from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get DB URL from .env
DATABASE_URL = os.getenv("DATABASE_URL")

# Fix for postgres:// (common issue with some providers)
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Handle unescaped @ in password to prevent "could not translate host name" error
if DATABASE_URL and DATABASE_URL.count('@') > 1:
    parts = DATABASE_URL.rsplit('@', 1)
    DATABASE_URL = parts[0].replace('@', '%40') + '@' + parts[1]

# SQLite fallback (only for testing)
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./sql_app.db"

# Special config for SQLite
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Create engine
engine = create_engine(
    DATABASE_URL,
    echo=True,   # logs SQL queries (useful for debugging)
    future=True
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class
Base = declarative_base()

# Dependency for FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()