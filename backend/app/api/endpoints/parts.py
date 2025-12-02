from typing import List, Any, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from app.api import deps
from app.models.part import Part, parts_equivalence
from app.models.manufacturer import Manufacturer
from app.models.translation import PartTranslationStandardization, PositionTranslation
from app.schemas.part import (
    PartCreate, PartUpdate, PartResponse, PartListResponse, PartFilter,
    PartEquivalenceCreate, PartEquivalenceResponse, PartEquivalenceBulkCreate
)
from app.core.audit import log_audit
from math import ceil
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

def make_json_serializable(obj):
    """Convert objects to JSON-serializable format"""
    from uuid import UUID
    from datetime import datetime, date
    from decimal import Decimal
    
    if isinstance(obj, (UUID,)):
        return str(obj)
    elif isinstance(obj, (datetime, date)):
        return obj.isoformat()
    elif isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: make_json_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [make_json_serializable(item) for item in obj]
    return obj


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

    # Filter by approval status (default to APPROVED only unless specified)
    # TODO: Add ability for admins to see other statuses via query param if needed
    from app.models.approval import ApprovalStatus
    query = query.filter(Part.approval_status == ApprovalStatus.APPROVED)
    
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
    
    # Validate/Auto-create part_name_en if provided
    if part_in.part_name_en:
        from app.models.approval import ApprovalStatus
        from datetime import datetime
        
        # First check for approved translations
        translation = db.query(PartTranslationStandardization).filter(
            PartTranslationStandardization.part_name_en == part_in.part_name_en,
            PartTranslationStandardization.approval_status == ApprovalStatus.APPROVED
        ).first()
        
        if not translation:
            # Check if there's already a pending translation
            pending_translation = db.query(PartTranslationStandardization).filter(
                PartTranslationStandardization.part_name_en == part_in.part_name_en
            ).first()
            
            if not pending_translation:
                # Auto-create new translation with pending approval
                logger.info(f"Auto-creating translation '{part_in.part_name_en}' with pending approval status")
                
                # Safely get user ID
                user_id = getattr(current_user, 'id', None)
                
                new_translation = PartTranslationStandardization(
                    part_name_en=part_in.part_name_en,
                    approval_status=ApprovalStatus.PENDING_APPROVAL,
                    submitted_at=datetime.utcnow(),
                    created_by=user_id
                )
                db.add(new_translation)
                db.flush()  # Get ID without full commit
    
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
        changes={"new": make_json_serializable(part_in.model_dump())},
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
        changes={
            "old": make_json_serializable(old_values),
            "new": make_json_serializable(update_data)
        },
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


# Part Equivalence Endpoints

@router.get("/{part_id}/equivalences", response_model=List[PartEquivalenceResponse])
def get_part_equivalences(
    *,
    db: Session = Depends(deps.get_db),
    part_id: str,
) -> Any:
    """
    Get all equivalences for a specific part.
    Uses fast equivalence groups lookup with transitive support.
    """
    part = db.query(Part).filter(Part.id == part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    
    # Use service to get equivalents via group lookup
    from app.services.equivalence_service import EquivalenceService
    equivalents = EquivalenceService.get_equivalences(db, part.id)
    
    # Format response
    result = []
    for eq_part in equivalents:
        result.append({
            "part_id": part_id,
            "equivalent_part_id": eq_part.id,
            "equivalent_part": eq_part
        })
    
    return result


@router.post("/{part_id}/equivalences", response_model=PartEquivalenceResponse, status_code=status.HTTP_201_CREATED)
def create_part_equivalence(
    *,
    db: Session = Depends(deps.get_db),
    part_id: str,
    equivalence_in: PartEquivalenceCreate,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a new equivalence relationship between two parts.
    Handles transitive equivalence via groups.
    """
    # Verify both parts exist
    part = db.query(Part).filter(Part.id == part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    
    equivalent_part = db.query(Part).filter(Part.id == equivalence_in.equivalent_part_id).first()
    if not equivalent_part:
        raise HTTPException(status_code=404, detail="Equivalent part not found")
    
    # Use service to create equivalence
    from app.services.equivalence_service import EquivalenceService
    try:
        EquivalenceService.create_equivalence(db, part.id, equivalent_part.id, current_user.id)
        db.commit()  # Commit the transaction
    except Exception as e:
        db.rollback()  # Rollback on error
        logger.error(f"Failed to create equivalence: {e}")
        raise HTTPException(status_code=500, detail="Failed to create equivalence relationship")
    
    logger.info(f"Part equivalence created: {part_id} <-> {equivalence_in.equivalent_part_id}")
    
    return {
        "part_id": part_id,
        "equivalent_part_id": equivalence_in.equivalent_part_id,
        "equivalent_part": equivalent_part
    }


@router.delete("/{part_id}/equivalences/{equivalent_part_id}")
def delete_part_equivalence(
    *,
    db: Session = Depends(deps.get_db),
    part_id: str,
    equivalent_part_id: str,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete an equivalence relationship between two parts.
    May cause equivalence groups to split if connectivity is broken.
    """
    # Use service to delete equivalence
    from app.services.equivalence_service import EquivalenceService
    try:
        EquivalenceService.delete_equivalence(db, UUID(part_id), UUID(equivalent_part_id), current_user.id)
    except Exception as e:
        logger.error(f"Failed to delete equivalence: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete equivalence relationship")
    
    logger.info(f"Part equivalence deleted: {part_id} <-> {equivalent_part_id}")
    
    return {"message": "Equivalence deleted successfully"}


@router.post("/{part_id}/equivalences/bulk", status_code=status.HTTP_201_CREATED)
def bulk_create_equivalences(
    *,
    db: Session = Depends(deps.get_db),
    part_id: str,
    bulk_data: dict,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Bulk create equivalences for a part using part_id strings.
    Auto-creates parts that don't exist with pending_approval status.
    Expects: { "part_ids": ["PART001", "PART002", ...] }
    """
    target_part_ids = bulk_data.get("part_ids", [])
    if not target_part_ids:
        raise HTTPException(status_code=400, detail="No part IDs provided")

    # Verify source part exists
    part = db.query(Part).filter(Part.id == part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")

    created_count = 0
    skipped_count = 0
    errors = []
    auto_created_parts = []
    
    from app.services.equivalence_service import EquivalenceService
    from app.models.approval import ApprovalStatus
    from datetime import datetime

    for target_part_id_raw in target_part_ids:
        try:
            # Strip whitespace from part ID
            target_part_id = target_part_id_raw.strip() if isinstance(target_part_id_raw, str) else target_part_id_raw
            
            if not target_part_id:
                continue
            
            # Check if target part exists (by string ID)
            equivalent_part = db.query(Part).filter(Part.part_id == target_part_id).first()
            
            # Auto-create part if it doesn't exist
            if not equivalent_part:
                logger.info(f"Auto-creating part {target_part_id} with pending_approval status")
                equivalent_part = Part(
                    part_id=target_part_id,
                    approval_status=ApprovalStatus.PENDING_APPROVAL,
                    submitted_at=datetime.utcnow()
                )
                db.add(equivalent_part)
                db.flush()  # Get the ID for creating equivalence
                auto_created_parts.append(target_part_id)
            
            # Create equivalence using service (without auto-commit)
            # We'll handle the commit at the end of the loop
            from app.services.equivalence_service import EquivalenceService
            
            # Check if equivalence already exists to avoid duplicates
            part_a = db.query(Part).filter(Part.id == part.id).first()
            part_b = db.query(Part).filter(Part.id == equivalent_part.id).first()
            
            group_a = part_a.equivalence_group_id if part_a else None
            group_b = part_b.equivalence_group_id if part_b else None
            
            # If already in same group, skip
            if group_a and group_b and group_a == group_b:
                skipped_count += 1
                continue
            
            # Create the relationship without auto-commit
            EquivalenceService.create_equivalence(db, part.id, equivalent_part.id, current_user.id)
            created_count += 1
            
        except Exception as e:
            logger.error(f"Error processing part {target_part_id if 'target_part_id' in locals() else target_part_id_raw}: {str(e)}")
            errors.append(f"{target_part_id if 'target_part_id' in locals() else target_part_id_raw}: {str(e)}")
            # Continue with next part instead of failing the whole batch

    # Commit all changes (including auto-created parts and equivalences)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to commit bulk equivalences: {e}")
        return {
            "created": 0,
            "skipped": skipped_count,
            "errors": errors + [f"Transaction commit failed: {str(e)}"],
            "auto_created_parts": []
        }

    return {
        "created": created_count,
        "skipped": skipped_count,
        "errors": errors,
        "auto_created_parts": auto_created_parts
    }
