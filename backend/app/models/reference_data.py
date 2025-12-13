"""
Reference Data Models: Ports, Price Tiers, and more
"""
from sqlalchemy import Column, String, Text, Enum as SQLEnum, TIMESTAMP, UUID, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum
import uuid


class PortTypeEnum(str, enum.Enum):
    """Port type enumeration"""
    SEA = "Sea"
    AIR = "Air"
    LAND = "Land"


class Port(Base):
    """Port model"""
    __tablename__ = "ports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    port_code = Column(String(5), unique=True, nullable=False, index=True)
    port_name = Column(String(60))
    country = Column(String(2), ForeignKey("countries.code"))
    city = Column(String(60))
    type = Column("port_type", String(4))
    
    # Approval fields
    approval_status = Column(String(50), default="PENDING_APPROVAL", nullable=False)
    submitted_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), default=func.now())
    reviewed_at = Column(TIMESTAMP(timezone=True), nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), default=func.now())
    
    # Relationships
    country_details = relationship("Country", backref="ports")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    creator = relationship("User", foreign_keys=[created_by])


class PriceTier(Base):
    """Price tier model"""
    __tablename__ = "price_tiers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tier_name = Column(String(100), unique=True, nullable=False)
    description = Column(String(252))
    tier_kind = Column(String(64))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())


class PriceTierMap(Base):
    """Price tier map model linking parts to price tiers"""
    __tablename__ = "price_tiers_map"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    part_id = Column(String(12), nullable=False)
    tier_id = Column(UUID(as_uuid=True), ForeignKey("price_tiers.id", ondelete="CASCADE"), nullable=False)
    price = Column(Numeric(18, 4))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    # Relationships
    tier = relationship("PriceTier", backref="part_prices")


class Country(Base):
    """Country model"""
    __tablename__ = "countries"
    
    code = Column(String(2), primary_key=True)  # ISO 3166-1 alpha-2
    name = Column(String(100), nullable=False)
    currency_code = Column(String(3))
    currency_name = Column(String(100))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())


