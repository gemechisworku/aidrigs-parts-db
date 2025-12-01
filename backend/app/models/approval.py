"""
Approval system models for data quality management
"""
from sqlalchemy import Column, String, Text, Enum, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import BaseModel
import enum


class ApprovalStatus(str, enum.Enum):
    """Universal approval status for any entity requiring review"""
    DRAFT = "DRAFT"                         # User created, not yet submitted
    PENDING_APPROVAL = "PENDING_APPROVAL"   # Submitted/Auto-created, awaiting review
    APPROVED = "APPROVED"                   # Reviewed and approved
    REJECTED = "REJECTED"                   # Rejected by admin


class ApprovalLog(BaseModel):
    """
    Universal approval log tracking all approval actions across entities.
    This table logs status changes for any entity type (parts, translations, etc.)
    """
    __tablename__ = "approval_logs"
    
    entity_type = Column(String(50), nullable=False, index=True)  # 'part', 'translation', 'partner', etc.
    entity_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    old_status = Column(Enum(ApprovalStatus), nullable=True)
    new_status = Column(Enum(ApprovalStatus), nullable=False)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    review_notes = Column(Text, nullable=True)
    
    # BaseModel provides: id, created_at, updated_at, deleted_at
