"""
Audit Logs API Endpoints - For viewing system audit trail
"""
from typing import List, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from app.api import deps
from app.models.workflow import AuditLog
from app.models.user import User
from app.schemas.audit import AuditLogResponse, AuditLogListResponse
from math import ceil

router = APIRouter()


@router.get("/", response_model=AuditLogListResponse)
def read_audit_logs(
    db: Session = Depends(deps.get_db),
    action: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve audit logs with filtering and pagination
    (Admin only)
    """
    query = db.query(AuditLog).options(joinedload(AuditLog.user))
    
    # Filters
    if action:
        query = query.filter(AuditLog.action == action)
    
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)

    if start_date:
        query = query.filter(AuditLog.created_at >= start_date)
    
    if end_date:
        query = query.filter(AuditLog.created_at <= end_date)
    
    # Order by most recent first
    query = query.order_by(AuditLog.created_at.desc())
    
    # Count total
    total = query.count()
    
    # Pagination
    skip = (page - 1) * page_size
    logs = query.offset(skip).limit(page_size).all()
    
    # Add username and entity identifier to response
    items = []
    for log in logs:
        identifier = None
        entity_type = log.entity_type.lower()
        
        # Try to fetch identifier based on entity type
        try:
            if entity_type in ["part", "parts"]:
                # Need to import Part model inside function or at top if not circular
                from app.models.part import Part
                part = db.query(Part).filter(Part.id == log.entity_id).first()
                if part:
                    identifier = part.part_id
                # Fallback for deleted items
                elif log.changes and isinstance(log.changes, dict):
                    # Check if it's a delete action or just missing
                    # changes might be {"old": {...}, "new": ...} or just the object
                    if "part_id" in log.changes:
                        identifier = log.changes["part_id"]
                    elif "old" in log.changes and isinstance(log.changes["old"], dict) and "part_id" in log.changes["old"]:
                        identifier = log.changes["old"]["part_id"]
                        
            elif entity_type in ["translation", "translations"]:
                from app.models.translation import PartTranslationStandardization
                trans = db.query(PartTranslationStandardization).filter(PartTranslationStandardization.id == log.entity_id).first()
                if trans:
                    identifier = trans.part_name_en
                # Fallback
                elif log.changes and isinstance(log.changes, dict):
                    if "part_name_en" in log.changes:
                        identifier = log.changes["part_name_en"]
                    elif "old" in log.changes and isinstance(log.changes["old"], dict) and "part_name_en" in log.changes["old"]:
                        identifier = log.changes["old"]["part_name_en"]
                        
            elif entity_type in ["hs_code", "hscode", "hs_codes"]:
                from app.models.classification import HSCode
                hs = db.query(HSCode).filter(HSCode.id == log.entity_id).first()
                if hs:
                    identifier = hs.hs_code
                # Fallback
                elif log.changes and isinstance(log.changes, dict):
                    if "hs_code" in log.changes:
                        identifier = log.changes["hs_code"]
                    elif "old" in log.changes and isinstance(log.changes["old"], dict) and "hs_code" in log.changes["old"]:
                        identifier = log.changes["old"]["hs_code"]
                        
        except Exception:
            # Ignore errors in fetching identifier
            pass

        log_dict = {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "entity_identifier": identifier,
            "changes": log.changes,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "created_at": log.created_at,
            "username": log.user.username if log.user else "System"
        }
        items.append(log_dict)
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": ceil(total / page_size) if total > 0 else 1,
        "page_size": page_size
    }
