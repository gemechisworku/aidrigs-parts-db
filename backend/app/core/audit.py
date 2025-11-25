"""
Simple audit utility for tracking operations using existing AuditLog model
"""
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import Request
from app.models.workflow import AuditLog


def log_audit(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: str,
    user_id: Optional[str] = None,
    changes: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None,
):
    """
    Create an audit log entry using existing AuditLog model
    
    Args:
        db: Database session
        action: CREATE, UPDATE, DELETE, LOGIN, LOGOUT
        entity_type: Name of affected table/entity
        entity_id: UUID of affected record
        user_id: UUID of user performing action
        changes: Dict with 'old' and 'new' values
        request: FastAPI request object (for IP/user agent)
    """
    ip_address = None
    user_agent = None
    
    if request:
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
    
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        changes=changes,  # {old: {...}, new: {...}}
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    db.add(audit_log)
    db.commit()
    
    return audit_log
