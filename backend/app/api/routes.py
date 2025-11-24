"""
API Router configuration
Includes all API endpoints grouped by version and domain
"""
from fastapi import APIRouter
from app.api.endpoints import auth

# API v1 router
api_router = APIRouter()

# Include auth endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Root API endpoint
@api_router.get("/")
async def api_root():
    """API root endpoint"""
    return {
        "message": "AidRigs Parts Database API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "operational"
    }
