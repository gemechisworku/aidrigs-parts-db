from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.manufacturer import Manufacturer
from app.schemas.manufacturer import ManufacturerCreate, ManufacturerUpdate, ManufacturerResponse

router = APIRouter()

@router.get("/", response_model=List[ManufacturerResponse])
def read_manufacturers(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve manufacturers.
    """
    manufacturers = db.query(Manufacturer).offset(skip).limit(limit).all()
    return manufacturers

@router.post("/", response_model=ManufacturerResponse)
def create_manufacturer(
    *,
    db: Session = Depends(deps.get_db),
    manufacturer_in: ManufacturerCreate,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new manufacturer.
    """
    manufacturer = Manufacturer(
        name=manufacturer_in.name,
        code=manufacturer_in.code,
        country=manufacturer_in.country,
        website=str(manufacturer_in.website) if manufacturer_in.website else None,
        is_active=manufacturer_in.is_active,
        contact_info=manufacturer_in.contact_info,
    )
    db.add(manufacturer)
    db.commit()
    db.refresh(manufacturer)
    return manufacturer

@router.put("/{manufacturer_id}", response_model=ManufacturerResponse)
def update_manufacturer(
    *,
    db: Session = Depends(deps.get_db),
    manufacturer_id: str,
    manufacturer_in: ManufacturerUpdate,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a manufacturer.
    """
    manufacturer = db.query(Manufacturer).filter(Manufacturer.id == manufacturer_id).first()
    if not manufacturer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manufacturer not found",
        )
    
    update_data = manufacturer_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == 'website' and value:
            value = str(value)
        setattr(manufacturer, field, value)
        
    db.add(manufacturer)
    db.commit()
    db.refresh(manufacturer)
    return manufacturer
