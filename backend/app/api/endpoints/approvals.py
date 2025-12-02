"""
Approval system API endpoints
"""
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from datetime import datetime
from app.api import deps
from app.models.part import Part
from app.models.approval import ApprovalLog, ApprovalStatus
from app.models.translation import PartTranslationStandardization
from app.schemas.approval import (
    ApprovalAction, PendingItem, ApprovalLogResponse, 
    PendingPartResponse, ApprovalSummary
)
from app.schemas.translation import PendingTranslationResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/pending", response_model=List[PendingItem])
def get_pending_items(
    *,
    db: Session = Depends(deps.get_db),
    entity_type: Optional[str] = Query(None, description="Filter by entity type: part, translation, etc."),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all pending items awaiting approval across all entity types.
    Admins only.
    """
    pending_items = []
    
    # Get pending parts
    if not entity_type or entity_type == "part":
        parts = db.query(Part).filter(
            Part.approval_status == ApprovalStatus.PENDING_APPROVAL
        ).all()
        
        for part in parts:
            pending_items.append({
                "entity_type": "part",
                "entity_id": str(part.id),
                "entity_identifier": part.part_id,
                "status": part.approval_status,
                "submitted_at": part.submitted_at,
                "details": {
                    "part_id": part.part_id,
                    "designation": part.designation
                }
            })
    
    # Get pending translations
    if not entity_type or entity_type == "translation":
        translations = db.query(PartTranslationStandardization).filter(
            PartTranslationStandardization.approval_status == ApprovalStatus.PENDING_APPROVAL
        ).all()
        
        for translation in translations:
            pending_items.append({
                "entity_type": "translation",
                "entity_id": str(translation.id),
                "entity_identifier": translation.part_name_en,
                "status": translation.approval_status,
                "submitted_at": translation.submitted_at,
                "details": {
                    "part_name_en": translation.part_name_en,
                    "part_name_pr": translation.part_name_pr,
                    "part_name_fr": translation.part_name_fr
                }
            })
    
    return pending_items


@router.get("/pending/parts", response_model=List[PendingPartResponse])
def get_pending_parts(
    *,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get pending parts specifically with full details.
    """
    parts = db.query(Part).filter(
        Part.approval_status == ApprovalStatus.PENDING_APPROVAL
    ).offset(skip).limit(limit).all()
    
    return parts


@router.get("/pending/translations", response_model=List[PendingTranslationResponse])
def get_pending_translations(
    *,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get pending translations specifically with full details.
    """
    translations = db.query(PartTranslationStandardization).filter(
        PartTranslationStandardization.approval_status == ApprovalStatus.PENDING_APPROVAL
    ).offset(skip).limit(limit).all()
    
    return translations


@router.post("/translations/{translation_id}/approve")
def approve_translation(
    *,
    db: Session = Depends(deps.get_db),
    translation_id: str,
    action: ApprovalAction,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Approve a pending translation.
    """
    translation = db.query(PartTranslationStandardization).filter(PartTranslationStandardization.id == translation_id).first()
    if not translation:
        raise HTTPException(status_code=404, detail="Translation not found")
    
    if translation.approval_status not in [ApprovalStatus.PENDING_APPROVAL, ApprovalStatus.REJECTED]:
        raise HTTPException(status_code=400, detail=f"Translation is not pending approval (current status: {translation.approval_status})")
    
    old_status = translation.approval_status
    
    # Update translation status
    translation.approval_status = ApprovalStatus.APPROVED
    translation.reviewed_at = datetime.utcnow()
    translation.reviewed_by = current_user.id
    translation.rejection_reason = None
    
    # Log the approval
    approval_log = ApprovalLog(
        entity_type="translation",
        entity_id=translation.id,
        old_status=old_status,
        new_status=ApprovalStatus.APPROVED,
        reviewed_by=current_user.id,
        review_notes=action.review_notes
    )
    db.add(approval_log)
    
    db.commit()
    db.refresh(translation)
    
    logger.info(f"Translation {translation.part_name_en} approved by user {current_user.username}")
    
    return {
        "message": "Translation approved successfully",
        "translation_id": str(translation.id),
        "part_name_en": translation.part_name_en
    }


@router.post("/translations/{translation_id}/reject")
def reject_translation(
    *,
    db: Session = Depends(deps.get_db),
    translation_id: str,
    action: ApprovalAction,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Reject a pending translation.
    """
    if not action.rejection_reason or not action.rejection_reason.strip():
        raise HTTPException(status_code=400, detail="Rejection reason is required")
    
    translation = db.query(PartTranslationStandardization).filter(PartTranslationStandardization.id == translation_id).first()
    if not translation:
        raise HTTPException(status_code=404, detail="Translation not found")
    
    if translation.approval_status != ApprovalStatus.PENDING_APPROVAL:
        raise HTTPException(status_code=400, detail=f"Translation is not pending approval (current status: {translation.approval_status})")
    
    old_status = translation.approval_status
    
    # Update translation status
    translation.approval_status = ApprovalStatus.REJECTED
    translation.reviewed_at = datetime.utcnow()
    translation.reviewed_by = current_user.id
    translation.rejection_reason = action.rejection_reason
    
    # Log the rejection
    approval_log = ApprovalLog(
        entity_type="translation",
        entity_id=translation.id,
        old_status=old_status,
        new_status=ApprovalStatus.REJECTED,
        reviewed_by=current_user.id,
        review_notes=action.rejection_reason
    )
    db.add(approval_log)
    
    db.commit()
    db.refresh(translation)
    
    logger.info(f"Translation {translation.part_name_en} rejected by user {current_user.username}")
    
    return {
        "message": "Translation rejected",
        "translation_id": str(translation.id),
        "part_name_en": translation.part_name_en,
        "rejection_reason": action.rejection_reason
    }


@router.post("/parts/{part_id}/approve")
def approve_part(
    *,
    db: Session = Depends(deps.get_db),
    part_id: str,
    action: ApprovalAction,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Approve a pending part.
    """
    part = db.query(Part).filter(Part.id == part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    
    if part.approval_status not in [ApprovalStatus.PENDING_APPROVAL, ApprovalStatus.REJECTED]:
        raise HTTPException(status_code=400, detail=f"Part is not pending approval (current status: {part.approval_status})")
    
    old_status = part.approval_status
    
    # Update part status
    part.approval_status = ApprovalStatus.APPROVED
    part.reviewed_at = datetime.utcnow()
    part.reviewed_by = current_user.id
    part.rejection_reason = None
    
    # Log the approval
    approval_log = ApprovalLog(
        entity_type="part",
        entity_id=part.id,
        old_status=old_status,
        new_status=ApprovalStatus.APPROVED,
        reviewed_by=current_user.id,
        review_notes=action.review_notes
    )
    db.add(approval_log)
    
    db.commit()
    db.refresh(part)
    
    logger.info(f"Part {part.part_id} approved by user {current_user.username}")
    
    return {
        "message": "Part approved successfully",
        "part_id": str(part.id),
        "part_identifier": part.part_id
    }


@router.post("/parts/{part_id}/reject")
def reject_part(
    *,
    db: Session = Depends(deps.get_db),
    part_id: str,
    action: ApprovalAction,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Reject a pending part.
    """
    if not action.rejection_reason or not action.rejection_reason.strip():
        raise HTTPException(status_code=400, detail="Rejection reason is required")
    
    part = db.query(Part).filter(Part.id == part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    
    if part.approval_status != ApprovalStatus.PENDING_APPROVAL:
        raise HTTPException(status_code=400, detail=f"Part is not pending approval (current status: {part.approval_status})")
    
    old_status = part.approval_status
    
    # Update part status
    part.approval_status = ApprovalStatus.REJECTED
    part.reviewed_at = datetime.utcnow()
    part.reviewed_by = current_user.id
    part.rejection_reason = action.rejection_reason
    
    # Log the rejection
    approval_log = ApprovalLog(
        entity_type="part",
        entity_id=part.id,
        old_status=old_status,
        new_status=ApprovalStatus.REJECTED,
        reviewed_by=current_user.id,
        review_notes=action.rejection_reason
    )
    db.add(approval_log)
    
    db.commit()
    db.refresh(part)
    
    logger.info(f"Part {part.part_id} rejected by user {current_user.username}")
    
    return {
        "message": "Part rejected",
        "part_id": str(part.id),
        "part_identifier": part.part_id,
        "rejection_reason": action.rejection_reason
    }


@router.get("/logs", response_model=List[ApprovalLogResponse])
def get_approval_logs(
    *,
    db: Session = Depends(deps.get_db),
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get approval history logs.
    """
    query = db.query(ApprovalLog)
    
    if entity_type:
        query = query.filter(ApprovalLog.entity_type == entity_type)
    
    if entity_id:
        query = query.filter(ApprovalLog.entity_id == entity_id)
    
    logs = query.order_by(ApprovalLog.created_at.desc()).offset(skip).limit(limit).all()
    
    return logs


@router.get("/summary", response_model=ApprovalSummary)
def get_approval_summary(
    *,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get summary counts of pending items by entity type.
    """
    pending_parts = db.query(Part).filter(
        Part.approval_status == ApprovalStatus.PENDING_APPROVAL
    ).count()
    
    pending_translations = db.query(PartTranslationStandardization).filter(
        PartTranslationStandardization.approval_status == ApprovalStatus.PENDING_APPROVAL
    ).count()
    
    return {
        "pending_parts": pending_parts,
        "pending_translations": pending_translations,
        "pending_partners": 0,      # Placeholder
        "total_pending": pending_parts + pending_translations
    }
