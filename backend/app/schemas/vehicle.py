"""
Pydantic schemas for Vehicles
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class VehicleBase(BaseModel):
    """Base vehicle schema"""
    vin: str = Field(..., max_length=17, min_length=17)
    make: str = Field(..., max_length=60)
    model: str = Field(..., max_length=60)
    year: int = Field(..., ge=1900, le=2100)
    engine: Optional[str] = Field(None, max_length=100)
    trim: Optional[str] = Field(None, max_length=100)
    transmission: Optional[str] = Field(None, max_length=50)
    drive_type: Optional[str] = Field(None, max_length=20)


class VehicleCreate(VehicleBase):
    """Schema for creating a vehicle"""
    pass


class VehicleUpdate(BaseModel):
    """Schema for updating a vehicle"""
    vin: Optional[str] = Field(None, max_length=17, min_length=17)
    make: Optional[str] = Field(None, max_length=60)
    model: Optional[str] = Field(None, max_length=60)
    year: Optional[int] = Field(None, ge=1900, le=2100)
    engine: Optional[str] = Field(None, max_length=100)
    trim: Optional[str] = Field(None, max_length=100)
    transmission: Optional[str] = Field(None, max_length=50)
    drive_type: Optional[str] = Field(None, max_length=20)


class VehicleResponse(VehicleBase):
    """Schema for vehicle response"""
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class VehicleEquivalenceBase(BaseModel):
    """Base vehicle equivalence schema"""
    equivalent_families: str = Field(..., max_length=255)


class VehicleEquivalenceCreate(VehicleEquivalenceBase):
    """Schema for creating a vehicle equivalence"""
    vin_prefix: UUID


class VehicleEquivalenceResponse(VehicleEquivalenceBase):
    """Schema for vehicle equivalence response"""
    id: UUID
    vin_prefix: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class VehiclePartCompatibilityBase(BaseModel):
    """Base vehicle part compatibility schema"""
    notes: Optional[str] = Field(None, max_length=255)


class VehiclePartCompatibilityCreate(VehiclePartCompatibilityBase):
    """Schema for creating vehicle part compatibility"""
    vehicle_id: UUID
    part_id: UUID


class VehiclePartCompatibilityResponse(VehiclePartCompatibilityBase):
    """Schema for vehicle part compatibility response"""
    id: UUID
    vehicle_id: UUID
    part_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class BulkUploadResult(BaseModel):
    """Schema for bulk upload result"""
    created: int
    updated: int
    errors: List[str]


class VehiclesPaginatedResponse(BaseModel):
    """Paginated response for vehicles"""
    items: List[VehicleResponse]
    total: int
    page: int
    page_size: int
    pages: int
