"""
Approval workflow and audit logging models
"""
from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Approval(BaseModel):
    """Approval tracking for workflow items"""
    
    __tablename__ = "approvals"
    
    entity_type = Column(String(100), nullable=False, index=True)  # part, translation, price, etc.
    entity_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    status = Column(String(50), default='pending')  # pending, approved, rejected
    requested_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    review_notes = Column(Text)
    requested_at = Column(DateTime(timezone=True))
    reviewed_at = Column(DateTime(timezone=True))
    
    # Relationships
    requester = relationship("User", foreign_keys=[requested_by])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    
    def __repr__(self):
        return f"<Approval({self.entity_type}:{self.entity_id}, status={self.status})>"


class ApprovalWorkflow(BaseModel):
    """Workflow definitions for approvals"""
    
    __tablename__ = "approval_workflows"
    
    name = Column(String(255), nullable=False)
    entity_type = Column(String(100), nullable=False, index=True)
    required_approvals = Column(Integer, default=1)
    approver_roles = Column(JSONB)  # Array of role IDs or names
    is_active = Column(Boolean, default=True)
    
    def __repr__(self):
        return f"<ApprovalWorkflow({self.name}, type={self.entity_type})>"


class AuditLog(BaseModel):
    """System audit trail"""
    
    __tablename__ = "audit_logs"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    action = Column(String(100), nullable=False, index=True)  # create, update, delete, approve, etc.
    entity_type = Column(String(100), nullable=False, index=True)
    entity_id = Column(UUID(as_uuid=True), index=True)
    changes = Column(JSONB)  # Before/after values
    ip_address = Column(INET)
    user_agent = Column(Text)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    
    def __repr__(self):
        return f"<AuditLog({self.action} on {self.entity_type}:{self.entity_id} by user={self.user_id})>"


class Inventory(BaseModel):
    """Inventory tracking"""
    
    __tablename__ = "inventory"
    
    part_id = Column(UUID(as_uuid=True), ForeignKey("parts.id"), unique=True, nullable=False)
    location = Column(String(255))
    quantity_on_hand = Column(Integer, default=0)
    quantity_reserved = Column(Integer, default=0)
    # quantity_available is a computed column: quantity_on_hand - quantity_reserved
    reorder_point = Column(Integer)
    reorder_quantity = Column(Integer)
    last_counted_at = Column(DateTime(timezone=True))
    
    # Relationships
    part = relationship("Part", back_populates="inventory")
    
    @property
    def quantity_available(self):
        """Calculate available quantity"""
        return self.quantity_on_hand - self.quantity_reserved
    
    def __repr__(self):
        return f"<Inventory(part={self.part_id}, on_hand={self.quantity_on_hand})>"
