from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.reference_data import Country
from app.schemas.country import Country as CountrySchema

router = APIRouter()

@router.get("/", response_model=List[CountrySchema])
def read_countries(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 300,  # Higher limit for countries
) -> Any:
    """
    Retrieve countries.
    """
    countries = db.query(Country).order_by(Country.name).offset(skip).limit(limit).all()
    return countries

@router.get("/{code}", response_model=CountrySchema)
def read_country(
    *,
    db: Session = Depends(deps.get_db),
    code: str,
) -> Any:
    """
    Get country by code.
    """
    country = db.query(Country).filter(Country.code == code.upper()).first()
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    return country
