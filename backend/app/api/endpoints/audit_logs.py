"""
Audit Logs API Endpoints - For viewing system audit trail
"""
from typing import List, Any, Optional
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
    
    # Order by most recent first
    query = query.order_by(AuditLog.created_at.desc())
    
    # Count total
    total = query.count()
    
    # Pagination
    skip = (page - 1) * page_size
    logs = query.offset(skip).limit(page_size).all()
    
    # Add username to response
    items = []
    for log in logs:
        log_dict = {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
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
