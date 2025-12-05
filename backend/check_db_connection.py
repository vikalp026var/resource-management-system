import os

from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy import create_engine

load_dotenv()

database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise RuntimeError("DATABASE_URL is not set")

engine = create_engine(database_url, echo=False)


def main():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("DB connection OK, result:", list(result))
    except Exception as e:
        print("DB connection FAILED:")
        print(e)


if __name__ == "__main__":
    main()
