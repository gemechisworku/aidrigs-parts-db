"""
Pydantic schemas for Ports
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from enum import Enum


class PortTypeEnum(str, Enum):
    """Port type enumeration"""
    SEA = "Sea"
    AIR = "Air"
    LAND = "Land"


class PortBase(BaseModel):
    """Base port schema"""
    port_code: str = Field(..., max_length=5)
    port_name: Optional[str] = Field(None, max_length=60)
    country: Optional[str] = Field(None, max_length=60)
    city: Optional[str] = Field(None, max_length=60)
    type: Optional[PortTypeEnum] = None


class PortCreate(PortBase):
    """Schema for creating a port"""
    pass


class PortUpdate(BaseModel):
    """Schema for updating a port"""
    port_code: Optional[str] = Field(None, max_length=5)
    port_name: Optional[str] = Field(None, max_length=60)
    country: Optional[str] = Field(None, max_length=60)
    city: Optional[str] = Field(None, max_length=60)
    type: Optional[PortTypeEnum] = None


class PortResponse(PortBase):
    """Schema for port response"""
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PriceTierBase(BaseModel):
    """Base price tier schema"""
    tier_name: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=252)
    tier_kind: Optional[str] = Field(None, max_length=64)


class PriceTierCreate(PriceTierBase):
    """Schema for creating a price tier"""
    pass


class PriceTierUpdate(BaseModel):
    """Schema for updating a price tier"""
    tier_name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=252)
    tier_kind: Optional[str] = Field(None, max_length=64)


class PriceTierResponse(PriceTierBase):
    """Schema for price tier response"""
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
