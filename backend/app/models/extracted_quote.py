"""
Extracted quote models for AI-extracted data staging
"""
from sqlalchemy import Column, String, Integer, Numeric, Date, Text, ForeignKey, LargeBinary
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class ExtractedQuote(BaseModel):
    """Staging table for AI-extracted quotes"""
    
    __tablename__ = "extracted_quotes"
    
    # Quote information
    quote_number = Column(String(50), index=True)
    quote_date = Column(Date, nullable=True)
    valid_until = Column(Date, nullable=True)
    
    # Vehicle information
    vehicle_vin = Column(String(100), nullable=True)
    vehicle_make = Column(String(100), nullable=True)
    vehicle_model = Column(String(100), nullable=True)
    
    # Customer information
    customer_name = Column(String(255), nullable=True)
    customer_city = Column(String(255), nullable=True)
    customer_country = Column(String(255), nullable=True)
    customer_phone = Column(String(50), nullable=True)
    customer_email = Column(String(255), nullable=True)
    
    # Shipping and currency
    currency = Column(String(3), default='USD')
    origin_incoterm = Column(String(10), nullable=True)
    origin_port = Column(String(255), nullable=True)
    
    # File attachment
    attachment_filename = Column(String(500))
    attachment_data = Column(LargeBinary)
    attachment_mime_type = Column(String(100))
    
    # Processing status
    extraction_status = Column(String(50), default='pending')  # pending, reviewed, imported, error
    
    # Tracking
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Relationships
    uploader = relationship("User", back_populates="uploaded_quotes", foreign_keys=[uploaded_by])
    items = relationship("ExtractedQuoteItem", back_populates="quote", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<ExtractedQuote({self.quote_number}, status={self.extraction_status})>"


class ExtractedQuoteItem(BaseModel):
    """Line items for extracted quotes"""
    
    __tablename__ = "extracted_quote_items"
    
    extracted_quote_id = Column(UUID(as_uuid=True), ForeignKey("extracted_quotes.id", ondelete="CASCADE"), nullable=False)
    part_name = Column(Text, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    tax_code = Column(String(20), nullable=True)
    discount = Column(Numeric(5, 2), default=0)
    total_price = Column(Numeric(12, 2), nullable=False)
    position = Column(Integer)  # Display order
    
    # Relationships
    quote = relationship("ExtractedQuote", back_populates="items")
    
    def __repr__(self):
        return f"<ExtractedQuoteItem(quote={self.extracted_quote_id}, part={self.part_name}, qty={self.quantity})>"
