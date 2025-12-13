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
    include_pending: bool = False,
) -> Any:
    """
    Retrieve manufacturers.
    """
    query = db.query(Manufacturer).filter(Manufacturer.deleted_at.is_(None))
    
    if not include_pending:
        from app.models.approval import ApprovalStatus
        query = query.filter(Manufacturer.approval_status == ApprovalStatus.APPROVED)
        
    manufacturers = query.offset(skip).limit(limit).all()
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
    # Check if manufacturer with same name already exists
    existing = db.query(Manufacturer).filter(Manufacturer.mfg_name == manufacturer_in.mfg_name).first()
    if existing:
        if existing.deleted_at is not None:
            # Restore deleted manufacturer
            from app.models.approval import ApprovalStatus
            from datetime import datetime
            
            # Update fields
            update_data = manufacturer_in.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(existing, field, value)
            
            existing.deleted_at = None
            existing.approval_status = ApprovalStatus.PENDING_APPROVAL
            existing.submitted_at = datetime.utcnow()
            
            db.add(existing)
            db.commit()
            db.refresh(existing)
            return existing
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Manufacturer with name '{manufacturer_in.mfg_name}' already exists",
            )
    
    # Create manufacturer with PENDING_APPROVAL status
    from app.models.approval import ApprovalStatus
    from datetime import datetime
    
    manufacturer_data = manufacturer_in.model_dump()
    manufacturer = Manufacturer(**manufacturer_data)
    manufacturer.approval_status = ApprovalStatus.PENDING_APPROVAL
    manufacturer.submitted_at = datetime.utcnow()
    
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
        
    # Hard delete
    try:
        db.delete(manufacturer)
        db.commit()
    except Exception as e:
        db.rollback()
        # Check for foreign key violation
        if "foreign key constraint" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete manufacturer because it is used by other records (e.g. parts)."
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not delete manufacturer: {str(e)}"
        )
    return manufacturer


@router.post("/{manufacturer_id}/approve", response_model=ManufacturerResponse)
def approve_manufacturer(
    *,
    db: Session = Depends(deps.get_db),
    manufacturer_id: str,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Approve a manufacturer.
    """
    manufacturer = db.query(Manufacturer).filter(Manufacturer.id == manufacturer_id).first()
    if not manufacturer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manufacturer not found",
        )
        
    from app.models.approval import ApprovalStatus
    from datetime import datetime
    
    manufacturer.approval_status = ApprovalStatus.APPROVED
    manufacturer.reviewed_at = datetime.utcnow()
    manufacturer.reviewed_by = current_user.id
    manufacturer.rejection_reason = None
    
    db.add(manufacturer)
    db.commit()
    db.refresh(manufacturer)
    return manufacturer


@router.post("/{manufacturer_id}/reject", response_model=ManufacturerResponse)
def reject_manufacturer(
    *,
    db: Session = Depends(deps.get_db),
    manufacturer_id: str,
    reason: str,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Reject a manufacturer.
    """
    manufacturer = db.query(Manufacturer).filter(Manufacturer.id == manufacturer_id).first()
    if not manufacturer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manufacturer not found",
        )
        
    from app.models.approval import ApprovalStatus
    from datetime import datetime
    
    manufacturer.approval_status = ApprovalStatus.REJECTED
    manufacturer.reviewed_at = datetime.utcnow()
    manufacturer.reviewed_by = current_user.id
    manufacturer.rejection_reason = reason
    
    db.add(manufacturer)
    db.commit()
    db.refresh(manufacturer)
    return manufacturer
