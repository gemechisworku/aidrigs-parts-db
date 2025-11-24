"""
Supplier and supplier-part models
"""
from sqlalchemy import Column, String, Integer, Numeric, Boolean, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Supplier(BaseModel):
    """Supplier model"""
    
    __tablename__ = "suppliers"
    
    supplier_code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    country = Column(String(100))
    payment_terms = Column(String(100))
    currency = Column(String(3), default='USD')
    contact_info = Column(JSONB)  # Flexible contact details
    rating = Column(Numeric(2, 1))  # e.g., 4.5
    is_active = Column(Boolean, default=True)
    
    # Relationships
    supplier_parts = relationship("SupplierPart", back_populates="supplier")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")
    
    def __repr__(self):
        return f"<Supplier({self.supplier_code}: {self.name})>"


class SupplierPart(BaseModel):
    """Supplier pricing and availability for parts"""
    
    __tablename__ = "supplier_parts"
    
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=False)
    part_id = Column(UUID(as_uuid=True), ForeignKey("parts.id"), nullable=False)
    supplier_part_number = Column(String(100))
    unit_price = Column(Numeric(12, 2))
    currency = Column(String(3), default='USD')
    moq = Column(Integer)  # Minimum order quantity
    lead_time_days = Column(Integer)
    is_preferred = Column(Boolean, default=False)
    valid_from = Column(Date)
    valid_until = Column(Date)
    
    # Relationships
    supplier = relationship("Supplier", back_populates="supplier_parts")
    part = relationship("Part", back_populates="supplier_parts")
    
    def __repr__(self):
        return f"<SupplierPart(supplier={self.supplier_id}, part={self.part_id})>"


class PricingRule(BaseModel):
    """Pricing calculation rules"""
    
    __tablename__ = "pricing_rules"
    
    name = Column(String(255), nullable=False)
    rule_type = Column(String(50))  # markup, margin, tier, volume, etc.
    conditions = Column(JSONB)  # Conditions for rule application
    calculation = Column(JSONB)  # Calculation formula
    priority = Column(Integer, default=0)  # Higher priority rules apply first
    is_active = Column(Boolean, default=True)
    
    def __repr__(self):
        return f"<PricingRule({self.name}, type={self.rule_type})>"
