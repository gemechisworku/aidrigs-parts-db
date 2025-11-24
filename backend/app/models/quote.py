"""
Quote and quote item models
"""
from sqlalchemy import Column, String, Integer, Numeric, Date, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Quote(BaseModel):
    """Customer quotes"""
    
    __tablename__ = "quotes"
    
    quote_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_name = Column(String(255))
    customer_email = Column(String(255))
    customer_phone = Column(String(50))
    status = Column(String(50), default='draft')  # draft, sent, accepted, rejected, expired
    currency = Column(String(3), default='USD')
    
    # Amounts
    subtotal = Column(Numeric(12, 2))
    tax_amount = Column(Numeric(12, 2))
    discount_amount = Column(Numeric(12, 2))
    total_amount = Column(Numeric(12, 2))
    
    valid_until = Column(Date)
    notes = Column(Text)
    
    # Tracking
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Relationships
    creator = relationship("User", back_populates="created_quotes", foreign_keys=[created_by])
    items = relationship("QuoteItem", back_populates="quote", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Quote({self.quote_number}, status={self.status})>"


class QuoteItem(BaseModel):
    """Line items in a quote"""
    
    __tablename__ = "quote_items"
    
    quote_id = Column(UUID(as_uuid=True), ForeignKey("quotes.id", ondelete="CASCADE"), nullable=False)
    part_id = Column(UUID(as_uuid=True), ForeignKey("parts.id"))
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    discount_percent = Column(Numeric(5, 2), default=0)
    line_total = Column(Numeric(12, 2), nullable=False)
    notes = Column(Text)
    position = Column(Integer)  # Display order
    
    # Relationships
    quote = relationship("Quote", back_populates="items")
    part = relationship("Part", back_populates="quote_items")
    
    def __repr__(self):
        return f"<QuoteItem(quote={self.quote_id}, part={self.part_id}, qty={self.quantity})>"
