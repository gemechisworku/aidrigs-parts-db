"""
Manufacturer model
"""
from sqlalchemy import Column, String, Enum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Manufacturer(BaseModel):
    """Manufacturer model (OEM, APM, Remanufacturers)"""
    
    __tablename__ = "manufacturers"
    
    mfg_id = Column(String(10), unique=True, nullable=False, index=True)
    mfg_name = Column(String(255), nullable=False)
    mfg_type = Column(
        Enum('OEM', 'APM', 'Remanufacturers', name='manufacturer_type_enum'),
        nullable=False
    )
    country = Column(String(100))
    contact_info = Column(JSONB)  # Flexible contact information storage
    website = Column(String(255))
    certification = Column(String(255))  # e.g., ISO certification
    
    # Relationships
    parts = relationship("Part", back_populates="manufacturer")
    
    def __repr__(self):
        return f"<Manufacturer({self.mfg_id}: {self.mfg_name})>"
