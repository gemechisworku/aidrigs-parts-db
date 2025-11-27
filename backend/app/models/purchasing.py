"""
Purchase order, shipping, and GRN models
"""
from sqlalchemy import Column, String, Integer, Numeric, Date, Enum, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class PurchaseOrder(BaseModel):
    """Purchase orders to suppliers"""
    
    __tablename__ = "purchase_orders"
    
    po_number = Column(String(50), unique=True, nullable=False, index=True)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id"))
    status = Column(String(50), default='draft')  # draft, sent, confirmed, received, cancelled
    order_date = Column(Date)
    expected_delivery = Column(Date)
    total_amount = Column(Numeric(12, 2))
    currency = Column(String(3), default='USD')
    notes = Column(Text)
    
    # Tracking
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Relationships
    supplier = relationship("Supplier", back_populates="purchase_orders")
    creator = relationship("User", back_populates="created_pos", foreign_keys=[created_by])
    shipments = relationship("Shipment", back_populates="purchase_order")
    grn_items = relationship("GRNItem", back_populates="purchase_order")
    
    def __repr__(self):
        return f"<PurchaseOrder({self.po_number}, status={self.status})>"


class Shipment(BaseModel):
    """Shipment tracking"""
    
    __tablename__ = "shipments"
    
    shipment_number = Column(String(50), unique=True, nullable=False, index=True)
    po_id = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id"))
    origin_port_code = Column(String(5), ForeignKey("ports.port_code"))
    destination_port_code = Column(String(5), ForeignKey("ports.port_code"))
    shipping_method = Column(String(50))  # Sea freight, Air freight, etc.
    tracking_number = Column(String(255))
    status = Column(String(50))  # preparing, shipped, in_transit, customs, delivered
    shipped_date = Column(Date)
    expected_arrival = Column(Date)
    actual_arrival = Column(Date)
    notes = Column(Text)
    
    # Relationships
    purchase_order = relationship("PurchaseOrder", back_populates="shipments")
    # Note: Port relationships removed - ports table managed separately
    
    def __repr__(self):
        return f"<Shipment({self.shipment_number}, status={self.status})>"


class GRNItem(BaseModel):
    """Goods Receipt Note items"""
    
    __tablename__ = "grn_items"
    
    grn_items_id = Column(Integer, unique=True, nullable=False, index=True)  # Legacy ID
    po_id = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id"))
    part_id = Column(UUID(as_uuid=True), ForeignKey("parts.id"))
    quantity = Column(Integer)
    unit_usd = Column(Numeric(12, 2))
    
    # Relationships
    purchase_order = relationship("PurchaseOrder", back_populates="grn_items")
    part = relationship("Part")
    
    def __repr__(self):
        return f"<GRNItem({self.grn_items_id}, PO={self.po_id})>"
