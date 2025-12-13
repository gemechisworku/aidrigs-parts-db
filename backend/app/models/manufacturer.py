"""
Manufacturer model
"""
from sqlalchemy import Column, String, Enum, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.models.approval import ApprovalStatus


class Manufacturer(BaseModel):
    """Manufacturer model (OEM, APM, Remanufacturers)"""
    
    __tablename__ = "manufacturers"
    
    # mfg_id removed as per user request (using UUID as primary key)
    # mfg_id = Column(String(10), unique=True, nullable=False, index=True)
    mfg_name = Column(String(255), nullable=False)
    mfg_type = Column(
        Enum('OEM', 'APM', 'Remanufacturers', name='manufacturer_type_enum'),
        nullable=False
    )
    country = Column(String(100))
    contact_info = Column(JSONB)  # Flexible contact information storage
    website = Column(String(255))
    certification = Column(String(255))  # e.g., ISO certification
    
    # Approval fields
    approval_status = Column(Enum(ApprovalStatus), default=ApprovalStatus.APPROVED, nullable=False)
    submitted_at = Column(DateTime, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    rejection_reason = Column(String(500), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Relationships
    parts = relationship("Part", back_populates="manufacturer")
    
    def __repr__(self):
        return f"<Manufacturer({self.id}: {self.mfg_name})>"
