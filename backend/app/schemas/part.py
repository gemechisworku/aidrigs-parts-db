from typing import Optional, Dict, Any, List
from pydantic import BaseModel, UUID4, Field
from decimal import Decimal
from app.schemas.category import CategoryResponse
from app.schemas.manufacturer import ManufacturerResponse

class PartBase(BaseModel):
    part_number: str
    name: str
    description: Optional[str] = None
    category_id: Optional[UUID4] = None
    manufacturer_id: Optional[UUID4] = None
    weight_kg: Optional[Decimal] = None
    dimensions_cm: Optional[Dict[str, Decimal]] = None
    is_active: bool = True
    specifications: Optional[Dict[str, Any]] = None

class PartCreate(PartBase):
    part_number: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)

class PartUpdate(PartBase):
    part_number: Optional[str] = None
    name: Optional[str] = None
    is_active: Optional[bool] = None

class PartResponse(PartBase):
    id: UUID4
    category: Optional[CategoryResponse] = None
    manufacturer: Optional[ManufacturerResponse] = None
    
    class Config:
        from_attributes = True

class PartList(BaseModel):
    items: List[PartResponse]
    total: int
    page: int
    size: int
