from typing import Any, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api import deps
from app.models.part import Part
from app.models.translation import PartTranslationStandardization
from app.models.manufacturer import Manufacturer
from app.models.partners import Partner
from app.models.reference_data import Port
from app.models.classification import HSCode
from app.models.approval import ApprovalStatus

router = APIRouter()

@router.get("/stats", response_model=Dict[str, int])
def get_dashboard_stats(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get dashboard statistics.
    """
    # Count pending items
    pending_parts = db.query(func.count(Part.id)).filter(Part.approval_status == ApprovalStatus.PENDING_APPROVAL).scalar() or 0
    pending_translations = db.query(func.count(PartTranslationStandardization.id)).filter(PartTranslationStandardization.approval_status == ApprovalStatus.PENDING_APPROVAL).scalar() or 0
    pending_manufacturers = db.query(func.count(Manufacturer.id)).filter(Manufacturer.approval_status == ApprovalStatus.PENDING_APPROVAL).scalar() or 0
    pending_ports = db.query(func.count(Port.id)).filter(Port.approval_status == ApprovalStatus.PENDING_APPROVAL).scalar() or 0
    pending_hscodes = db.query(func.count(HSCode.id)).filter(HSCode.approval_status == ApprovalStatus.PENDING_APPROVAL).scalar() or 0
    
    total_pending = pending_parts + pending_translations + pending_manufacturers + pending_ports + pending_hscodes

    stats = {
        "total_parts": db.query(func.count(Part.id)).scalar() or 0,
        "total_translations": db.query(func.count(PartTranslationStandardization.id)).scalar() or 0,
        "pending_translations": pending_translations,
        "total_manufacturers": db.query(func.count(Manufacturer.id)).scalar() or 0,
        "total_partners": db.query(func.count(Partner.id)).scalar() or 0,
        "pending_approvals": total_pending,
    }
    return stats
