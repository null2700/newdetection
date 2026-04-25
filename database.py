import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Cloud SQL uses Unix socket on GCP Cloud Run:
# postgresql+asyncpg://user:pass@/dbname?host=/cloudsql/PROJECT:REGION:INSTANCE
# Note: For this project, we are keeping the synchronous `postgresql://` engine.
# So Cloud SQL URL should be:
# postgresql://user:pass@/dbname?host=/cloudsql/PROJECT:REGION:INSTANCE
# Local development uses standard URL:
# postgresql://user:pass@localhost:5432/dbname

if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./sql_app.db"

# Special config for SQLite
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args=connect_args,
    future=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()