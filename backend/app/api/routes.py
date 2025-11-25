"""
API router configuration
"""
from fastapi import APIRouter
from app.api.endpoints import auth, manufacturers, categories, translations, parts, positions, audit_logs

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(manufacturers.router, prefix="/manufacturers", tags=["manufacturers"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(translations.router, prefix="/translations", tags=["translations"])
api_router.include_router(parts.router, prefix="/parts", tags=["parts"])
api_router.include_router(positions.router, prefix="/positions", tags=["positions"])
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["audit-logs"])
