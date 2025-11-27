from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from uuid import UUID

from app.api import deps
from app.models.reference_data import PriceTierMap
from app.schemas.price_tier_map import PriceTierMap as PriceTierMapSchema, PriceTierMapCreate, PriceTierMapUpdate

router = APIRouter()

@router.get("/part/{part_id}", response_model=List[PriceTierMapSchema])
def read_part_prices(
    part_id: str,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    Retrieve prices for a specific part.
    """
    prices = db.query(PriceTierMap).options(
        joinedload(PriceTierMap.tier)
    ).filter(PriceTierMap.part_id == part_id).offset(skip).limit(limit).all()
    return prices

@router.post("/", response_model=PriceTierMapSchema)
def create_part_price(
    *,
    db: Session = Depends(deps.get_db),
    price_in: PriceTierMapCreate,
):
    """
    Create new price for a part in a tier.
    """
    # Check if price already exists for this part and tier
    existing = db.query(PriceTierMap).filter(
        PriceTierMap.part_id == price_in.part_id,
        PriceTierMap.tier_id == price_in.tier_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Price for this part and tier already exists"
        )
        
    price = PriceTierMap(**price_in.model_dump())
    db.add(price)
    db.commit()
    db.refresh(price)
    
    # Load the tier relationship
    price = db.query(PriceTierMap).options(
        joinedload(PriceTierMap.tier)
    ).filter(PriceTierMap.id == price.id).first()
    
    return price

@router.put("/{id}", response_model=PriceTierMapSchema)
def update_part_price(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    price_in: PriceTierMapUpdate,
):
    """
    Update a price.
    """
    price = db.query(PriceTierMap).filter(PriceTierMap.id == id).first()
    if not price:
        raise HTTPException(status_code=404, detail="Price not found")
        
    if price_in.price is not None:
        price.price = price_in.price
        
    db.add(price)
    db.commit()
    db.refresh(price)
    
    # Load the tier relationship
    price = db.query(PriceTierMap).options(
        joinedload(PriceTierMap.tier)
    ).filter(PriceTierMap.id == price.id).first()
    
    return price

@router.delete("/{id}", response_model=PriceTierMapSchema)
def delete_part_price(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
):
    """
    Delete a price.
    """
    price = db.query(PriceTierMap).filter(PriceTierMap.id == id).first()
    if not price:
        raise HTTPException(status_code=404, detail="Price not found")
        
    db.delete(price)
    db.commit()
    return price
