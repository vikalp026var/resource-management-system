from fastapi import FastAPI
from contextlib import asynccontextmanager
from api.auth import router as auth_router
from db.session import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        print("Attempting to create database tables...")
        Base.metadata.create_all(bind=engine)
        print("✓ Database tables created successfully")
    except Exception as e:
        print(f"✗ Warning: Could not create database tables: {str(e)[:100]}")
        print(
            "  The app will start but database operations will fail until DB is accessible"
        )

    yield

    # Shutdown (if needed in future)
    print("Application shutting down...")


app = FastAPI(lifespan=lifespan)

app.include_router(auth_router, prefix="/auth", tags=["auth"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
