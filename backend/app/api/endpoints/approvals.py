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
from app.models.classification import HSCode
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
            
    # Get pending HS Codes
    if not entity_type or entity_type == "hs_code":
        hs_codes = db.query(HSCode).filter(
            HSCode.approval_status == ApprovalStatus.PENDING_APPROVAL
        ).all()
        
        for hs_code in hs_codes:
            pending_items.append({
                "entity_type": "hs_code",
                "entity_id": str(hs_code.id),
                "entity_identifier": hs_code.hs_code,
                "status": hs_code.approval_status,
                "submitted_at": hs_code.submitted_at,
                "details": {
                    "hs_code": hs_code.hs_code,
                    "description_en": hs_code.description_en,
                    "description_fr": hs_code.description_fr
                }
            })

    # Get pending Manufacturers
    if not entity_type or entity_type == "manufacturer":
        from app.models.manufacturer import Manufacturer
        manufacturers = db.query(Manufacturer).filter(
            Manufacturer.approval_status == ApprovalStatus.PENDING_APPROVAL,
            Manufacturer.deleted_at.is_(None)
        ).all()
        
        for mfg in manufacturers:
            pending_items.append({
                "entity_type": "manufacturer",
                "entity_id": str(mfg.id),
                "entity_identifier": mfg.mfg_name,
                "status": mfg.approval_status,
                "submitted_at": mfg.submitted_at,
                "details": {
                    "mfg_name": mfg.mfg_name,
                    "mfg_type": mfg.mfg_type,
                    "country": mfg.country,
                    "website": mfg.website
                }
            })
    
    # Get pending Ports
    if not entity_type or entity_type == "port":
        from app.models.reference_data import Port
        ports = db.query(Port).filter(
            Port.approval_status == ApprovalStatus.PENDING_APPROVAL
        ).all()
        
        for port in ports:
            pending_items.append({
                "entity_type": "port",
                "entity_id": str(port.id),
                "entity_identifier": port.port_name or port.port_code,
                "status": port.approval_status,
                "submitted_at": port.submitted_at,
                "details": {
                    "port_code": port.port_code,
                    "port_name": port.port_name,
                    "country": port.country,
                    "city": port.city,
                    "type": port.type
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


@router.post("/ports/{port_id}/approve")
def approve_port(
    *,
    db: Session = Depends(deps.get_db),
    port_id: str,
    action: ApprovalAction,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Approve a pending port.
    """
    from app.models.reference_data import Port
    
    port = db.query(Port).filter(Port.id == port_id).first()
    if not port:
        raise HTTPException(status_code=404, detail="Port not found")
    
    if port.approval_status not in [ApprovalStatus.PENDING_APPROVAL, ApprovalStatus.REJECTED]:
        raise HTTPException(status_code=400, detail=f"Port is not pending approval (current status: {port.approval_status})")
    
    old_status = port.approval_status
    
    # Update port status
    port.approval_status = ApprovalStatus.APPROVED
    port.reviewed_at = datetime.utcnow()
    port.reviewed_by = current_user.id
    port.rejection_reason = None
    
    # Log the approval
    approval_log = ApprovalLog(
        entity_type="port",
        entity_id=port.id,
        old_status=old_status,
        new_status=ApprovalStatus.APPROVED,
        reviewed_by=current_user.id,
        review_notes=action.review_notes
    )
    db.add(approval_log)
    
    db.commit()
    db.refresh(port)
    
    logger.info(f"Port {port.port_code} approved by user {current_user.username}")
    
    return {
        "message": "Port approved successfully",
        "port_id": str(port.id),
        "port_identifier": port.port_name or port.port_code
    }


@router.post("/ports/{port_id}/reject")
def reject_port(
    *,
    db: Session = Depends(deps.get_db),
    port_id: str,
    action: ApprovalAction,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Reject a pending port.
    """
    from app.models.reference_data import Port
    
    if not action.rejection_reason or not action.rejection_reason.strip():
        raise HTTPException(status_code=400, detail="Rejection reason is required")
    
    port = db.query(Port).filter(Port.id == port_id).first()
    if not port:
        raise HTTPException(status_code=404, detail="Port not found")
    
    if port.approval_status != ApprovalStatus.PENDING_APPROVAL:
        raise HTTPException(status_code=400, detail=f"Port is not pending approval (current status: {port.approval_status})")
    
    old_status = port.approval_status
    
    # Update port status
    port.approval_status = ApprovalStatus.REJECTED
    port.reviewed_at = datetime.utcnow()
    port.reviewed_by = current_user.id
    port.rejection_reason = action.rejection_reason
    
    # Log the rejection
    approval_log = ApprovalLog(
        entity_type="port",
        entity_id=port.id,
        old_status=old_status,
        new_status=ApprovalStatus.REJECTED,
        reviewed_by=current_user.id,
        review_notes=action.rejection_reason
    )
    db.add(approval_log)
    
    db.commit()
    db.refresh(port)
    
    logger.info(f"Port {port.port_code} rejected by user {current_user.username}")
    
    return {
        "message": "Port rejected",
        "port_id": str(port.id),
        "port_identifier": port.port_name or port.port_code,
        "rejection_reason": action.rejection_reason
    }


@router.get("/logs", response_model=List[ApprovalLogResponse])
def get_approval_logs(
    *,
    db: Session = Depends(deps.get_db),
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
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

    if start_date:
        query = query.filter(ApprovalLog.created_at >= start_date)
    
    if end_date:
        query = query.filter(ApprovalLog.created_at <= end_date)
    
    logs = query.order_by(ApprovalLog.created_at.desc()).offset(skip).limit(limit).all()
    
    # Populate entity identifiers
    result = []
    for log in logs:
        log_data = ApprovalLogResponse.model_validate(log).model_dump()
        
        identifier = None
        entity_type = log.entity_type.lower()
        if entity_type in ["part", "parts"]:
            part = db.query(Part).filter(Part.id == log.entity_id).first()
            if part:
                identifier = part.part_id
        elif entity_type in ["translation", "translations"]:
            trans = db.query(PartTranslationStandardization).filter(PartTranslationStandardization.id == log.entity_id).first()
            if trans:
                identifier = trans.part_name_en
        elif entity_type in ["hs_code", "hscode", "hs_codes"]:
            hs = db.query(HSCode).filter(HSCode.id == log.entity_id).first()
            if hs:
                identifier = hs.hs_code
                
        log_data["entity_identifier"] = identifier
        result.append(log_data)
    
    return result


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
    
    pending_hscodes = db.query(HSCode).filter(
        HSCode.approval_status == ApprovalStatus.PENDING_APPROVAL
    ).count()

    from app.models.manufacturer import Manufacturer
    pending_manufacturers = db.query(Manufacturer).filter(
        Manufacturer.approval_status == ApprovalStatus.PENDING_APPROVAL,
        Manufacturer.deleted_at.is_( None)
    ).count()
    
    from app.models.reference_data import Port
    pending_ports = db.query(Port).filter(
        Port.approval_status == ApprovalStatus.PENDING_APPROVAL
    ).count()
    
    return {
        "pending_parts": pending_parts,
        "pending_translations": pending_translations,
        "pending_hscodes": pending_hscodes,
        "pending_manufacturers": pending_manufacturers,
        "pending_ports": pending_ports,
        "pending_partners": 0,      # Placeholder
        "total_pending": pending_parts + pending_translations + pending_hscodes + pending_manufacturers + pending_ports
    }
