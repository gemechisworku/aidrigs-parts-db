"""
API router configuration
"""
from fastapi import APIRouter
from app.api.endpoints import auth, parts, categories, manufacturers, translations

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(parts.router, prefix="/parts", tags=["Parts"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(manufacturers.router, prefix="/manufacturers", tags=["Manufacturers"])
api_router.include_router(translations.router, prefix="/translations", tags=["Translations"])
