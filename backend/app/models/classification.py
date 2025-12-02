"""
HS Code and category models
"""
from sqlalchemy import Column, String, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import BaseModel


class HSCode(BaseModel):
    """HS Code (Harmonized System Code) for international trade classification"""
    
    __tablename__ = "hs_codes"
    
    hs_code = Column(String(14), unique=True, nullable=False, index=True)
    description_en = Column(Text)
    description_pr = Column(Text)  # Portuguese
    description_pt = Column(Text)  # Portuguese (alternative)
    
    # Approval fields
    approval_status = Column(String(20), default="PENDING_APPROVAL", nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Relationships
    tariffs = relationship("HSCodeTariff", back_populates="hs_code_obj", cascade="all, delete-orphan")
    parts = relationship("PartTranslationStandardization", back_populates="hs_code_obj")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    creator = relationship("User", foreign_keys=[created_by])
    
    def __repr__(self):
        return f"<HSCode({self.hs_code})>"


class HSCodeTariff(BaseModel):
    """Tariff rates for HS codes by country"""
    
    __tablename__ = "hs_code_tariff"
    
    hs_code = Column(String(14), ForeignKey("hs_codes.hs_code"), nullable=False, index=True)
    country_name = Column(String(60), nullable=False)
    tariff_rate = Column(String(20))  # Can be percentage or formula
    last_updated = Column(String(20))
    
    # Relationships
    hs_code_obj = relationship("HSCode", back_populates="tariffs")
    
    def __repr__(self):
        return f"<HSCodeTariff({self.hs_code}, {self.country_name})>"


class Category(BaseModel):
    """Part categories with multi-language support"""
    
    __tablename__ = "categories"
    
    category_name_en = Column(String(255), unique=True, nullable=False, index=True)
    category_name_pr = Column(String(255))
    category_name_fr = Column(String(255))
    
    # Relationships
    parts = relationship("PartTranslationStandardization", back_populates="category_obj")
    
    def __repr__(self):
        return f"<Category({self.category_name_en})>"
