"""
Partner and Contact Models
"""
from sqlalchemy import Column, String, Enum as SQLEnum, TIMESTAMP, UUID, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum
import uuid


class PartnerTypeEnum(str, enum.Enum):
    """Partner type enumeration"""
    SUPPLIER = "supplier"
    CUSTOMER = "customer"
    AR_STORAGE = "AR_storage"
    FORWARDER = "forwarder"


class Partner(Base):
    """Partner model - suppliers, customers, forwarders, etc."""
    __tablename__ = "partners"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(10), unique=True)
    name = Column(String(60))
    street_number = Column(String(10))
    city = Column(String(60))
    country = Column(String(60))
    type = Column(SQLEnum(PartnerTypeEnum))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at = Column(TIMESTAMP(timezone=True), nullable=True)
    
    # Relationships
    contacts = relationship("Contact", back_populates="partner", cascade="all, delete-orphan")


class Contact(Base):
    """Contact model - linked to partners"""
    __tablename__ = "contacts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id", ondelete="CASCADE"), nullable=False)
    full_name = Column(String(60))
    job_title = Column(String(60))
    email = Column(String(60))
    phone1 = Column(String(12))
    phone2 = Column(String(12))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at = Column(TIMESTAMP(timezone=True), nullable=True)
    
    # Relationships
    partner = relationship("Partner", back_populates="contacts")
