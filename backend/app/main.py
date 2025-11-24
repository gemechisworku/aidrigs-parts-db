"""
AidRigs Parts Database - FastAPI Main Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api import routes


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    print("🚀 Starting AidRigs Backend API...")
    # Create tables (in production, use Alembic migrations)
    # Base.metadata.create_all(bind=engine)
    yield
    # Shutdown
    print("⏹️  Shutting down AidRigs Backend API...")


app = FastAPI(
    title="AidRigs Parts Database API",
    description="International Auto-Parts Database and Sales System",
    version="0.1.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AidRigs Backend API",
        "version": "0.1.0"
    }


# Include API routes
app.include_router(routes.router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True
    )
