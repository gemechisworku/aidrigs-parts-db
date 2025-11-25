"""
Part translation and position models
"""
from sqlalchemy import Column, String, Enum, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class PartTranslationStandardization(BaseModel):
    """Standardized part names with translations"""
    
    __tablename__ = "part_translation_standardization"
    
    part_name_en = Column(String(60), unique=True, nullable=False, index=True)
    part_name_pr = Column(String(60))
    part_name_fr = Column(String(60))
    hs_code = Column(String(14), ForeignKey("hs_codes.hs_code"))
    category_en = Column(String(60), ForeignKey("categories.category_name_en"))
    drive_side_specific = Column(Enum('yes', 'no', name='drive_side_specific_enum'), default='no')
    alternative_names = Column(String(255))  # Comma-separated or JSON
    links = Column(Text)
    
    # Relationships
    hs_code_obj = relationship("HSCode", back_populates="parts")
    category_obj = relationship("Category", back_populates="parts")
    parts = relationship("Part", back_populates="part_translation")
    
    def __repr__(self):
        return f"<PartTranslation({self.part_name_en})>"


class PositionTranslation(BaseModel):
    """Position/location translations"""
    
    __tablename__ = "position_translation"
    
    position_id = Column(String(4), unique=True, nullable=False, index=True)
    position_en = Column(String(60))
    position_pr = Column(String(60))
    position_fr = Column(String(60))
    
    # Relationships
    parts = relationship("Part", back_populates="position")
    
    def __repr__(self):
        return f"<Position({self.position_id}: {self.position_en})>"
