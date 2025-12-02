from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session, joinedload
from app.api import deps
from app.models.classification import HSCode, HSCodeTariff
from app.schemas.hs_code import (
    HSCode as HSCodeSchema,
    HSCodeCreate,
    HSCodeUpdate,
    HSCodeWithTariffs,
    HSCodeTariff as HSCodeTariffSchema,
    HSCodeTariffCreate,
    HSCodeTariffUpdate,
    BulkUploadResult
)
import csv
import io
from datetime import datetime
from app.models.approval import ApprovalStatus, ApprovalLog
from app.schemas.approval import ApprovalAction

router = APIRouter()


# HS Codes CRUD
@router.get("/")
def read_hs_codes(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    search: str = "",
    approval_status: str = Query(ApprovalStatus.APPROVED, description="Filter by approval status")
) -> Any:
    """
    Retrieve HS codes with pagination.
    """
    query = db.query(HSCode)
    
    if approval_status:
        query = query.filter(HSCode.approval_status == approval_status)
        
    if search:
        query = query.filter(
            (HSCode.hs_code.ilike(f"%{search}%")) |
            (HSCode.description_en.ilike(f"%{search}%"))
        )
    
    # Get total count
    total = query.count()
    
    # Get paginated results
    hs_codes = query.order_by(HSCode.hs_code).offset(skip).limit(limit).all()
    
    # Convert to schemas
    items = [HSCodeSchema.model_validate(hsc) for hsc in hs_codes]
    
    return {
        "items": items,
        "total": total,
        "page": skip // limit + 1 if limit > 0 else 1,
        "page_size": limit,
        "pages": (total + limit - 1) // limit if limit > 0 else 1
    }


@router.get("/{hs_code}", response_model=HSCodeWithTariffs)
def read_hs_code(
    *,
    db: Session = Depends(deps.get_db),
    hs_code: str,
) -> Any:
    """
    Get HS code by ID with tariffs.
    """
    hs_code_obj = db.query(HSCode).options(joinedload(HSCode.tariffs)).filter(HSCode.hs_code == hs_code).first()
    if not hs_code_obj:
        raise HTTPException(status_code=404, detail="HS Code not found")
    return hs_code_obj


@router.post("/", response_model=HSCodeSchema)
def create_hs_code(
    *,
    db: Session = Depends(deps.get_db),
    hs_code_in: HSCodeCreate,
    current_user: dict = Depends(deps.get_current_active_user)
) -> Any:
    """
    Create new HS code.
    """
    # Check if HS code already exists
    existing = db.query(HSCode).filter(HSCode.hs_code == hs_code_in.hs_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="HS Code already exists")
    
    # Safely get user ID
    user_id = getattr(current_user, 'id', None)
    
    hs_code = HSCode(
        **hs_code_in.model_dump(),
        approval_status=ApprovalStatus.PENDING_APPROVAL,
        submitted_at=datetime.utcnow(),
        created_by=user_id
    )
    db.add(hs_code)
    db.commit()
    db.refresh(hs_code)
    return hs_code


@router.put("/{hs_code}", response_model=HSCodeSchema)
def update_hs_code(
    *,
    db: Session = Depends(deps.get_db),
    hs_code: str,
    hs_code_in: HSCodeUpdate,
    current_user: dict = Depends(deps.get_current_active_user)
) -> Any:
    """
    Update HS code.
    """
    hs_code_obj = db.query(HSCode).filter(HSCode.hs_code == hs_code).first()
    if not hs_code_obj:
        raise HTTPException(status_code=404, detail="HS Code not found")
    
    update_data = hs_code_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(hs_code_obj, field, value)
    
    db.commit()
    db.refresh(hs_code_obj)
    return hs_code_obj


@router.delete("/{hs_code}", response_model=HSCodeSchema)
def delete_hs_code(
    *,
    db: Session = Depends(deps.get_db),
    hs_code: str,
    current_user: dict = Depends(deps.get_current_active_user)
) -> Any:
    """
    Delete HS code.
    """
    hs_code_obj = db.query(HSCode).filter(HSCode.hs_code == hs_code).first()
    if not hs_code_obj:
        raise HTTPException(status_code=404, detail="HS Code not found")
    
    db.delete(hs_code_obj)
    db.commit()
    return hs_code_obj


@router.post("/{hs_code}/approve")
def approve_hs_code(
    *,
    db: Session = Depends(deps.get_db),
    hs_code: str,
    action: ApprovalAction,
    current_user: dict = Depends(deps.get_current_active_user),
) -> Any:
    """
    Approve a pending HS code.
    """
    hs_code_obj = db.query(HSCode).filter(HSCode.hs_code == hs_code).first()
    if not hs_code_obj:
        raise HTTPException(status_code=404, detail="HS Code not found")
    
    if hs_code_obj.approval_status not in [ApprovalStatus.PENDING_APPROVAL, ApprovalStatus.REJECTED]:
        raise HTTPException(status_code=400, detail=f"HS Code is not pending approval (current status: {hs_code_obj.approval_status})")
    
    old_status = hs_code_obj.approval_status
    
    # Update status
    hs_code_obj.approval_status = ApprovalStatus.APPROVED
    hs_code_obj.reviewed_at = datetime.utcnow()
    hs_code_obj.reviewed_by = current_user.id
    hs_code_obj.rejection_reason = None
    
    # Log approval
    approval_log = ApprovalLog(
        entity_type="hs_code",
        entity_id=hs_code_obj.id,
        old_status=old_status,
        new_status=ApprovalStatus.APPROVED,
        reviewed_by=current_user.id,
        review_notes=action.review_notes
    )
    db.add(approval_log)
    
    db.commit()
    db.refresh(hs_code_obj)
    
    return {
        "message": "HS Code approved successfully",
        "hs_code_id": str(hs_code_obj.id),
        "hs_code": hs_code_obj.hs_code
    }


@router.post("/{hs_code}/reject")
def reject_hs_code(
    *,
    db: Session = Depends(deps.get_db),
    hs_code: str,
    action: ApprovalAction,
    current_user: dict = Depends(deps.get_current_active_user),
) -> Any:
    """
    Reject a pending HS code.
    """
    if not action.rejection_reason or not action.rejection_reason.strip():
        raise HTTPException(status_code=400, detail="Rejection reason is required")
        
    hs_code_obj = db.query(HSCode).filter(HSCode.hs_code == hs_code).first()
    if not hs_code_obj:
        raise HTTPException(status_code=404, detail="HS Code not found")
    
    if hs_code_obj.approval_status != ApprovalStatus.PENDING_APPROVAL:
        raise HTTPException(status_code=400, detail=f"HS Code is not pending approval (current status: {hs_code_obj.approval_status})")
    
    old_status = hs_code_obj.approval_status
    
    # Update status
    hs_code_obj.approval_status = ApprovalStatus.REJECTED
    hs_code_obj.reviewed_at = datetime.utcnow()
    hs_code_obj.reviewed_by = current_user.id
    hs_code_obj.rejection_reason = action.rejection_reason
    
    # Log rejection
    approval_log = ApprovalLog(
        entity_type="hs_code",
        entity_id=hs_code_obj.id,
        old_status=old_status,
        new_status=ApprovalStatus.REJECTED,
        reviewed_by=current_user.id,
        review_notes=action.rejection_reason
    )
    db.add(approval_log)
    
    db.commit()
    db.refresh(hs_code_obj)
    
    return {
        "message": "HS Code rejected successfully",
        "hs_code_id": str(hs_code_obj.id),
        "hs_code": hs_code_obj.hs_code
    }


# Tariff CRUD
@router.get("/{hs_code}/tariffs", response_model=List[HSCodeTariffSchema])
def read_tariffs(
    *,
    db: Session = Depends(deps.get_db),
    hs_code: str,
) -> Any:
    """
    Get tariffs for a specific HS code.
    """
    tariffs = db.query(HSCodeTariff).filter(HSCodeTariff.hs_code == hs_code).all()
    return tariffs


@router.post("/{hs_code}/tariffs", response_model=HSCodeTariffSchema)
def create_tariff(
    *,
    db: Session = Depends(deps.get_db),
    hs_code: str,
    tariff_in: HSCodeTariffCreate,
    current_user: dict = Depends(deps.get_current_active_user)
) -> Any:
    """
    Create new tariff for HS code.
    """
    # Check if HS code exists
    hs_code_obj = db.query(HSCode).filter(HSCode.hs_code == hs_code).first()
    if not hs_code_obj:
        raise HTTPException(status_code=404, detail="HS Code not found")
    
    # Check if tariff already exists
    existing = db.query(HSCodeTariff).filter(
        HSCodeTariff.hs_code == hs_code,
        HSCodeTariff.country_name == tariff_in.country_name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tariff for this country already exists")
    
    tariff = HSCodeTariff(**tariff_in.model_dump())
    db.add(tariff)
    db.commit()
    db.refresh(tariff)
    return tariff


@router.put("/{hs_code}/tariffs/{country_name}", response_model=HSCodeTariffSchema)
def update_tariff(
    *,
    db: Session = Depends(deps.get_db),
    hs_code: str,
    country_name: str,
    tariff_in: HSCodeTariffUpdate,
    current_user: dict = Depends(deps.get_current_active_user)
) -> Any:
    """
    Update tariff.
    """
    tariff = db.query(HSCodeTariff).filter(
        HSCodeTariff.hs_code == hs_code,
        HSCodeTariff.country_name == country_name
    ).first()
    if not tariff:
        raise HTTPException(status_code=404, detail="Tariff not found")
    
    update_data = tariff_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tariff, field, value)
    
    db.commit()
    db.refresh(tariff)
    return tariff


@router.delete("/{hs_code}/tariffs/{country_name}", response_model=HSCodeTariffSchema)
def delete_tariff(
    *,
    db: Session = Depends(deps.get_db),
    hs_code: str,
    country_name: str,
    current_user: dict = Depends(deps.get_current_active_user)
) -> Any:
    """
    Delete tariff.
    """
    tariff = db.query(HSCodeTariff).filter(
        HSCodeTariff.hs_code == hs_code,
        HSCodeTariff.country_name == country_name
    ).first()
    if not tariff:
        raise HTTPException(status_code=404, detail="Tariff not found")
    
    db.delete(tariff)
    db.commit()
    return tariff


# Bulk upload
@router.post("/bulk-upload", response_model=BulkUploadResult)
async def bulk_upload(
    *,
    db: Session = Depends(deps.get_db),
    file: UploadFile = File(...),
    current_user: dict = Depends(deps.get_current_active_user)
) -> Any:
    """
    Bulk upload HS codes from CSV file.
    Expected columns: hs_code, description_en, description_pr, description_pt
    """
    created = 0
    updated = 0
    errors = []
    
    try:
        content = await file.read()
        decoded = content.decode('utf-8')
        csv_file = io.StringIO(decoded)
        reader = csv.DictReader(csv_file)
        
        for row_num, row in enumerate(reader, start=2):
            try:
                hs_code = row.get('hs_code', '').strip()
                if not hs_code:
                    errors.append(f"Row {row_num}: Missing HS code")
                    continue
                
                # Check if exists
                existing = db.query(HSCode).filter(HSCode.hs_code == hs_code).first()
                
                if existing:
                    # Update
                    existing.description_en = row.get('description_en', '')
                    existing.description_pr = row.get('description_pr', '')
                    existing.description_pt = row.get('description_pt', '')
                    updated += 1
                else:
                    # Create
                    new_hs_code = HSCode(
                        hs_code=hs_code,
                        description_en=row.get('description_en', ''),
                        description_pr=row.get('description_pr', ''),
                        description_pt=row.get('description_pt', '')
                    )
                    db.add(new_hs_code)
                    created += 1
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
                continue
        
        db.commit()
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")
    
    return BulkUploadResult(created=created, updated=updated, errors=errors)


@router.get("/download/template")
async def download_template():
    """
    Download CSV template for bulk upload.
    """
    csv_content = "hs_code,description_en,description_pr,description_pt\n"
    csv_content += "0101.21,Live horses - purebred breeding,,,\n"
    csv_content += "8471.30,Portable digital computers,,,\n"
    
    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=hs_codes_template.csv"}
    )
