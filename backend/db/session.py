from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os
from urllib.parse import quote_plus

load_dotenv()

# Support both full DATABASE_URL and individual components (AWS best practice)
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL is None:
    # Construct DATABASE_URL from individual components (for AWS ECS deployment)
    DATABASE_HOST = os.getenv("DATABASE_HOST")
    DATABASE_PORT = os.getenv("DATABASE_PORT", "5432")
    DATABASE_NAME = os.getenv("DATABASE_NAME")
    DATABASE_USERNAME = os.getenv("DATABASE_USERNAME")
    DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD")

    if all([DATABASE_HOST, DATABASE_NAME, DATABASE_USERNAME, DATABASE_PASSWORD]):
        # URL-encode password to handle special characters
        encoded_password = quote_plus(DATABASE_PASSWORD)
        DATABASE_URL = f"postgresql://{DATABASE_USERNAME}:{encoded_password}@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_NAME}"
    else:
        raise ValueError(
            "Either DATABASE_URL must be set, or all of DATABASE_HOST, "
            "DATABASE_NAME, DATABASE_USERNAME, and DATABASE_PASSWORD must be set!"
        )

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
