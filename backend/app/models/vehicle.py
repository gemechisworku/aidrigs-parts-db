"""
Vehicle models including compatibility
"""
from sqlalchemy import Column, String, Integer, Date, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.core.database import Base


class Vehicle(BaseModel):
    """Vehicle catalog"""
    
    __tablename__ = "vehicles"
    
    vin = Column(String(17), unique=True, nullable=False, index=True)
    make = Column(String(60), nullable=False, index=True)
    model = Column(String(60), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    engine = Column(String(100))
    trim = Column(String(100))
    transmission = Column(String(50))
    drive_type = Column(String(20))  # FWD, RWD, AWD, 4WD
    
    # Relationships
    compatibility = relationship("VehiclePartCompatibility", back_populates="vehicle")
    equivalences = relationship("VehicleEquivalence", 
                              foreign_keys="VehicleEquivalence.vin_prefix",
                              back_populates="vehicle")
    
    def __repr__(self):
        return f"<Vehicle({self.year} {self.make} {self.model})>"


class VehicleEquivalence(BaseModel):
    """Vehicle family equivalence for parts compatibility"""
    
    __tablename__ = "vehicles_equivalence"
    
    vin_prefix = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=False)
    equivalent_families = Column(String(255))  # Could be JSONB array
    
    # Relationships
    vehicle = relationship("Vehicle", back_populates="equivalences")
    
    def __repr__(self):
        return f"<VehicleEquivalence({self.vin_prefix})>"


class VehiclePartCompatibility(BaseModel):
    """Parts compatibility with vehicles"""
    
    __tablename__ = "vehicles_parts_compatibility"
    
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=False)
    part_id = Column(UUID(as_uuid=True), ForeignKey("parts.id"), nullable=False)
    notes = Column(String(255))
    
    # Relationships
    vehicle = relationship("Vehicle", back_populates="compatibility")
    part = relationship("Part", back_populates="vehicle_compatibility")
    
    def __repr__(self):
        return f"<VehiclePartCompatibility(vehicle={self.vehicle_id}, part={self.part_id})>"
