from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL is None:
    raise ValueError("DATABASE_URL is not set!")

# Add connection timeout and pool settings
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Test connections before using them
    connect_args={
        "connect_timeout": 5,  # 5 second connection timeout
    },
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
