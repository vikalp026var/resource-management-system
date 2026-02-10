from fastapi import FastAPI
from contextlib import asynccontextmanager
from api.auth import router as auth_router
from db.session import engine, Base
from fastapi.middleware.cors import CORSMiddleware


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


app = FastAPI(
    title="RMS API",
    description="Request Management System API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS must be added first, before any routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["auth"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
