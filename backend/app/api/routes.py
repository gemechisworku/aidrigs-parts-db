"""
API router configuration
"""
from fastapi import APIRouter
from app.api.endpoints import auth, manufacturers, categories, translations, parts, positions, audit_logs, ports, price_tiers, partners, price_tier_maps, countries, hs_codes, vehicles, approvals

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(manufacturers.router, prefix="/manufacturers", tags=["manufacturers"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(translations.router, prefix="/translations", tags=["translations"])
api_router.include_router(parts.router, prefix="/parts", tags=["parts"])
api_router.include_router(positions.router, prefix="/positions", tags=["positions"])
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["audit-logs"])

# Approval system
api_router.include_router(approvals.router, prefix="/approvals", tags=["approvals"])

# Reference data
api_router.include_router(ports.router, prefix="/ports", tags=["ports"])
api_router.include_router(price_tiers.router, prefix="/price-tiers", tags=["price-tiers"])
api_router.include_router(countries.router, prefix="/countries", tags=["countries"])
api_router.include_router(hs_codes.router, prefix="/hs-codes", tags=["hs-codes"])
api_router.include_router(vehicles.router, prefix="/vehicles", tags=["vehicles"])

# Partners
api_router.include_router(partners.router, prefix="/partners", tags=["partners"])
api_router.include_router(price_tier_maps.router, prefix="/price-tier-maps", tags=["price-tier-maps"])
