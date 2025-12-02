from typing import Optional, List
from pydantic import BaseModel, UUID4, Field
from datetime import datetime
from decimal import Decimal

# Nested response models for relationships
class ManufacturerNested(BaseModel):
    id: UUID4
    mfg_id: str
    mfg_name: str
    
    class Config:
        from_attributes = True

class PartTranslationNested(BaseModel):
    part_name_en: str
    part_name_pr: Optional[str] = None
    part_name_fr: Optional[str] = None
    
    class Config:
        from_attributes = True

class PositionNested(BaseModel):
    id: UUID4
    position_id: str
    position_en: str
    
    class Config:
        from_attributes = True

# Base schema with common fields
class PartBase(BaseModel):
    part_id: str = Field(..., max_length=12, description="Unique part identifier")
    mfg_id: Optional[UUID4] = None
    part_name_en: Optional[str] = Field(None, max_length=60)
    position_id: Optional[UUID4] = None
    drive_side: str = Field(default="NA", pattern="^(NA|LHD|RHD)$")
    designation: Optional[str] = Field(None, max_length=255)
    moq: Optional[int] = Field(None, ge=0, description="Minimum order quantity")
    weight: Optional[Decimal] = Field(None, ge=0)
    width: Optional[Decimal] = Field(None, ge=0)
    length: Optional[Decimal] = Field(None, ge=0)
    height: Optional[Decimal] = Field(None, ge=0)
    note: Optional[str] = None
    image_url: Optional[str] = None

class PartCreate(PartBase):
    """Schema for creating a new part"""
    from pydantic import field_validator
    
    @field_validator('mfg_id', 'position_id', mode='before')
    @classmethod
    def empty_str_to_none(cls, v):
        """Convert empty strings to None for UUID fields"""
        if v == '' or v is None:
            return None
        return v


class PartUpdate(BaseModel):
    """Schema for updating a part - all fields optional except part_id cannot be changed"""
    mfg_id: Optional[UUID4] = None
    part_name_en: Optional[str] = Field(None, max_length=60)
    position_id: Optional[UUID4] = None
    drive_side: Optional[str] = Field(None, pattern="^(NA|LHD|RHD)$")
    designation: Optional[str] = Field(None, max_length=255)
    moq: Optional[int] = Field(None, ge=0)
    weight: Optional[Decimal] = Field(None, ge=0)
    width: Optional[Decimal] = Field(None, ge=0)
    length: Optional[Decimal] = Field(None, ge=0)
    height: Optional[Decimal] = Field(None, ge=0)
    note: Optional[str] = None
    image_url: Optional[str] = None

class PartResponse(PartBase):
    """Schema for part response with relationships"""
    id: UUID4
    created_at: datetime
    updated_at: datetime
    manufacturer: Optional[ManufacturerNested] = None
    part_translation: Optional[PartTranslationNested] = None
    position: Optional[PositionNested] = None
    approval_status: Optional[str] = None
    
    class Config:
        from_attributes = True

class PartListResponse(BaseModel):
    """Paginated list response"""
    items: List[PartResponse]
    total: int
    page: int
    pages: int
    page_size: int

class PartFilter(BaseModel):
    """Filters for parts list"""
    search: Optional[str] = None  # Search in part_id or designation
    mfg_id: Optional[UUID4] = None
    part_name_en: Optional[str] = None
    drive_side: Optional[str] = None
    page: int = 1
    page_size: int = 20

# Part Equivalence Schemas
class PartEquivalenceBase(BaseModel):
    """Base schema for part equivalence"""
    part_id: UUID4
    equivalent_part_id: UUID4

class PartEquivalenceCreate(PartEquivalenceBase):
    """Schema for creating a part equivalence relationship"""
    pass

class PartEquivalenceResponse(BaseModel):
    """Schema for part equivalence response with part details"""
    part_id: UUID4
    equivalent_part_id: UUID4
    equivalent_part: Optional[PartResponse] = None
    
    class Config:
        from_attributes = True

class PartEquivalenceBulkCreate(BaseModel):
    """Schema for bulk creating part equivalences"""
    equivalences: List[PartEquivalenceCreate]

