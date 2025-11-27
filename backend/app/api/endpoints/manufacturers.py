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
    manufacturers = db.query(Manufacturer).filter(Manufacturer.deleted_at.is_(None)).offset(skip).limit(limit).all()
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
    # Check if mfg_id already exists
    existing = db.query(Manufacturer).filter(Manufacturer.mfg_id == manufacturer_in.mfg_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Manufacturer with mfg_id '{manufacturer_in.mfg_id}' already exists",
        )
    
    manufacturer = Manufacturer(**manufacturer_in.model_dump())
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
    if not manufacturer or manufacturer.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manufacturer not found",
        )
    
    update_data = manufacturer_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(manufacturer, field, value)
        
    db.add(manufacturer)
    db.commit()
    db.refresh(manufacturer)
    return manufacturer

@router.get("/{manufacturer_id}", response_model=ManufacturerResponse)
def read_manufacturer(
    *,
    db: Session = Depends(deps.get_db),
    manufacturer_id: str,
) -> Any:
    """
    Get manufacturer by ID.
    """
    manufacturer = db.query(Manufacturer).filter(Manufacturer.id == manufacturer_id).first()
    if not manufacturer or manufacturer.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manufacturer not found",
        )
    return manufacturer

@router.delete("/{manufacturer_id}", response_model=ManufacturerResponse)
def delete_manufacturer(
    *,
    db: Session = Depends(deps.get_db),
    manufacturer_id: str,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a manufacturer.
    """
    manufacturer = db.query(Manufacturer).filter(Manufacturer.id == manufacturer_id).first()
    if not manufacturer or manufacturer.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manufacturer not found",
        )
        
    # Soft delete
    from datetime import datetime
    manufacturer.deleted_at = datetime.utcnow()
    db.add(manufacturer)
    db.commit()
    db.refresh(manufacturer)
    return manufacturer
