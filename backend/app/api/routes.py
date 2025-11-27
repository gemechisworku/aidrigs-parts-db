"""
API router configuration
"""
from fastapi import APIRouter
from app.api.endpoints import auth, manufacturers, categories, translations, parts, positions, audit_logs, ports, price_tiers, partners, price_tier_maps, countries

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(manufacturers.router, prefix="/manufacturers", tags=["manufacturers"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(translations.router, prefix="/translations", tags=["translations"])
api_router.include_router(parts.router, prefix="/parts", tags=["parts"])
api_router.include_router(positions.router, prefix="/positions", tags=["positions"])
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["audit-logs"])

# Reference data
api_router.include_router(ports.router, prefix="/ports", tags=["ports"])
api_router.include_router(price_tiers.router, prefix="/price-tiers", tags=["price-tiers"])
api_router.include_router(countries.router, prefix="/countries", tags=["countries"])

# Partners
api_router.include_router(partners.router, prefix="/partners", tags=["partners"])
api_router.include_router(price_tier_maps.router, prefix="/price-tier-maps", tags=["price-tier-maps"])
