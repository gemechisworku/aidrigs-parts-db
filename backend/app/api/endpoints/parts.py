from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api import deps
from app.models.part import Part
from app.schemas.part import PartCreate, PartUpdate, PartResponse, PartList

router = APIRouter()

@router.get("/", response_model=List[PartResponse])
def read_parts(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    manufacturer_id: Optional[str] = None,
) -> Any:
    """
    Retrieve parts with filtering.
    """
    query = db.query(Part)
    
    if search:
        query = query.filter(
            (Part.name.ilike(f"%{search}%")) | 
            (Part.part_number.ilike(f"%{search}%"))
        )
    
    if category_id:
        query = query.filter(Part.category_id == category_id)
        
    if manufacturer_id:
        query = query.filter(Part.manufacturer_id == manufacturer_id)
        
    parts = query.offset(skip).limit(limit).all()
    return parts

@router.post("/", response_model=PartResponse)
def create_part(
    *,
    db: Session = Depends(deps.get_db),
    part_in: PartCreate,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new part.
    """
    # Check if part number exists
    if db.query(Part).filter(Part.part_number == part_in.part_number).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Part number already exists",
        )
        
    part = Part(
        part_number=part_in.part_number,
        name=part_in.name,
        description=part_in.description,
        category_id=part_in.category_id,
        manufacturer_id=part_in.manufacturer_id,
        weight_kg=part_in.weight_kg,
        dimensions_cm=part_in.dimensions_cm,
        is_active=part_in.is_active,
        specifications=part_in.specifications,
    )
    db.add(part)
    db.commit()
    db.refresh(part)
    return part

@router.get("/{part_id}", response_model=PartResponse)
def read_part(
    *,
    db: Session = Depends(deps.get_db),
    part_id: str,
) -> Any:
    """
    Get part by ID.
    """
    part = db.query(Part).filter(Part.id == part_id).first()
    if not part:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Part not found",
        )
    return part

@router.put("/{part_id}", response_model=PartResponse)
def update_part(
    *,
    db: Session = Depends(deps.get_db),
    part_id: str,
    part_in: PartUpdate,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a part.
    """
    part = db.query(Part).filter(Part.id == part_id).first()
    if not part:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Part not found",
        )
    
    update_data = part_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(part, field, value)
        
    db.add(part)
    db.commit()
    db.refresh(part)
    return part

@router.delete("/{part_id}", response_model=PartResponse)
def delete_part(
    *,
    db: Session = Depends(deps.get_db),
    part_id: str,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Soft delete a part.
    """
    part = db.query(Part).filter(Part.id == part_id).first()
    if not part:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Part not found",
        )
        
    # Soft delete logic (assuming BaseModel handles it or we set is_active=False)
    # Since we have SoftDeleteMixin, we should use delete() method if available or set deleted_at
    # For now, let's just set is_active = False as a simple "disable"
    part.is_active = False
    db.add(part)
    db.commit()
    db.refresh(part)
    return part
