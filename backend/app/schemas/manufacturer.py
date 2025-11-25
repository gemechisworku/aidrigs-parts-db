from typing import Optional, Dict, Any
from pydantic import BaseModel, UUID4, EmailStr, HttpUrl

class ManufacturerBase(BaseModel):
    name: str
    code: Optional[str] = None
    country: Optional[str] = None
    website: Optional[HttpUrl] = None
    is_active: bool = True
    contact_info: Optional[Dict[str, Any]] = None

class ManufacturerCreate(ManufacturerBase):
    pass

class ManufacturerUpdate(ManufacturerBase):
    name: Optional[str] = None
    is_active: Optional[bool] = None

class ManufacturerResponse(ManufacturerBase):
    id: UUID4
    
    class Config:
        from_attributes = True
