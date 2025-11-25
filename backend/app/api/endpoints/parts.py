from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from app.api import deps
from app.models.part import Part
from app.models.manufacturer import Manufacturer
from app.models.translation import PartTranslationStandardization, PositionTranslation
from app.schemas.part import PartCreate, PartUpdate, PartResponse, PartListResponse, PartFilter
from app.core.audit import log_audit
from math import ceil
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=PartListResponse)
def read_parts(
    db: Session = Depends(deps.get_db),
    search: Optional[str] = Query(None),
    mfg_id: Optional[str] = Query(None),
    part_name_en: Optional[str] = Query(None),
    drive_side: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> Any:
    """
    Retrieve parts with filtering and pagination.
    """
    query = db.query(Part).options(
        joinedload(Part.manufacturer),
        joinedload(Part.part_translation),
        joinedload(Part.position)
    )
    
    # Search filter
    if search:
        query = query.filter(
            or_(
                Part.part_id.ilike(f"%{search}%"),
                Part.designation.ilike(f"%{search}%")
            )
        )
    
    # Manufacturer filter
    if mfg_id:
        query = query.filter(Part.mfg_id == mfg_id)
        
    # Part name filter
    if part_name_en:
        query = query.filter(Part.part_name_en == part_name_en)
    
    # Drive side filter
    if drive_side and drive_side in ['NA', 'LHD', 'RHD']:
        query = query.filter(Part.drive_side == drive_side)
    
    # Filter out soft-deleted items
    query = query.filter(Part.deleted_at.is_(None))
    
    # Count total
    total = query.count()
    
    # Pagination
    skip = (page - 1) * page_size
    parts = query.offset(skip).limit(page_size).all()
    
    return {
        "items": parts,
        "total": total,
        "page": page,
        "pages": ceil(total / page_size) if total > 0 else 1,
        "page_size": page_size
    }

@router.post("/", response_model=PartResponse, status_code=status.HTTP_201_CREATED)
def create_part(
    *,
    db: Session = Depends(deps.get_db),
    part_in: PartCreate,
    current_user = Depends(deps.get_current_active_user),
    request: Request
) -> Any:
    """
    Create new part with validation.
    """
    # Check if part_id already exists
    existing = db.query(Part).filter(Part.part_id == part_in.part_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Part with part_id '{part_in.part_id}' already exists",
        )
    
    # Validate manufacturer exists if provided
    if part_in.mfg_id:
        mfg = db.query(Manufacturer).filter(Manufacturer.id == part_in.mfg_id).first()
        if not mfg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Manufacturer with id '{part_in.mfg_id}' not found",
            )
    
    # Validate part_name_en exists if provided
    if part_in.part_name_en:
        translation = db.query(PartTranslationStandardization).filter(
            PartTranslationStandardization.part_name_en == part_in.part_name_en
        ).first()
        if not translation:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Part translation '{part_in.part_name_en}' not found",
            )
    
    # Validate position_id exists if provided
    if part_in.position_id:
        position = db.query(PositionTranslation).filter(
            PositionTranslation.id == part_in.position_id
        ).first()
        if not position:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Position with id '{part_in.position_id}' not found",
            )
    
    # Create part
    part = Part(**part_in.model_dump())
    db.add(part)
    db.commit()
    db.refresh(part)
    
    # Audit log
    log_audit(
        db=db,
        action="CREATE",
        entity_type="parts",
        entity_id=str(part.id),
        user_id=current_user.id,
        changes={"new": part_in.model_dump()},
        request=request
    )
    logger.info(f"Part {part.part_id} created by user {current_user.username}")
    
    # Load relationships
    db.refresh(part)
    part = db.query(Part).options(
        joinedload(Part.manufacturer),
        joinedload(Part.part_translation),
        joinedload(Part.position)
    ).filter(Part.id == part.id).first()
    
    return part

@router.get("/{part_id}", response_model=PartResponse)
def read_part(
    *,
    db: Session = Depends(deps.get_db),
    part_id: str,
) -> Any:
    """
    Get part by ID (UUID).
    """
    part = db.query(Part).options(
        joinedload(Part.manufacturer),
        joinedload(Part.part_translation),
        joinedload(Part.position)
    ).filter(Part.id == part_id).first()
    
    if not part or part.deleted_at is not None:
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
    request: Request
) -> Any:
    """
    Update a part.
    """
    part = db.query(Part).filter(Part.id == part_id).first()
    if not part or part.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Part not found",
        )
    
    # Validate foreign keys if being updated
    update_data = part_in.model_dump(exclude_unset=True)
    
    if 'mfg_id' in update_data and update_data['mfg_id']:
        mfg = db.query(Manufacturer).filter(Manufacturer.id == update_data['mfg_id']).first()
        if not mfg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Manufacturer with id '{update_data['mfg_id']}' not found",
            )
    
    if 'part_name_en' in update_data and update_data['part_name_en']:
        translation = db.query(PartTranslationStandardization).filter(
            PartTranslationStandardization.part_name_en == update_data['part_name_en']
        ).first()
        if not translation:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Part translation '{update_data['part_name_en']}' not found",
            )
    
    if 'position_id' in update_data and update_data['position_id']:
        position = db.query(PositionTranslation).filter(
            PositionTranslation.id == update_data['position_id']
        ).first()
        if not position:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Position with id '{update_data['position_id']}' not found",
            )
    
    # Capture old values for audit
    old_values = {field: getattr(part, field) for field in update_data.keys()}
    
    # Update fields
    for field, value in update_data.items():
        setattr(part, field, value)
    
    db.add(part)
    db.commit()
    db.refresh(part)
    
    # Audit log
    log_audit(
        db=db,
        action="UPDATE",
        entity_type="parts",
        entity_id=str(part.id),
        user_id=current_user.id,
        changes={"old": old_values, "new": update_data},
        request=request
    )
    logger.info(f"Part {part.part_id} updated by user {current_user.username}")
    
    # Load relationships
    part = db.query(Part).options(
        joinedload(Part.manufacturer),
        joinedload(Part.part_translation),
        joinedload(Part.position)
    ).filter(Part.id == part.id).first()
    
    return part

@router.delete("/{part_id}")
def delete_part(
    *,
    db: Session = Depends(deps.get_db),
    part_id: str,
    current_user = Depends(deps.get_current_active_user),
    request: Request
) -> Any:
    """
    Soft delete a part by setting deleted_at.
    """
    part = db.query(Part).filter(Part.id == part_id).first()
    if not part or part.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Part not found",
        )
    
    # Soft delete using BaseModel's SoftDeleteMixin
    from datetime import datetime
    part.deleted_at = datetime.utcnow()
    db.add(part)
    db.commit()
    
    # Audit log
    log_audit(
        db=db,
        action="DELETE",
        entity_type="parts",
        entity_id=str(part.id),
        user_id=current_user.id,
        changes={"old": {"part_id": part.part_id, "designation": part.designation}},
        request=request
    )
    logger.info(f"Part {part.part_id} deleted by user {current_user.username}")
    
    return {"message": "Part deleted successfully", "part_id": str(part.id)}
