"""
Approval system Pydantic schemas
"""
from typing import Optional
from pydantic import BaseModel, UUID4
from datetime import datetime
from app.models.approval import ApprovalStatus


class ApprovalAction(BaseModel):
    """Schema for approval/rejection action"""
    review_notes: Optional[str] = None
    rejection_reason: Optional[str] = None


class PendingItem(BaseModel):
    """Generic pending item for any entity type"""
    entity_type: str
    entity_id: str
    entity_identifier: str  # e.g., part_id, translation code, etc.
    status: ApprovalStatus
    submitted_at: Optional[datetime] = None
    details: dict  # Flexible field for entity-specific data


class PendingPartResponse(BaseModel):
    """Detailed response for pending parts"""
    id: UUID4
    part_id: str
    designation: Optional[str] = None
    approval_status: ApprovalStatus
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ApprovalLogResponse(BaseModel):
    """Response schema for approval log entries"""
    id: UUID4
    entity_type: str
    entity_id: UUID4
    entity_identifier: Optional[str] = None
    old_status: Optional[ApprovalStatus] = None
    new_status: ApprovalStatus
    reviewed_by: UUID4
    review_notes: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ApprovalSummary(BaseModel):
    """Summary of pending items across all entity types"""
    pending_parts: int
    pending_translations: int
    pending_hscodes: int
    pending_manufacturers: int
    pending_ports: int
    pending_partners: int
    total_pending: int
